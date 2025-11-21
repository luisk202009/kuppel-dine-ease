-- Permitir que usuarios autenticados creen sus propias compañías
CREATE POLICY "Users can create their own companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuarios actualicen compañías donde son miembros
CREATE POLICY "Users can update their companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (id IN (SELECT get_user_companies()));

-- Permitir que usuarios autenticados creen sucursales para sus compañías
CREATE POLICY "Users can create branches for their companies"
ON public.branches
FOR INSERT
TO authenticated
WITH CHECK (company_id IN (SELECT get_user_companies()));

-- Permitir que usuarios actualicen sucursales de sus compañías
CREATE POLICY "Users can update their branches"
ON public.branches
FOR UPDATE
TO authenticated
USING (id IN (SELECT get_user_branches()));

-- Permitir que usuarios autenticados se asignen a compañías/sucursales
CREATE POLICY "Users can create their own company associations"
ON public.user_companies
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());