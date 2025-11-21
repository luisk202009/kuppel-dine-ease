-- ==================== PASO 2: Actualizar función de creación de usuarios ====================
-- Modificar handle_new_user() para que nuevos usuarios sean 'company_owner' por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Insertar usuario con rol 'company_owner' por defecto
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'company_owner'  -- Nuevos usuarios son dueños de empresa por defecto
  );
  RETURN NEW;
END;
$function$;

-- ==================== PASO 3: Crear función is_platform_admin() ====================
-- Función para detectar si el usuario actual es admin de la plataforma
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
      AND role = 'platform_admin'
  );
$$;

-- ==================== PASO 4: Crear función para verificar rol específico ====================
-- Función auxiliar para verificar cualquier rol del usuario actual
CREATE OR REPLACE FUNCTION public.has_user_role(_role public.user_role)
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
      AND role = _role
  );
$$;

-- ==================== PASO 5: Función para verificar si es owner de empresa ====================
-- Útil para el panel de admin interno
CREATE OR REPLACE FUNCTION public.is_company_owner()
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
      AND role = 'company_owner'
  );
$$;

-- ==================== PASO 6: Comentarios para documentación ====================
COMMENT ON FUNCTION public.is_platform_admin() IS 
  'Retorna TRUE si el usuario actual tiene rol platform_admin. Uso: SELECT is_platform_admin();';

COMMENT ON FUNCTION public.is_company_owner() IS 
  'Retorna TRUE si el usuario actual tiene rol company_owner. Uso: SELECT is_company_owner();';

COMMENT ON FUNCTION public.has_user_role(public.user_role) IS 
  'Verifica si el usuario actual tiene un rol específico. Uso: SELECT has_user_role(''staff'');';
