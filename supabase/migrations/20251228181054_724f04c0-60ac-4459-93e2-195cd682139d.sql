-- =====================================================
-- Tabla de Tipos de Factura (invoice_types)
-- =====================================================
CREATE TABLE public.invoice_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Identificación
  code text NOT NULL,
  name text NOT NULL,
  description text,
  
  -- Prefijo para numeración
  prefix text NOT NULL,
  
  -- Formato de impresión: ticket_58mm, ticket_80mm, half_letter, letter
  print_format text NOT NULL DEFAULT 'ticket_80mm',
  
  -- Configuración
  is_pos_default boolean DEFAULT false,
  is_standard_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (company_id, code)
);

-- Trigger para updated_at
CREATE TRIGGER update_invoice_types_updated_at
  BEFORE UPDATE ON public.invoice_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- Agregar columna invoice_type_id a standard_invoices
-- =====================================================
ALTER TABLE public.standard_invoices 
ADD COLUMN invoice_type_id uuid REFERENCES public.invoice_types(id);

-- Agregar columna source para identificar origen (pos, manual)
ALTER TABLE public.standard_invoices
ADD COLUMN source text DEFAULT 'manual';

-- Agregar columna table_id para ventas POS con mesa
ALTER TABLE public.standard_invoices
ADD COLUMN table_id uuid REFERENCES public.tables(id);

-- =====================================================
-- Habilitar RLS en invoice_types
-- =====================================================
ALTER TABLE public.invoice_types ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver tipos de su empresa
CREATE POLICY "Users can view invoice types in their companies"
ON public.invoice_types
FOR SELECT
USING (
  is_platform_admin() OR 
  company_id IN (SELECT get_user_companies())
);

-- Política: admins y owners pueden gestionar tipos
CREATE POLICY "Admins can manage invoice types"
ON public.invoice_types
FOR ALL
USING (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'platform_admin'::user_role])) 
  AND company_id IN (SELECT get_user_companies())
)
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'platform_admin'::user_role])) 
  AND company_id IN (SELECT get_user_companies())
);

-- =====================================================
-- Función para crear tipos por defecto en nueva empresa
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_default_invoice_types()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tipo POS por defecto
  INSERT INTO public.invoice_types (company_id, code, name, prefix, print_format, is_pos_default, display_order)
  VALUES (
    NEW.id,
    'POS',
    'Ticket de Venta',
    'TK',
    'ticket_80mm',
    true,
    1
  );
  
  -- Tipo Factura Estándar por defecto
  INSERT INTO public.invoice_types (company_id, code, name, prefix, print_format, is_standard_default, display_order)
  VALUES (
    NEW.id,
    'STANDARD',
    'Factura de Venta',
    'FE',
    'half_letter',
    true,
    2
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para crear tipos al crear empresa
CREATE TRIGGER create_invoice_types_for_new_company
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_invoice_types();

-- =====================================================
-- Insertar tipos por defecto para empresas existentes
-- =====================================================
INSERT INTO public.invoice_types (company_id, code, name, prefix, print_format, is_pos_default, display_order)
SELECT id, 'POS', 'Ticket de Venta', 'TK', 'ticket_80mm', true, 1
FROM public.companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM public.invoice_types WHERE code = 'POS');

INSERT INTO public.invoice_types (company_id, code, name, prefix, print_format, is_standard_default, display_order)
SELECT id, 'STANDARD', 'Factura de Venta', 'FE', 'half_letter', true, 2
FROM public.companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM public.invoice_types WHERE code = 'STANDARD');

-- =====================================================
-- Función para generar número de factura con prefijo
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number_with_prefix(
  p_branch_id uuid,
  p_prefix text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_month text;
  v_sequence int;
  v_invoice_number text;
BEGIN
  v_year_month := to_char(CURRENT_DATE, 'YYYYMM');
  
  -- Obtener el siguiente número secuencial para este prefijo y mes
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^' || p_prefix || '-' || v_year_month || '-[0-9]+$')
      THEN (regexp_replace(invoice_number, '^.*-([0-9]+)$', '\1'))::int
      ELSE 0
    END
  ), 0) + 1
  INTO v_sequence
  FROM public.standard_invoices
  WHERE branch_id = p_branch_id
    AND invoice_number LIKE p_prefix || '-%';
  
  v_invoice_number := p_prefix || '-' || v_year_month || '-' || LPAD(v_sequence::text, 5, '0');
  
  RETURN v_invoice_number;
END;
$$;