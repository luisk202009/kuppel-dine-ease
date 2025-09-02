-- Fix user roles and RLS policies for creating tables, products, and orders

-- 1. Update handle_new_user function to default to 'cashier' instead of 'demo'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'cashier'  -- Changed from 'demo' to 'cashier'
  );
  RETURN NEW;
END;
$function$;

-- 2. Update existing 'demo' users to 'cashier' role
UPDATE public.users SET role = 'cashier' WHERE role = 'demo';

-- 3. Add RLS INSERT policy for tables (admin/manager can create)
CREATE POLICY "Admins and managers can create tables in their branches" 
ON public.tables 
FOR INSERT 
WITH CHECK (
  branch_id IN (SELECT get_user_branches()) 
  AND get_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role])
);

-- 4. Expand RLS policies for products - allow managers to manage products
DROP POLICY IF EXISTS "Admins can manage products in their companies" ON public.products;
CREATE POLICY "Admins and managers can manage products in their companies" 
ON public.products 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
)
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
);

-- 5. Expand RLS policies for categories - allow managers to manage categories
DROP POLICY IF EXISTS "Admins can manage categories in their companies" ON public.categories;
CREATE POLICY "Admins and managers can manage categories in their companies" 
ON public.categories 
FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
)
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role])) 
  AND (company_id IN (SELECT get_user_companies()))
);

-- 6. Allow waiters to create orders
DROP POLICY IF EXISTS "Users can create orders in their branches" ON public.orders;
CREATE POLICY "Users can create orders in their branches" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  branch_id IN (SELECT get_user_branches()) 
  AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role, 'waiter'::user_role])
);

-- 7. Allow waiters to manage order items
DROP POLICY IF EXISTS "Users can manage order items" ON public.order_items;
CREATE POLICY "Users can manage order items" 
ON public.order_items 
FOR ALL 
USING (
  order_id IN (
    SELECT orders.id
    FROM orders
    WHERE orders.branch_id IN (SELECT get_user_branches())
  ) 
  AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role, 'waiter'::user_role])
)
WITH CHECK (
  order_id IN (
    SELECT orders.id
    FROM orders
    WHERE orders.branch_id IN (SELECT get_user_branches())
  ) 
  AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role, 'waiter'::user_role])
);

-- 8. Create demo company, branch and associate user luis.moreno@kuppel.co
INSERT INTO public.companies (id, name, address, phone, email) 
VALUES (
  'b5e7f8c9-1234-5678-9abc-def123456789'::uuid,
  'Empresa Demo',
  'Calle Principal 123',
  '+57 300 123 4567',
  'demo@empresa.com'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, name, address, phone, company_id) 
VALUES (
  'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid,
  'Sucursal Principal',
  'Calle Principal 123',
  '+57 300 123 4567',
  'b5e7f8c9-1234-5678-9abc-def123456789'::uuid
) ON CONFLICT (id) DO NOTHING;

-- Associate user luis.moreno@kuppel.co with demo company and branch
INSERT INTO public.user_companies (user_id, company_id, branch_id)
SELECT 
  u.id,
  'b5e7f8c9-1234-5678-9abc-def123456789'::uuid,
  'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid
FROM public.users u 
WHERE u.email = 'luis.moreno@kuppel.co'
ON CONFLICT DO NOTHING;

-- Create some demo categories for the company
INSERT INTO public.categories (id, name, description, company_id) VALUES
('cat1-1234-5678-9abc-def123456789'::uuid, 'Bebidas', 'Bebidas frías y calientes', 'b5e7f8c9-1234-5678-9abc-def123456789'::uuid),
('cat2-1234-5678-9abc-def123456789'::uuid, 'Comidas', 'Platos principales y entradas', 'b5e7f8c9-1234-5678-9abc-def123456789'::uuid),
('cat3-1234-5678-9abc-def123456789'::uuid, 'Postres', 'Dulces y postres', 'b5e7f8c9-1234-5678-9abc-def123456789'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Create some demo tables for the branch
INSERT INTO public.tables (id, name, area, capacity, branch_id) VALUES
('table1-1234-5678-9abc-def123456789'::uuid, 'Mesa 1', 'Terraza', 4, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid),
('table2-1234-5678-9abc-def123456789'::uuid, 'Mesa 2', 'Terraza', 2, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid),
('table3-1234-5678-9abc-def123456789'::uuid, 'Mesa 3', 'Interior', 6, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid),
('table4-1234-5678-9abc-def123456789'::uuid, 'Mesa 4', 'Interior', 4, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid)
ON CONFLICT (id) DO NOTHING;