-- Security Fix Migration: Address Critical and High Priority Issues

-- 1. Fix Users Table - Remove privilege escalation vulnerabilities
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create secure policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update basic profile info" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND 
  -- Prevent role escalation - users cannot change their own role
  role = (SELECT role FROM public.users WHERE id = auth.uid())
);

-- 2. Add company_id to customers table for tenant isolation
ALTER TABLE public.customers ADD COLUMN company_id UUID;

-- Update existing customers to have a default company (first available)
UPDATE public.customers 
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;

-- Make company_id required after data migration
ALTER TABLE public.customers ALTER COLUMN company_id SET NOT NULL;

-- 3. Add company_id to products and categories for tenant isolation
ALTER TABLE public.products ADD COLUMN company_id UUID;
ALTER TABLE public.categories ADD COLUMN company_id UUID;

-- Update existing products and categories to have a default company
UPDATE public.products 
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;

UPDATE public.categories 
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;

-- Make company_id required after data migration
ALTER TABLE public.products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN company_id SET NOT NULL;

-- 4. Fix customers RLS policies - Remove demo bypass and add tenant scoping
DROP POLICY IF EXISTS "Users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view customers" ON public.customers;

CREATE POLICY "Users can view customers in their companies" 
ON public.customers 
FOR SELECT 
USING (
  company_id IN (SELECT get_user_companies()) AND
  get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role])
);

CREATE POLICY "Users can manage customers in their companies" 
ON public.customers 
FOR ALL 
USING (
  company_id IN (SELECT get_user_companies()) AND
  get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role])
)
WITH CHECK (
  company_id IN (SELECT get_user_companies()) AND
  get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role])
);

-- 5. Fix products RLS policies - Add tenant scoping and remove broad access
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

CREATE POLICY "Users can view products in their companies" 
ON public.products 
FOR SELECT 
USING (
  company_id IN (SELECT get_user_companies()) OR
  get_user_role() = 'admin'::user_role
);

CREATE POLICY "Admins can manage products in their companies" 
ON public.products 
FOR ALL 
USING (
  get_user_role() = 'admin'::user_role AND
  company_id IN (SELECT get_user_companies())
)
WITH CHECK (
  get_user_role() = 'admin'::user_role AND
  company_id IN (SELECT get_user_companies())
);

-- 6. Fix categories RLS policies - Add tenant scoping
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;

CREATE POLICY "Users can view categories in their companies" 
ON public.categories 
FOR SELECT 
USING (
  company_id IN (SELECT get_user_companies()) OR
  get_user_role() = 'admin'::user_role
);

CREATE POLICY "Admins can manage categories in their companies" 
ON public.categories 
FOR ALL 
USING (
  get_user_role() = 'admin'::user_role AND
  company_id IN (SELECT get_user_companies())
)
WITH CHECK (
  get_user_role() = 'admin'::user_role AND
  company_id IN (SELECT get_user_companies())
);

-- 7. Remove demo bypasses from other tables
DROP POLICY IF EXISTS "Users can view orders in their branches" ON public.orders;
CREATE POLICY "Users can view orders in their branches" 
ON public.orders 
FOR SELECT 
USING (branch_id IN (SELECT get_user_branches()));

DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
CREATE POLICY "Users can view order items" 
ON public.order_items 
FOR SELECT 
USING (
  order_id IN (
    SELECT orders.id 
    FROM orders 
    WHERE orders.branch_id IN (SELECT get_user_branches())
  )
);

DROP POLICY IF EXISTS "Users can view expenses in their branches" ON public.expenses;
CREATE POLICY "Users can view expenses in their branches" 
ON public.expenses 
FOR SELECT 
USING (branch_id IN (SELECT get_user_branches()));

DROP POLICY IF EXISTS "Users can view cash registers in their branches" ON public.cash_registers;
CREATE POLICY "Users can view cash registers in their branches" 
ON public.cash_registers 
FOR SELECT 
USING (branch_id IN (SELECT get_user_branches()));

-- 8. Change default user role from 'demo' to 'cashier'
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'cashier'::user_role;

-- Update the handle_new_user function to assign cashier role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'cashier'::user_role
  );
  RETURN NEW;
END;
$function$;

-- 9. Harden storage bucket policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;

-- More secure avatar policies
CREATE POLICY "Authenticated users can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage product images" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'product-images' AND 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'product-images' AND 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Secure reports policies
CREATE POLICY "Users can view reports in their companies" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'reports' AND
  auth.uid() IS NOT NULL AND
  -- Extract company_id from file path (assuming format: company_id/filename)
  split_part(name, '/', 1)::uuid IN (SELECT get_user_companies())
);

CREATE POLICY "Admins can manage reports in their companies" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'reports' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND
  split_part(name, '/', 1)::uuid IN (SELECT get_user_companies())
)
WITH CHECK (
  bucket_id = 'reports' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND
  split_part(name, '/', 1)::uuid IN (SELECT get_user_companies())
);