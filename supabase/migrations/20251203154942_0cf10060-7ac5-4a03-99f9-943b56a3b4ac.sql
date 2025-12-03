-- Add show_in_wizard column to plans table
ALTER TABLE public.plans 
ADD COLUMN show_in_wizard boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.plans.show_in_wizard IS 
  'Controla si el plan se muestra en el wizard de onboarding para nuevos usuarios';