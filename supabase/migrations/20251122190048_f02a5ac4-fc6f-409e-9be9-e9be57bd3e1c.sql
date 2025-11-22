-- 1. Actualizar función handle_new_user para inicializar correctamente setup_completed y tour_completed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Insertar usuario con rol 'company_owner' por defecto y flags de setup/tour en false
  INSERT INTO public.users (id, email, name, role, setup_completed, tour_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'company_owner',  -- Nuevos usuarios son dueños de empresa por defecto
    false,  -- Requieren completar el wizard de setup
    false   -- Deben ver el tour después del wizard
  );
  RETURN NEW;
END;
$function$;

-- 2. Corregir usuarios existentes con valores NULL
UPDATE public.users
SET 
  setup_completed = COALESCE(setup_completed, false),
  tour_completed = COALESCE(tour_completed, false)
WHERE setup_completed IS NULL OR tour_completed IS NULL;