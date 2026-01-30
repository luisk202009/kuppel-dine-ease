-- Agregar standardInvoicing a enabled_modules para todas las empresas existentes
UPDATE companies 
SET enabled_modules = enabled_modules || '{"standardInvoicing": false}'::jsonb
WHERE NOT (enabled_modules ? 'standardInvoicing');

-- Actualizar el valor por defecto de la columna para nuevas empresas
ALTER TABLE companies 
ALTER COLUMN enabled_modules 
SET DEFAULT '{"pos": true, "cash": true, "orders": true, "reports": true, "expenses": true, "products": true, "settings": true, "treasury": true, "customers": true, "onlineStore": false, "subscriptions": true, "expensePayments": true, "paymentReceipts": true, "standardInvoicing": false}'::jsonb;