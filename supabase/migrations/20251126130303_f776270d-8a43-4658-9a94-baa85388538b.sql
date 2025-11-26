-- Fix RLS policies to allow company_owner to manage categories and products
-- Bug 4 & 5: Allow company_owner to create/edit categories and products

-- Update categories policies
DROP POLICY IF EXISTS "Admins can manage categories in their companies" ON public.categories;

CREATE POLICY "Company owners and admins can manage categories"
ON public.categories
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
)
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
);

-- Update products policies
DROP POLICY IF EXISTS "Admins can manage products in their companies" ON public.products;

CREATE POLICY "Company owners and admins can manage products"
ON public.products
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
)
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
);