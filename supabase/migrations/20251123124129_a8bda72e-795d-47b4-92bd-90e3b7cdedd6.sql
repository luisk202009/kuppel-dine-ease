-- Agregar columna trial_days a la tabla plans
ALTER TABLE public.plans
ADD COLUMN trial_days integer DEFAULT 15;

COMMENT ON COLUMN public.plans.trial_days IS 'Número de días de prueba gratis. 0 o NULL indica sin periodo de prueba';

-- Actualizar el plan gratuito existente para que tenga 0 días de prueba
UPDATE public.plans
SET trial_days = 0
WHERE code = 'free' OR (price_monthly IS NULL AND price_yearly IS NULL);