-- Create variant_types table
CREATE TABLE IF NOT EXISTS public.variant_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type_id UUID NOT NULL REFERENCES public.variant_types(id) ON DELETE CASCADE,
  variant_value TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  sku TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, variant_type_id, variant_value)
);

-- Add has_variants column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Add variant columns to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- Enable RLS on variant_types
ALTER TABLE public.variant_types ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for variant_types
CREATE POLICY "Users can view variant types in their companies"
  ON public.variant_types
  FOR SELECT
  TO authenticated
  USING (
    is_platform_admin() 
    OR company_id IN (SELECT get_user_companies())
  );

CREATE POLICY "Company owners and admins can manage variant types"
  ON public.variant_types
  FOR ALL
  TO authenticated
  USING (
    (get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role]))
    AND company_id IN (SELECT get_user_companies())
  )
  WITH CHECK (
    (get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role]))
    AND company_id IN (SELECT get_user_companies())
  );

-- RLS Policies for product_variants
CREATE POLICY "Users can view product variants in their companies"
  ON public.product_variants
  FOR SELECT
  TO authenticated
  USING (
    is_platform_admin() 
    OR product_id IN (
      SELECT id FROM public.products 
      WHERE company_id IN (SELECT get_user_companies())
    )
  );

CREATE POLICY "Company owners and admins can manage product variants"
  ON public.product_variants
  FOR ALL
  TO authenticated
  USING (
    (get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role]))
    AND product_id IN (
      SELECT id FROM public.products 
      WHERE company_id IN (SELECT get_user_companies())
    )
  )
  WITH CHECK (
    (get_user_role() = ANY(ARRAY['admin'::user_role, 'company_owner'::user_role]))
    AND product_id IN (
      SELECT id FROM public.products 
      WHERE company_id IN (SELECT get_user_companies())
    )
  );

-- Create trigger to update updated_at
CREATE TRIGGER update_variant_types_updated_at
  BEFORE UPDATE ON public.variant_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_variant_types_company ON public.variant_types(company_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_variant_type ON public.product_variants(variant_type_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);