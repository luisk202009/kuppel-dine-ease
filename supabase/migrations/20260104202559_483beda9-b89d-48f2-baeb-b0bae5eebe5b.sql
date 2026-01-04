-- Create payment_receipts table (Recibos de Cobro)
CREATE TABLE public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  
  -- Numeración
  receipt_number text NOT NULL,
  prefix text DEFAULT 'RC',
  sequence_number integer NOT NULL,
  
  -- Relación con factura
  invoice_id uuid NOT NULL REFERENCES standard_invoices(id) ON DELETE CASCADE,
  
  -- Datos del pago
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id),
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference text,
  notes text,
  
  -- Auditoría
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE (company_id, receipt_number)
);

-- Create expense_payments table (Comprobantes de Egreso)
CREATE TABLE public.expense_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  
  -- Numeración
  payment_number text NOT NULL,
  prefix text DEFAULT 'CE',
  sequence_number integer NOT NULL,
  
  -- Relación con gasto
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  
  -- Datos del pago
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id),
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference text,
  notes text,
  
  -- Auditoría
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE (company_id, payment_number)
);

-- Add payment_status and company_id to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Update existing expenses to set company_id from branch
UPDATE expenses e
SET company_id = b.company_id
FROM branches b
WHERE e.branch_id = b.id AND e.company_id IS NULL;

-- Enable RLS
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payments ENABLE ROW LEVEL SECURITY;

-- RLS for payment_receipts
CREATE POLICY "Users can view payment receipts in their companies"
  ON payment_receipts FOR SELECT
  USING (company_id IN (SELECT get_user_companies()));

CREATE POLICY "Users can create payment receipts in their companies"
  ON payment_receipts FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_companies()) AND
    get_user_role() IN ('admin', 'company_owner', 'cashier', 'platform_admin')
  );

CREATE POLICY "Admins can update payment receipts"
  ON payment_receipts FOR UPDATE
  USING (
    company_id IN (SELECT get_user_companies()) AND
    get_user_role() IN ('admin', 'company_owner', 'platform_admin')
  );

CREATE POLICY "Admins can delete payment receipts"
  ON payment_receipts FOR DELETE
  USING (
    company_id IN (SELECT get_user_companies()) AND
    get_user_role() IN ('admin', 'company_owner', 'platform_admin')
  );

-- RLS for expense_payments
CREATE POLICY "Users can view expense payments in their companies"
  ON expense_payments FOR SELECT
  USING (company_id IN (SELECT get_user_companies()));

CREATE POLICY "Users can create expense payments in their companies"
  ON expense_payments FOR INSERT
  WITH CHECK (
    company_id IN (SELECT get_user_companies()) AND
    get_user_role() IN ('admin', 'company_owner', 'cashier', 'platform_admin')
  );

CREATE POLICY "Admins can update expense payments"
  ON expense_payments FOR UPDATE
  USING (
    company_id IN (SELECT get_user_companies()) AND
    get_user_role() IN ('admin', 'company_owner', 'platform_admin')
  );

CREATE POLICY "Admins can delete expense payments"
  ON expense_payments FOR DELETE
  USING (
    company_id IN (SELECT get_user_companies()) AND
    get_user_role() IN ('admin', 'company_owner', 'platform_admin')
  );

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number(p_company_id uuid, p_prefix text DEFAULT 'RC')
RETURNS TABLE(receipt_number text, sequence_number integer) AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COALESCE(MAX(pr.sequence_number), 0) + 1 
  INTO next_seq
  FROM payment_receipts pr
  WHERE pr.company_id = p_company_id AND pr.prefix = p_prefix;
  
  RETURN QUERY SELECT (p_prefix || next_seq::text), next_seq;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate expense payment number
CREATE OR REPLACE FUNCTION generate_expense_payment_number(p_company_id uuid, p_prefix text DEFAULT 'CE')
RETURNS TABLE(payment_number text, sequence_number integer) AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COALESCE(MAX(ep.sequence_number), 0) + 1 
  INTO next_seq
  FROM expense_payments ep
  WHERE ep.company_id = p_company_id AND ep.prefix = p_prefix;
  
  RETURN QUERY SELECT (p_prefix || next_seq::text), next_seq;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;