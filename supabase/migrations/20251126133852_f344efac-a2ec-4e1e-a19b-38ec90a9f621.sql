-- Actualizar política INSERT de expenses para incluir company_owner
DROP POLICY IF EXISTS "Users can create expenses in their branches" ON public.expenses;
CREATE POLICY "Users can create expenses in their branches"
ON public.expenses
FOR INSERT
WITH CHECK (
  (branch_id IN (SELECT get_user_branches()))
  AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role, 'cashier'::user_role]))
  AND (user_id = auth.uid())
);

-- Crear política UPDATE para expenses
CREATE POLICY "Users can update expenses in their branches"
ON public.expenses
FOR UPDATE
USING (
  (branch_id IN (SELECT get_user_branches()))
  AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role]))
  AND (user_id = auth.uid())
);

-- Crear política DELETE para expenses
CREATE POLICY "Users can delete expenses in their branches"
ON public.expenses
FOR DELETE
USING (
  (branch_id IN (SELECT get_user_branches()))
  AND (get_user_role() = ANY (ARRAY['admin'::user_role, 'company_owner'::user_role]))
  AND (user_id = auth.uid())
);