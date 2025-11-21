-- ==================== Actualizar is_platform_admin() ====================
-- La función ahora verifica si el usuario tiene role = 'admin' en la tabla users
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_platform_admin() IS 
  'Retorna TRUE si el usuario actual tiene role = ''admin'' (super administrador de la plataforma)';

-- ==================== Actualizar políticas RLS para permitir acceso admin ====================

-- TABLA: companies
DROP POLICY IF EXISTS "users_select_companies" ON public.companies;
CREATE POLICY "users_select_companies" 
ON public.companies 
FOR SELECT 
USING (
  public.is_platform_admin() 
  OR owner_id = auth.uid() 
  OR id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_update_companies" ON public.companies;
CREATE POLICY "users_update_companies" 
ON public.companies 
FOR UPDATE 
USING (
  public.is_platform_admin()
  OR owner_id = auth.uid() 
  OR id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
)
WITH CHECK (
  public.is_platform_admin()
  OR owner_id = auth.uid() 
  OR id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_insert_companies" ON public.companies;
CREATE POLICY "users_insert_companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  public.is_platform_admin()
  OR owner_id = auth.uid()
);

-- TABLA: branches
DROP POLICY IF EXISTS "users_select_branches" ON public.branches;
CREATE POLICY "users_select_branches" 
ON public.branches 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR company_id IN (SELECT c.id FROM public.companies c WHERE c.owner_id = auth.uid())
  OR company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_update_branches" ON public.branches;
CREATE POLICY "users_update_branches" 
ON public.branches 
FOR UPDATE 
USING (
  public.is_platform_admin()
  OR company_id IN (SELECT c.id FROM public.companies c WHERE c.owner_id = auth.uid())
  OR company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
)
WITH CHECK (
  public.is_platform_admin()
  OR company_id IN (SELECT c.id FROM public.companies c WHERE c.owner_id = auth.uid())
  OR company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
);

DROP POLICY IF EXISTS "users_insert_branches" ON public.branches;
CREATE POLICY "users_insert_branches" 
ON public.branches 
FOR INSERT 
WITH CHECK (
  public.is_platform_admin()
  OR company_id IN (SELECT c.id FROM public.companies c WHERE c.owner_id = auth.uid())
  OR company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
);

-- TABLA: users
DROP POLICY IF EXISTS "Users can view employees in their companies (restricted PII)" ON public.users;
CREATE POLICY "Users can view employees in their companies (restricted PII)" 
ON public.users 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR id = auth.uid()
  OR id IN (SELECT uc.user_id FROM public.user_companies uc WHERE uc.company_id IN (SELECT get_user_companies()))
);

-- TABLA: categories
DROP POLICY IF EXISTS "Users can view categories in their companies" ON public.categories;
CREATE POLICY "Users can view categories in their companies" 
ON public.categories 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR company_id IN (SELECT get_user_companies())
  OR get_user_role() = 'admin'
);

-- TABLA: products
DROP POLICY IF EXISTS "Users can view products in their companies" ON public.products;
CREATE POLICY "Users can view products in their companies" 
ON public.products 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR company_id IN (SELECT get_user_companies())
  OR get_user_role() = 'admin'
);

-- TABLA: customers
DROP POLICY IF EXISTS "Users can view customers in their companies (restricted PII)" ON public.customers;
CREATE POLICY "Users can view customers in their companies (restricted PII)" 
ON public.customers 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR (company_id IN (SELECT get_user_companies()) AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role]))
);

DROP POLICY IF EXISTS "Users can manage customers in their companies" ON public.customers;
CREATE POLICY "Users can manage customers in their companies" 
ON public.customers 
FOR ALL
USING (
  public.is_platform_admin()
  OR (company_id IN (SELECT get_user_companies()) AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role]))
)
WITH CHECK (
  public.is_platform_admin()
  OR (company_id IN (SELECT get_user_companies()) AND get_user_role() = ANY (ARRAY['admin'::user_role, 'cashier'::user_role]))
);

-- TABLA: orders
DROP POLICY IF EXISTS "Users can view orders in their branches" ON public.orders;
CREATE POLICY "Users can view orders in their branches" 
ON public.orders 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR branch_id IN (SELECT get_user_branches())
);

-- TABLA: tables
DROP POLICY IF EXISTS "Users can view tables in their branches" ON public.tables;
CREATE POLICY "Users can view tables in their branches" 
ON public.tables 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR branch_id IN (SELECT get_user_branches())
);

-- TABLA: areas
DROP POLICY IF EXISTS "Users can view areas in their branches" ON public.areas;
CREATE POLICY "Users can view areas in their branches" 
ON public.areas 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR branch_id IN (SELECT get_user_branches())
);

-- TABLA: cash_registers
DROP POLICY IF EXISTS "Users can view cash registers in their branches" ON public.cash_registers;
CREATE POLICY "Users can view cash registers in their branches" 
ON public.cash_registers 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR branch_id IN (SELECT get_user_branches())
);

-- TABLA: expenses
DROP POLICY IF EXISTS "Users can view expenses in their branches" ON public.expenses;
CREATE POLICY "Users can view expenses in their branches" 
ON public.expenses 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR branch_id IN (SELECT get_user_branches())
);

-- TABLA: order_items
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
CREATE POLICY "Users can view order items" 
ON public.order_items 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR order_id IN (SELECT o.id FROM public.orders o WHERE o.branch_id IN (SELECT get_user_branches()))
);

-- TABLA: logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.logs;
CREATE POLICY "Admins can view logs" 
ON public.logs 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR get_user_role() = 'admin'
);

-- TABLA: user_companies
DROP POLICY IF EXISTS "users_select_user_companies" ON public.user_companies;
CREATE POLICY "users_select_user_companies" 
ON public.user_companies 
FOR SELECT 
USING (
  public.is_platform_admin()
  OR user_id = auth.uid()
);