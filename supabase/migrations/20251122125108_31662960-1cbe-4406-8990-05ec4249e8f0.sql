-- Revert security_invoker to false (default) for all views
-- This allows views to execute with the permissions of the view owner (postgres)
-- which bypasses RLS and allows proper data access
ALTER VIEW user_profiles SET (security_invoker = false);
ALTER VIEW customer_profiles SET (security_invoker = false);
ALTER VIEW company_usage_stats SET (security_invoker = false);
ALTER VIEW company_product_sales_stats SET (security_invoker = false);
ALTER VIEW company_monthly_sales_stats SET (security_invoker = false);