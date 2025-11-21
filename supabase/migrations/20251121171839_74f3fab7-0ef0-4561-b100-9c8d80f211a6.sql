-- =====================================================
-- PASO 1: LIMPIEZA DE DATOS EN ORDEN CORRECTO
-- =====================================================

-- Eliminar order_items primero (depende de orders y products)
DELETE FROM public.order_items 
WHERE order_id IN (
  SELECT id FROM public.orders
);

-- Eliminar orders (depende de tables, customers, users)
DELETE FROM public.orders;

-- Eliminar tables (depende de areas)
DELETE FROM public.tables;

-- Eliminar areas
DELETE FROM public.areas;

-- Eliminar products (ahora seguro, order_items eliminados)
DELETE FROM public.products;

-- Eliminar categories
DELETE FROM public.categories;

-- =====================================================
-- PASO 2: CORREGIR POLÍTICA RLS RECURSIVA EN USERS
-- =====================================================

-- Eliminar política recursiva problemática
DROP POLICY IF EXISTS "Users can update their own profile (no role changes)" ON public.users;

-- Crear política mejorada sin recursión
CREATE POLICY "Users can update their own profile (no role changes)"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (
    -- Usar función security definer para evitar recursión
    SELECT role FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- PASO 3: RESETEAR FLAGS DE SETUP
-- =====================================================

-- Resetear setup_completed para todos los usuarios
UPDATE public.users 
SET setup_completed = false, tour_completed = false
WHERE setup_completed = true;