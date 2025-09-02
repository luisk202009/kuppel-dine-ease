-- Fix RLS policies and upgrade user to admin role

-- 1. Upgrade luis.moreno@kuppel.co to admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'luis.moreno@kuppel.co';

-- 2. Update handle_new_user function to default to 'cashier' instead of 'demo'
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

-- 3. Update existing 'demo' users to 'cashier' role  
UPDATE public.users SET role = 'cashier' WHERE role = 'demo';

-- 4. Add RLS INSERT policy for tables (admin can create)
DROP POLICY IF EXISTS "Admins can create tables in their branches" ON public.tables;
CREATE POLICY "Admins can create tables in their branches" 
ON public.tables 
FOR INSERT 
WITH CHECK (
  branch_id IN (SELECT get_user_branches()) 
  AND get_user_role() = 'admin'::user_role
);

-- 5. Allow cashiers to create orders too
DROP POLICY IF EXISTS "Users can create orders in their branches" ON public.orders;
CREATE POLICY "Users can create orders in their branches" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  branch_id IN (SELECT get_user_branches()) 
  AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role])
);

-- 6. Allow cashiers to manage order items  
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
  AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role])
)
WITH CHECK (
  order_id IN (
    SELECT orders.id
    FROM orders
    WHERE orders.branch_id IN (SELECT get_user_branches())
  ) 
  AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role])
);