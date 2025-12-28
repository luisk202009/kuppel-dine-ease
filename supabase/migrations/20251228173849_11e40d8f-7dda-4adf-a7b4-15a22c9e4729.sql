-- ============================================================
-- MÓDULO DE BANCOS: Integración con Caja, Facturas y Gastos
-- ============================================================

-- 1. Tabla de Cuentas Bancarias
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank_name text,
  account_number text,
  account_type text DEFAULT 'checking', -- 'checking', 'savings'
  currency text DEFAULT 'COP',
  initial_balance numeric(18,2) DEFAULT 0,
  current_balance numeric(18,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabla de Transacciones Bancarias
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'fee', 'adjustment')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  source_module text CHECK (source_module IN ('POS_CLOSURE', 'INVOICE', 'EXPENSE', 'MANUAL', NULL)),
  source_id uuid,
  reference_number text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id)
);

-- 3. Tabla de Reglas de Uso (Mapeo de operaciones a cuentas)
CREATE TABLE public.bank_usage_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  usage_type text NOT NULL CHECK (usage_type IN ('CASH_CLOSURE', 'INVOICE_COLLECTION', 'EXPENSE_PAYMENT')),
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  is_default boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice único para evitar duplicados de reglas por defecto
CREATE UNIQUE INDEX bank_usage_rules_unique_default 
ON public.bank_usage_rules (company_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), usage_type) 
WHERE is_default = true;

-- Índices para mejorar rendimiento
CREATE INDEX idx_bank_accounts_company ON public.bank_accounts(company_id);
CREATE INDEX idx_bank_transactions_company ON public.bank_transactions(company_id);
CREATE INDEX idx_bank_transactions_account ON public.bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON public.bank_transactions(date);
CREATE INDEX idx_bank_transactions_source ON public.bank_transactions(source_module, source_id);
CREATE INDEX idx_bank_usage_rules_company ON public.bank_usage_rules(company_id);
CREATE INDEX idx_bank_usage_rules_lookup ON public.bank_usage_rules(company_id, branch_id, usage_type, is_default);

-- ============================================================
-- RLS Policies
-- ============================================================

-- bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank accounts in their companies"
ON public.bank_accounts FOR SELECT
USING (company_id IN (SELECT get_user_companies()));

CREATE POLICY "Company owners and admins can manage bank accounts"
ON public.bank_accounts FOR ALL
USING (
  (get_user_role() IN ('admin', 'company_owner', 'platform_admin'))
  AND company_id IN (SELECT get_user_companies())
)
WITH CHECK (
  (get_user_role() IN ('admin', 'company_owner', 'platform_admin'))
  AND company_id IN (SELECT get_user_companies())
);

-- bank_transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank transactions in their companies"
ON public.bank_transactions FOR SELECT
USING (company_id IN (SELECT get_user_companies()));

CREATE POLICY "Users can create bank transactions in their companies"
ON public.bank_transactions FOR INSERT
WITH CHECK (
  (get_user_role() IN ('admin', 'company_owner', 'cashier', 'platform_admin'))
  AND company_id IN (SELECT get_user_companies())
);

CREATE POLICY "Admins can update bank transactions"
ON public.bank_transactions FOR UPDATE
USING (
  (get_user_role() IN ('admin', 'company_owner', 'platform_admin'))
  AND company_id IN (SELECT get_user_companies())
);

CREATE POLICY "Admins can delete bank transactions"
ON public.bank_transactions FOR DELETE
USING (
  (get_user_role() IN ('admin', 'company_owner', 'platform_admin'))
  AND company_id IN (SELECT get_user_companies())
);

-- bank_usage_rules
ALTER TABLE public.bank_usage_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usage rules in their companies"
ON public.bank_usage_rules FOR SELECT
USING (company_id IN (SELECT get_user_companies()));

CREATE POLICY "Company owners and admins can manage usage rules"
ON public.bank_usage_rules FOR ALL
USING (
  (get_user_role() IN ('admin', 'company_owner', 'platform_admin'))
  AND company_id IN (SELECT get_user_companies())
)
WITH CHECK (
  (get_user_role() IN ('admin', 'company_owner', 'platform_admin'))
  AND company_id IN (SELECT get_user_companies())
);

-- ============================================================
-- Trigger para actualizar saldo automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  balance_change numeric(18,2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Calcular cambio de saldo según tipo de transacción
    IF NEW.type IN ('deposit', 'transfer_in') THEN
      balance_change := NEW.amount;
    ELSE
      balance_change := -NEW.amount;
    END IF;
    
    UPDATE public.bank_accounts 
    SET current_balance = current_balance + balance_change,
        updated_at = now()
    WHERE id = NEW.bank_account_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Revertir el cambio de saldo
    IF OLD.type IN ('deposit', 'transfer_in') THEN
      balance_change := -OLD.amount;
    ELSE
      balance_change := OLD.amount;
    END IF;
    
    UPDATE public.bank_accounts 
    SET current_balance = current_balance + balance_change,
        updated_at = now()
    WHERE id = OLD.bank_account_id;
    
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió el monto o el tipo, recalcular
    IF OLD.amount != NEW.amount OR OLD.type != NEW.type OR OLD.bank_account_id != NEW.bank_account_id THEN
      -- Revertir transacción anterior
      IF OLD.type IN ('deposit', 'transfer_in') THEN
        balance_change := -OLD.amount;
      ELSE
        balance_change := OLD.amount;
      END IF;
      
      UPDATE public.bank_accounts 
      SET current_balance = current_balance + balance_change,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
      
      -- Aplicar nueva transacción
      IF NEW.type IN ('deposit', 'transfer_in') THEN
        balance_change := NEW.amount;
      ELSE
        balance_change := -NEW.amount;
      END IF;
      
      UPDATE public.bank_accounts 
      SET current_balance = current_balance + balance_change,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER bank_transaction_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_bank_account_balance();

-- ============================================================
-- Función helper para obtener cuenta bancaria según regla de uso
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_bank_account_for_usage(
  p_company_id uuid,
  p_branch_id uuid,
  p_usage_type text
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bank_account_id
  FROM public.bank_usage_rules
  WHERE company_id = p_company_id
    AND usage_type = p_usage_type
    AND is_default = true
    AND (branch_id = p_branch_id OR branch_id IS NULL)
  ORDER BY branch_id NULLS LAST -- Prioriza regla específica de sucursal
  LIMIT 1;
$$;

-- ============================================================
-- Añadir payment_method a expenses si no existe
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN payment_method text DEFAULT 'cash';
  END IF;
END $$;

-- ============================================================
-- Trigger para updated_at en tablas nuevas
-- ============================================================

CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bank_usage_rules_updated_at
BEFORE UPDATE ON public.bank_usage_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();