-- Asegurar que nuevos usuarios tengan setup_completed = false por defecto
-- y que el trigger de handle_new_user funcione correctamente

-- 1. Asegurar que la columna setup_completed tenga valor por defecto
ALTER TABLE public.users 
ALTER COLUMN setup_completed SET DEFAULT false;

-- 2. Actualizar función handle_new_user para asegurar setup_completed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Insertar usuario con rol 'company_owner' por defecto y setup_completed = false
  INSERT INTO public.users (id, email, name, role, setup_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'company_owner',  -- Nuevos usuarios son dueños de empresa por defecto
    false  -- Requieren completar el wizard de setup
  );
  RETURN NEW;
END;
$$;