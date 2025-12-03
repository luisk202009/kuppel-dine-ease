-- Add payment_link column to company_subscriptions
ALTER TABLE public.company_subscriptions 
ADD COLUMN payment_link text;

COMMENT ON COLUMN public.company_subscriptions.payment_link IS 
  'URL de pago externa para actualizar o renovar la suscripción';