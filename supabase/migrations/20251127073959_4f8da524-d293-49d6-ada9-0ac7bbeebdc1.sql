-- Fix views security issues by ensuring they respect RLS
-- The issue is that views owned by postgres bypass RLS
-- Solution: Grant appropriate permissions and ensure RLS is checked

-- Drop and recreate user_profiles to only expose public.users data
-- NOT auth.users (which would be a security violation)
DROP VIEW IF EXISTS public.user_profiles CASCADE;

CREATE VIEW public.user_profiles
WITH (security_barrier=true, security_invoker=true) AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.is_active,
  u.created_at,
  u.updated_at
FROM public.users u
WHERE EXISTS (
  SELECT 1 FROM public.user_companies uc 
  WHERE uc.user_id = u.id 
    AND uc.company_id IN (SELECT public.get_user_companies())
);

-- Grant select to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;

-- Also grant on other views
GRANT SELECT ON public.customer_profiles TO authenticated;
GRANT SELECT ON public.company_usage_stats TO authenticated;
GRANT SELECT ON public.company_monthly_sales_stats TO authenticated;
GRANT SELECT ON public.company_product_sales_stats TO authenticated;