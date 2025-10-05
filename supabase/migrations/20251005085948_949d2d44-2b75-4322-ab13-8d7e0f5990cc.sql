-- Drop the existing user_profiles view
DROP VIEW IF EXISTS public.user_profiles;

-- Recreate the view with SECURITY INVOKER to ensure it uses the querying user's permissions
CREATE VIEW public.user_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  role,
  is_active,
  created_at,
  updated_at,
  name,
  -- Only show email for the authenticated user's own record
  CASE 
    WHEN id = auth.uid() THEN email
    ELSE NULL
  END as email
FROM public.users;

-- Grant SELECT access to authenticated users (actual access still controlled by underlying RLS)
GRANT SELECT ON public.user_profiles TO authenticated;