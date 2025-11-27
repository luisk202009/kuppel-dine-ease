-- Fix SECURITY DEFINER views to use SECURITY INVOKER with proper company filtering
-- This prevents users from seeing data from other companies

-- Drop existing views
DROP VIEW IF EXISTS public.company_monthly_sales_stats CASCADE;
DROP VIEW IF EXISTS public.company_product_sales_stats CASCADE;
DROP VIEW IF EXISTS public.company_usage_stats CASCADE;
DROP VIEW IF EXISTS public.customer_profiles CASCADE;
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Recreate company_monthly_sales_stats with SECURITY INVOKER (default) and company filter
CREATE VIEW public.company_monthly_sales_stats AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  DATE_TRUNC('month', o.created_at)::date AS year_month,
  TO_CHAR(DATE_TRUNC('month', o.created_at), 'Mon YYYY') AS month_label,
  COUNT(o.id)::integer AS total_orders_month,
  COALESCE(SUM(o.total), 0)::numeric(10,2) AS total_sales_month
FROM public.companies c
JOIN public.branches b ON b.company_id = c.id AND b.is_active = true
JOIN public.orders o ON o.branch_id = b.id 
  AND o.status IN ('paid', 'delivered')
  AND o.created_at >= NOW() - INTERVAL '1 year'
WHERE c.id IN (SELECT public.get_user_companies())
GROUP BY c.id, c.name, DATE_TRUNC('month', o.created_at)
ORDER BY c.name, DATE_TRUNC('month', o.created_at);

-- Recreate company_product_sales_stats with company filter
CREATE VIEW public.company_product_sales_stats AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  p.id AS product_id,
  p.name AS product_name,
  COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
  COALESCE(SUM(oi.total_price), 0) AS total_sales_amount,
  COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN oi.quantity ELSE 0 END), 0) AS total_quantity_last_30d,
  COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN oi.total_price ELSE 0 END), 0) AS total_sales_last_30d
FROM public.companies c
JOIN public.branches b ON b.company_id = c.id
JOIN public.orders o ON o.branch_id = b.id
JOIN public.order_items oi ON oi.order_id = o.id
JOIN public.products p ON p.id = oi.product_id
WHERE o.status IN ('paid', 'delivered')
  AND c.id IN (SELECT public.get_user_companies())
GROUP BY c.id, c.name, p.id, p.name;

-- Recreate company_usage_stats with company filter
CREATE VIEW public.company_usage_stats AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.business_type,
  c.is_active AS company_is_active,
  c.created_at AS company_created_at,
  (SELECT COUNT(DISTINCT uc.user_id) FROM public.user_companies uc WHERE uc.company_id = c.id) AS users_count,
  (SELECT COUNT(*) FROM public.branches b WHERE b.company_id = c.id AND b.is_active = true) AS branches_count,
  (SELECT COUNT(*) FROM public.products p WHERE p.company_id = c.id AND p.is_active = true) AS products_count,
  (SELECT COUNT(*) FROM public.categories cat WHERE cat.company_id = c.id AND cat.is_active = true) AS categories_count,
  (SELECT COUNT(*) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id) AS total_orders,
  (SELECT COALESCE(SUM(o.total), 0) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.status = 'paid') AS total_sales_amount,
  (SELECT COUNT(*) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.created_at >= NOW() - INTERVAL '30 days') AS total_orders_last_30d,
  (SELECT COALESCE(SUM(o.total), 0) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.status = 'paid' AND o.created_at >= NOW() - INTERVAL '30 days') AS total_sales_last_30d,
  (SELECT COUNT(*) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.created_at >= NOW() - INTERVAL '60 days' AND o.created_at < NOW() - INTERVAL '30 days') AS total_orders_prev_30d,
  (SELECT COALESCE(SUM(o.total), 0) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.status = 'paid' AND o.created_at >= NOW() - INTERVAL '60 days' AND o.created_at < NOW() - INTERVAL '30 days') AS total_sales_prev_30d,
  (SELECT COUNT(*) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.created_at >= DATE_TRUNC('month', NOW())) AS documents_this_month,
  (SELECT MAX(o.created_at) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id) AS last_order_at,
  (SELECT EXTRACT(DAY FROM NOW() - MAX(o.created_at)) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id) AS days_since_last_order,
  CASE
    WHEN (SELECT COUNT(*) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.created_at >= NOW() - INTERVAL '7 days') > 0 THEN 'active'
    WHEN (SELECT COUNT(*) FROM public.orders o JOIN public.branches b ON o.branch_id = b.id WHERE b.company_id = c.id AND o.created_at >= NOW() - INTERVAL '30 days') > 0 THEN 'occasional'
    ELSE 'inactive'
  END AS activity_status
FROM public.companies c
WHERE c.id IN (SELECT public.get_user_companies());

-- Recreate customer_profiles with company filter
CREATE VIEW public.customer_profiles AS
SELECT 
  c.id,
  c.company_id,
  c.name,
  c.last_name,
  c.email,
  c.phone,
  c.city,
  c.address,
  c.notes,
  c.created_at,
  c.updated_at
FROM public.customers c
WHERE c.company_id IN (SELECT public.get_user_companies());

-- Recreate user_profiles with proper access control
CREATE VIEW public.user_profiles AS
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