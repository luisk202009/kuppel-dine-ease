-- ==================== PASO 1: Extender enum de roles ====================
-- Agregar nuevos roles al enum existente user_role
-- Cada ALTER TYPE debe ejecutarse en su propia transacción
DO $$ 
BEGIN
  -- Agregar platform_admin si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'platform_admin' 
    AND enumtypid = 'public.user_role'::regtype
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'platform_admin';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Agregar company_owner si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'company_owner' 
    AND enumtypid = 'public.user_role'::regtype
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'company_owner';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Agregar staff si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'staff' 
    AND enumtypid = 'public.user_role'::regtype
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'staff';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Agregar viewer si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'viewer' 
    AND enumtypid = 'public.user_role'::regtype
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'viewer';
  END IF;
END $$;

-- ==================== COMENTARIO ====================
COMMENT ON TYPE public.user_role IS 
  'Roles del sistema:
  - platform_admin: Administradores de la plataforma Kuppel
  - company_owner: Dueños de empresas registradas
  - admin: Administradores de empresa
  - staff: Empleados con acceso limitado
  - cashier: Cajeros
  - viewer: Solo lectura
  - demo: Usuario de demostración';
