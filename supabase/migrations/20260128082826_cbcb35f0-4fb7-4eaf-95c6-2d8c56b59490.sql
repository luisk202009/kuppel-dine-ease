-- Actualizar el valor por defecto para nuevas empresas
ALTER TABLE public.companies 
ALTER COLUMN enabled_modules 
SET DEFAULT '{"pos": true, "cash": true, "orders": true, "reports": true, "expenses": true, "products": true, "settings": true, "customers": true, "subscriptions": true, "standardInvoicing": false, "onlineStore": false, "treasury": true, "paymentReceipts": true, "expensePayments": true}'::jsonb;

-- Agregar nuevos módulos a empresas existentes (solo si no existen)
UPDATE public.companies
SET enabled_modules = enabled_modules || 
  jsonb_build_object(
    'onlineStore', COALESCE((enabled_modules->>'onlineStore')::boolean, false),
    'treasury', COALESCE((enabled_modules->>'treasury')::boolean, true),
    'paymentReceipts', COALESCE((enabled_modules->>'paymentReceipts')::boolean, true),
    'expensePayments', COALESCE((enabled_modules->>'expensePayments')::boolean, true)
  )
WHERE enabled_modules IS NOT NULL;