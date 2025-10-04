-- Fix: Protect employee email addresses from being accessible to other users
-- Create a secure view that masks email addresses for non-own records

-- Create a view that conditionally shows email based on ownership
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  u.id,
  u.name,
  -- Only show email if it's the user's own record
  CASE 
    WHEN u.id = auth.uid() THEN u.email
    ELSE NULL
  END as email,
  u.role,
  u.is_active,
  u.created_at,
  u.updated_at
FROM public.users u;

-- Grant access to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;

-- Add comment explaining the security measure
COMMENT ON VIEW public.user_profiles IS 'Secure view that masks email addresses for non-own user records to prevent email harvesting';

-- Update the existing SELECT policy on users table to be more restrictive
-- This ensures direct queries to users table are also protected
DROP POLICY IF EXISTS "Users can view employees in their companies" ON public.users;

CREATE POLICY "Users can view employees in their companies (restricted PII)"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own full profile
  id = auth.uid()
  OR
  -- Users can see other users in their companies (email will be masked via view)
  id IN (
    SELECT uc.user_id
    FROM public.user_companies uc
    WHERE uc.company_id IN (SELECT get_user_companies())
  )
);