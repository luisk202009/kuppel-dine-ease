-- Drop and recreate user_profiles view with security_invoker to inherit RLS from users table
DROP VIEW IF EXISTS public.user_profiles;

CREATE VIEW public.user_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  role,
  is_active,
  created_at,
  updated_at,
  email,
  name
FROM public.users;

-- Grant SELECT access to authenticated users (actual access controlled by underlying RLS on users table)
GRANT SELECT ON public.user_profiles TO authenticated;

COMMENT ON VIEW public.user_profiles IS 'Employee profiles view with security_invoker - inherits RLS from users table (users see their own + company employees, admins see all).';