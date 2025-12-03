-- Actualizar valor default de enabled_modules para incluir pos
ALTER TABLE public.companies 
ALTER COLUMN enabled_modules 
SET DEFAULT '{"settings": true, "subscriptions": true, "products": true, "customers": true, "orders": true, "reports": true, "expenses": true, "cash": true, "pos": true}'::jsonb;

-- Agregar pos=true a empresas existentes que no tengan la key
UPDATE public.companies 
SET enabled_modules = COALESCE(enabled_modules, '{}'::jsonb) || '{"pos": true}'::jsonb
WHERE NOT (COALESCE(enabled_modules, '{}'::jsonb) ? 'pos');