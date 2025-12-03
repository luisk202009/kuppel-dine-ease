-- Add enabled_modules column to companies table
ALTER TABLE public.companies 
ADD COLUMN enabled_modules jsonb DEFAULT '{
  "settings": true,
  "subscriptions": true,
  "products": true,
  "customers": true,
  "orders": true,
  "reports": true,
  "expenses": true,
  "cash": true
}'::jsonb;