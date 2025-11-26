-- Actualizar política de customers para incluir company_owner
DROP POLICY IF EXISTS "Users can manage customers in their companies" ON public.customers;
CREATE POLICY "Users can manage customers in their companies"
ON public.customers
FOR ALL
USING (
  is_platform_admin() OR (
    (company_id IN (SELECT get_user_companies()))
    AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]))
  )
)
WITH CHECK (
  is_platform_admin() OR (
    (company_id IN (SELECT get_user_companies()))
    AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]))
  )
);

-- Actualizar política SELECT de customers
DROP POLICY IF EXISTS "Users can view customers in their companies (restricted PII)" ON public.customers;
CREATE POLICY "Users can view customers in their companies"
ON public.customers
FOR SELECT
USING (
  is_platform_admin() OR (
    (company_id IN (SELECT get_user_companies()))
    AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role, 'staff'::user_role]))
  )
);

-- Actualizar política de orders para INSERT
DROP POLICY IF EXISTS "Users can create orders in their branches" ON public.orders;
CREATE POLICY "Users can create orders in their branches"
ON public.orders
FOR INSERT
WITH CHECK (
  (branch_id IN (SELECT get_user_branches()))
  AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]))
);

-- Actualizar política de orders para UPDATE
DROP POLICY IF EXISTS "Users can update orders in their branches" ON public.orders;
CREATE POLICY "Users can update orders in their branches"
ON public.orders
FOR UPDATE
USING (
  (branch_id IN (SELECT get_user_branches()))
  AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]))
);

-- Actualizar política de order_items
DROP POLICY IF EXISTS "Users can manage order items" ON public.order_items;
CREATE POLICY "Users can manage order items"
ON public.order_items
FOR ALL
USING (
  (order_id IN (SELECT id FROM orders WHERE branch_id IN (SELECT get_user_branches())))
  AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]))
)
WITH CHECK (
  (order_id IN (SELECT id FROM orders WHERE branch_id IN (SELECT get_user_branches())))
  AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]))
);