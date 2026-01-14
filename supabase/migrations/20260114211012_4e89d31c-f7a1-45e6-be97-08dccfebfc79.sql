-- Create a table for online store orders (public access)
CREATE TABLE public.online_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for online order items
CREATE TABLE public.online_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for order numbers per company
CREATE OR REPLACE FUNCTION generate_online_order_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sequence INTEGER;
  v_order_number TEXT;
BEGIN
  -- Get the next sequence number for this company
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(order_number, '[^0-9]', '', 'g'), '') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM online_orders
  WHERE company_id = p_company_id;
  
  -- Format the order number
  v_order_number := 'WEB-' || LPAD(v_sequence::TEXT, 5, '0');
  
  RETURN v_order_number;
END;
$$;

-- Enable RLS
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;

-- RLS for online_orders: Anyone can insert (public store), only company users can view
CREATE POLICY "Anyone can create online orders for active public stores"
ON public.online_orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE id = company_id 
    AND is_active = true 
    AND public_store_enabled = true
  )
);

CREATE POLICY "Company users can view their online orders"
ON public.online_orders
FOR SELECT
USING (
  is_platform_admin() OR 
  company_id IN (SELECT get_user_companies())
);

CREATE POLICY "Company users can update their online orders"
ON public.online_orders
FOR UPDATE
USING (
  is_platform_admin() OR 
  company_id IN (SELECT get_user_companies())
);

-- RLS for online_order_items
CREATE POLICY "Anyone can create online order items"
ON public.online_order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM online_orders o
    JOIN companies c ON o.company_id = c.id
    WHERE o.id = order_id
    AND c.is_active = true
    AND c.public_store_enabled = true
  )
);

CREATE POLICY "Company users can view their online order items"
ON public.online_order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM online_orders o
    WHERE o.id = order_id
    AND (is_platform_admin() OR o.company_id IN (SELECT get_user_companies()))
  )
);

-- Create indexes for performance
CREATE INDEX idx_online_orders_company_id ON public.online_orders(company_id);
CREATE INDEX idx_online_orders_status ON public.online_orders(status);
CREATE INDEX idx_online_orders_created_at ON public.online_orders(created_at DESC);
CREATE INDEX idx_online_order_items_order_id ON public.online_order_items(order_id);