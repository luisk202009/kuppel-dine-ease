-- Fix security vulnerability: Prevent anonymous access to user email addresses

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with proper authentication requirements
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update basic profile info" ON public.users;

-- Create secure policy for viewing own profile (authenticated users only)
CREATE POLICY "Authenticated users can view their own profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Create secure policy for updating own profile (authenticated users only)  
CREATE POLICY "Authenticated users can update their own profile" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())
);

-- Ensure no anonymous access is possible by explicitly denying all operations to anon users
CREATE POLICY "Deny all anonymous access to users table" 
ON public.users 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);