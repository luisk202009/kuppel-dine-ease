-- Allow platform admins to update any user (including role changes)
CREATE POLICY "Platform admins can update any user" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());