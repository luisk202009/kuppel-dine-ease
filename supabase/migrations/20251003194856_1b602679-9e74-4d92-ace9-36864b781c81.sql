-- Fix: Add company-scoped RLS policies for users table
-- This ensures users can only see employees within their own company

-- Drop the overly restrictive deny policy
DROP POLICY IF EXISTS "Deny all anonymous access to users table" ON public.users;

-- Drop the old view policy
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.users;

-- Add comprehensive company-scoped SELECT policy
CREATE POLICY "Users can view employees in their companies"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  id = auth.uid()
  OR
  -- Users can see other users in their companies
  id IN (
    SELECT uc.user_id
    FROM public.user_companies uc
    WHERE uc.company_id IN (SELECT get_user_companies())
  )
);

-- Ensure update policy remains strict (own profile only, no role changes)
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.users;

CREATE POLICY "Users can update their own profile (no role changes)"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())
);