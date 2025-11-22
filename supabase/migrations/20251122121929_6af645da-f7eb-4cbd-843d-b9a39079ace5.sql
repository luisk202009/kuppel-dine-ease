-- Asegurar políticas RLS correctas para multi-tenant y usuarios nuevos

-- ============= 1. Políticas para COMPANIES =============
-- Usuarios pueden crear sus propias empresas (necesario para onboarding)
DROP POLICY IF EXISTS "users_insert_own_companies" ON public.companies;
CREATE POLICY "users_insert_own_companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- ============= 2. Políticas para USER_COMPANIES =============
-- Usuarios pueden asociarse a empresas que crean
DROP POLICY IF EXISTS "users_manage_own_companies_relations" ON public.user_companies;
CREATE POLICY "users_manage_own_companies_relations"
ON public.user_companies
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR company_id IN (
  SELECT id FROM public.companies WHERE owner_id = auth.uid()
))
WITH CHECK (user_id = auth.uid() OR company_id IN (
  SELECT id FROM public.companies WHERE owner_id = auth.uid()
));

-- ============= 3. Políticas para AREAS =============
-- Mejorar política para creación de áreas - asegurar que funcione para nuevos usuarios
DROP POLICY IF EXISTS "Admins can manage areas in their branches" ON public.areas;
CREATE POLICY "Users can manage areas in their branches"
ON public.areas
FOR ALL
TO authenticated
USING (
  branch_id IN (
    SELECT b.id 
    FROM public.branches b
    INNER JOIN public.user_companies uc ON b.company_id = uc.company_id
    WHERE uc.user_id = auth.uid()
  )
  OR
  branch_id IN (
    SELECT b.id
    FROM public.branches b
    INNER JOIN public.companies c ON b.company_id = c.id
    WHERE c.owner_id = auth.uid()
  )
)
WITH CHECK (
  branch_id IN (
    SELECT b.id 
    FROM public.branches b
    INNER JOIN public.user_companies uc ON b.company_id = uc.company_id
    WHERE uc.user_id = auth.uid()
  )
  OR
  branch_id IN (
    SELECT b.id
    FROM public.branches b
    INNER JOIN public.companies c ON b.company_id = c.id
    WHERE c.owner_id = auth.uid()
  )
);

-- ============= 4. Políticas para TABLES =============
-- Asegurar que los usuarios puedan crear mesas en sus branches
DROP POLICY IF EXISTS "Admins can create tables in their branches" ON public.tables;
DROP POLICY IF EXISTS "Users can create tables in their branches" ON public.tables;

CREATE POLICY "Users can manage tables in their branches"
ON public.tables
FOR ALL
TO authenticated
USING (
  branch_id IN (
    SELECT b.id 
    FROM public.branches b
    INNER JOIN public.user_companies uc ON b.company_id = uc.company_id
    WHERE uc.user_id = auth.uid()
  )
  OR
  branch_id IN (
    SELECT b.id
    FROM public.branches b
    INNER JOIN public.companies c ON b.company_id = c.id
    WHERE c.owner_id = auth.uid()
  )
)
WITH CHECK (
  branch_id IN (
    SELECT b.id 
    FROM public.branches b
    INNER JOIN public.user_companies uc ON b.company_id = uc.company_id
    WHERE uc.user_id = auth.uid()
  )
  OR
  branch_id IN (
    SELECT b.id
    FROM public.branches b
    INNER JOIN public.companies c ON b.company_id = c.id
    WHERE c.owner_id = auth.uid()
  )
);