-- Create a view that masks sensitive customer PII based on user role
CREATE VIEW public.customer_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  company_id,
  name,
  last_name,
  -- Mask identification for non-admins (show only last 4 characters)
  CASE 
    WHEN get_user_role() = 'admin' THEN identification
    WHEN identification IS NOT NULL AND length(identification) > 4 THEN '****' || right(identification, 4)
    ELSE NULL
  END as identification,
  phone,
  email,
  city,
  -- Mask full address for non-admins
  CASE 
    WHEN get_user_role() = 'admin' THEN address
    ELSE NULL
  END as address,
  notes,
  created_at,
  updated_at
FROM public.customers;

-- Grant SELECT access to authenticated users (actual access controlled by underlying RLS)
GRANT SELECT ON public.customer_profiles TO authenticated;

-- Update the RLS policy description to reflect the new masked view approach
COMMENT ON POLICY "Users can view customers in their companies (restricted PII)" ON public.customers IS 'Full customer data access. Use customer_profiles view for masked PII access.';