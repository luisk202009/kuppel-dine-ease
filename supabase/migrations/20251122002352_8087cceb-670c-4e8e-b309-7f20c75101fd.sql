-- Ajustar RLS de plans para permitir SELECT a usuarios autenticados
-- Solo planes activos son visibles para usuarios normales

-- La política de admin ya existe, solo añadimos la de SELECT para usuarios autenticados
CREATE POLICY "Authenticated users can view active plans"
ON public.plans
FOR SELECT
TO authenticated
USING (is_active = true);