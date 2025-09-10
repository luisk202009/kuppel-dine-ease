-- Fix user roles and add missing permissions with proper UUIDs

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
    'cashier'
  );
  RETURN NEW;
END;
$function$;

-- 2. Update existing 'demo' users to 'cashier' role
UPDATE public.users SET role = 'cashier' WHERE role = 'demo';

-- 3. Update user luis.moreno@kuppel.co to admin role
UPDATE public.users SET role = 'admin' WHERE email = 'luis.moreno@kuppel.co';

-- 4. Add missing INSERT policy for tables (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can create tables in their branches' 
        AND tablename = 'tables'
    ) THEN
        CREATE POLICY "Admins can create tables in their branches" 
        ON public.tables 
        FOR INSERT 
        WITH CHECK (
          branch_id IN (SELECT get_user_branches()) 
          AND get_user_role() = 'admin'::user_role
        );
    END IF;
END
$$;

-- 5. Create demo company, branch and associate user
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

-- Create demo categories for the company with proper UUIDs
INSERT INTO public.categories (id, name, description, company_id) VALUES
('11111111-1234-5678-9abc-def123456789'::uuid, 'Bebidas', 'Bebidas frías y calientes', 'b5e7f8c9-1234-5678-9abc-def123456789'::uuid),
('22222222-1234-5678-9abc-def123456789'::uuid, 'Comidas', 'Platos principales y entradas', 'b5e7f8c9-1234-5678-9abc-def123456789'::uuid),
('33333333-1234-5678-9abc-def123456789'::uuid, 'Postres', 'Dulces y postres', 'b5e7f8c9-1234-5678-9abc-def123456789'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Create demo tables for the branch with proper UUIDs  
INSERT INTO public.tables (id, name, area, capacity, branch_id) VALUES
('44444444-1234-5678-9abc-def123456789'::uuid, 'Mesa 1', 'Terraza', 4, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid),
('55555555-1234-5678-9abc-def123456789'::uuid, 'Mesa 2', 'Terraza', 2, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid),
('66666666-1234-5678-9abc-def123456789'::uuid, 'Mesa 3', 'Interior', 6, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid),
('77777777-1234-5678-9abc-def123456789'::uuid, 'Mesa 4', 'Interior', 4, 'a1b2c3d4-5678-9abc-def1-23456789abcd'::uuid)
ON CONFLICT (id) DO NOTHING;