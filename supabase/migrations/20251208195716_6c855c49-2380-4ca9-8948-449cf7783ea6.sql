-- Create standard_invoices table for standard/service invoicing
CREATE TABLE public.standard_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  customer_id uuid REFERENCES public.customers(id),
  invoice_number text NOT NULL,
  
  -- Dates
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  
  -- Currency
  currency text NOT NULL DEFAULT 'COP',
  
  -- Totals
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  total_tax numeric(12,2) NOT NULL DEFAULT 0,
  total_discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  
  -- Payment
  payment_method text,
  payment_reference text,
  
  -- Status: draft, issued, paid, cancelled, overdue
  status text NOT NULL DEFAULT 'draft',
  
  -- Notes/Conditions
  notes text,
  terms_conditions text,
  
  -- Audit
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create standard_invoice_items table
CREATE TABLE public.standard_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.standard_invoices(id) ON DELETE CASCADE,
  
  -- Can be existing product or free-text
  product_id uuid REFERENCES public.products(id),
  item_name text NOT NULL,
  description text,
  
  -- Values
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_rate numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standard_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_invoice_items ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_standard_invoices_branch_id ON public.standard_invoices(branch_id);
CREATE INDEX idx_standard_invoices_customer_id ON public.standard_invoices(customer_id);
CREATE INDEX idx_standard_invoices_status ON public.standard_invoices(status);
CREATE INDEX idx_standard_invoices_issue_date ON public.standard_invoices(issue_date);
CREATE INDEX idx_standard_invoice_items_invoice_id ON public.standard_invoice_items(invoice_id);

-- RLS Policies for standard_invoices
CREATE POLICY "Users can view invoices in their branches"
ON public.standard_invoices
FOR SELECT
USING (
  is_platform_admin() OR 
  branch_id IN (SELECT get_user_branches())
);

CREATE POLICY "Users can create invoices in their branches"
ON public.standard_invoices
FOR INSERT
WITH CHECK (
  branch_id IN (SELECT get_user_branches()) AND
  get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]) AND
  created_by = auth.uid()
);

CREATE POLICY "Users can update invoices in their branches"
ON public.standard_invoices
FOR UPDATE
USING (
  branch_id IN (SELECT get_user_branches()) AND
  get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role])
);

CREATE POLICY "Users can delete draft invoices in their branches"
ON public.standard_invoices
FOR DELETE
USING (
  branch_id IN (SELECT get_user_branches()) AND
  get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role]) AND
  status = 'draft'
);

-- RLS Policies for standard_invoice_items
CREATE POLICY "Users can view invoice items"
ON public.standard_invoice_items
FOR SELECT
USING (
  is_platform_admin() OR
  invoice_id IN (
    SELECT id FROM public.standard_invoices 
    WHERE branch_id IN (SELECT get_user_branches())
  )
);

CREATE POLICY "Users can manage invoice items"
ON public.standard_invoice_items
FOR ALL
USING (
  invoice_id IN (
    SELECT id FROM public.standard_invoices 
    WHERE branch_id IN (SELECT get_user_branches())
  ) AND
  get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role])
)
WITH CHECK (
  invoice_id IN (
    SELECT id FROM public.standard_invoices 
    WHERE branch_id IN (SELECT get_user_branches())
  ) AND
  get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role])
);

-- Trigger for updated_at
CREATE TRIGGER update_standard_invoices_updated_at
BEFORE UPDATE ON public.standard_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();