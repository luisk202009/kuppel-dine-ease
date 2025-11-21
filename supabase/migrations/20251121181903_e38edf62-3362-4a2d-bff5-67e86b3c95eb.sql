-- ============================================================================
-- MIGRACIÓN: Eliminar dependencias circulares en RLS
-- ============================================================================
-- PROBLEMA: Las políticas actuales crean dependencias circulares entre
--           companies, user_companies y branches, causando errores al crear
--           nuevas companies.
--
-- SOLUCIÓN: 
--   1. Agregar owner_id a companies para identificar al creador
--   2. Eliminar políticas antiguas con dependencias circulares
--   3. Crear políticas nuevas basadas en owner_id que permiten:
--      - Crear company sin depender de user_companies
--      - Crear branches verificando owner_id directamente
--      - Mantener acceso para miembros adicionales vía user_companies
-- ============================================================================

-- PASO 1: Agregar columna owner_id a companies
-- ============================================================================
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para mejorar performance de queries RLS
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);

-- PASO 2: Migrar datos existentes
-- ============================================================================
-- Para companies existentes, asignar como owner al primer usuario asociado en user_companies
UPDATE public.companies c
SET owner_id = (
  SELECT uc.user_id 
  FROM public.user_companies uc 
  WHERE uc.company_id = c.id 
  ORDER BY uc.created_at ASC 
  LIMIT 1
)
WHERE owner_id IS NULL;

-- PASO 3: Eliminar políticas antiguas con dependencias circulares
-- ============================================================================

-- Eliminar políticas de companies
DROP POLICY IF EXISTS "Users can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their companies" ON public.companies;

-- Eliminar políticas de branches
DROP POLICY IF EXISTS "Users can view their branches" ON public.branches;
DROP POLICY IF EXISTS "Users can create branches for their companies" ON public.branches;
DROP POLICY IF EXISTS "Users can update their branches" ON public.branches;

-- Eliminar políticas de user_companies
DROP POLICY IF EXISTS "Users can view their own company associations" ON public.user_companies;
DROP POLICY IF EXISTS "Users can create their own company associations" ON public.user_companies;

-- PASO 4: Crear nuevas políticas SIN dependencias circulares
-- ============================================================================

-- ============================================================================
-- POLÍTICAS PARA: public.companies
-- ============================================================================
-- Lógica: Un usuario puede acceder a companies que:
--   - Él creó (owner_id = auth.uid()), O
--   - Está asignado vía user_companies
-- ============================================================================

-- SELECT: Ver companies propias o asignadas
CREATE POLICY "users_select_companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() 
  OR 
  id IN (
    SELECT company_id 
    FROM public.user_companies 
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Crear companies donde el usuario es el owner
CREATE POLICY "users_insert_companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Actualizar solo companies propias o asignadas
CREATE POLICY "users_update_companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR 
  id IN (
    SELECT company_id 
    FROM public.user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR 
  id IN (
    SELECT company_id 
    FROM public.user_companies 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- POLÍTICAS PARA: public.user_companies
-- ============================================================================
-- Lógica: Usuarios solo pueden ver y crear sus propias asociaciones
-- ============================================================================

-- SELECT: Ver solo asociaciones propias
CREATE POLICY "users_select_user_companies"
ON public.user_companies
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Crear asociaciones solo para sí mismo
CREATE POLICY "users_insert_user_companies"
ON public.user_companies
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Los owners pueden actualizar asociaciones de su company
CREATE POLICY "owners_update_user_companies"
ON public.user_companies
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  company_id IN (
    SELECT id 
    FROM public.companies 
    WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- POLÍTICAS PARA: public.branches
-- ============================================================================
-- Lógica: Acceso a branches de companies que el usuario posee o está asignado
-- SIN usar funciones que causen dependencias circulares
-- ============================================================================

-- SELECT: Ver branches de companies propias o asignadas
CREATE POLICY "users_select_branches"
ON public.branches
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT c.id
    FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT uc.company_id
    FROM public.user_companies uc
    WHERE uc.user_id = auth.uid()
  )
);

-- INSERT: Crear branches para companies propias o asignadas
-- IMPORTANTE: Esta política NO depende de que user_companies ya exista
--             porque verifica PRIMERO si eres owner (owner_id = auth.uid())
CREATE POLICY "users_insert_branches"
ON public.branches
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT c.id
    FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT uc.company_id
    FROM public.user_companies uc
    WHERE uc.user_id = auth.uid()
  )
);

-- UPDATE: Actualizar branches de companies propias o asignadas
CREATE POLICY "users_update_branches"
ON public.branches
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT c.id
    FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT uc.company_id
    FROM public.user_companies uc
    WHERE uc.user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT c.id
    FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT uc.company_id
    FROM public.user_companies uc
    WHERE uc.user_id = auth.uid()
  )
);

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================
-- FLUJO DE CREACIÓN AHORA FUNCIONA ASÍ:
--
-- 1. Usuario crea company con owner_id = auth.uid()
--    ✅ INSERT policy verifica: owner_id = auth.uid() → PASA
--
-- 2. Usuario crea user_companies para asociarse
--    ✅ INSERT policy verifica: user_id = auth.uid() → PASA
--
-- 3. Usuario crea branch con company_id
--    ✅ INSERT policy verifica: 
--       - company_id está en companies donde owner_id = auth.uid() → PASA
--       (No necesita que user_companies exista porque ya eres owner)
--
-- ESTO ELIMINA LA DEPENDENCIA CIRCULAR porque:
-- - Companies no depende de user_companies para INSERT
-- - Branches verifica ownership DIRECTAMENTE en companies.owner_id
-- - user_companies puede crearse independientemente
--
-- ============================================================================