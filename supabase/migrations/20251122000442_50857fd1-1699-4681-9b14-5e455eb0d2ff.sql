-- Drop and recreate company_usage_stats view with branches and documents this month
DROP VIEW IF EXISTS public.company_usage_stats;

CREATE VIEW public.company_usage_stats AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.business_type,
  c.is_active AS company_is_active,
  c.created_at AS company_created_at,
  
  -- Users count
  (SELECT COUNT(DISTINCT uc.user_id) FROM public.user_companies uc WHERE uc.company_id = c.id) AS users_count,
  
  -- Branches count
  (SELECT COUNT(*) FROM public.branches b WHERE b.company_id = c.id AND b.is_active = true) AS branches_count,
  
  -- Products and categories
  (SELECT COUNT(*) FROM public.products p WHERE p.company_id = c.id AND p.is_active = true) AS products_count,
  (SELECT COUNT(*) FROM public.categories cat WHERE cat.company_id = c.id AND cat.is_active = true) AS categories_count,
  
  -- Orders stats
  (SELECT COUNT(*) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id) AS total_orders,
  
  (SELECT COALESCE(SUM(o.total), 0) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id AND o.status = 'paid') AS total_sales_amount,
  
  -- Last 30 days stats
  (SELECT COUNT(*) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id 
   AND o.created_at >= NOW() - INTERVAL '30 days') AS total_orders_last_30d,
  
  (SELECT COALESCE(SUM(o.total), 0) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id 
   AND o.status = 'paid'
   AND o.created_at >= NOW() - INTERVAL '30 days') AS total_sales_last_30d,
  
  -- Previous 30 days stats (for comparison)
  (SELECT COUNT(*) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id 
   AND o.created_at >= NOW() - INTERVAL '60 days'
   AND o.created_at < NOW() - INTERVAL '30 days') AS total_orders_prev_30d,
  
  (SELECT COALESCE(SUM(o.total), 0) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id 
   AND o.status = 'paid'
   AND o.created_at >= NOW() - INTERVAL '60 days'
   AND o.created_at < NOW() - INTERVAL '30 days') AS total_sales_prev_30d,
  
  -- Documents this month (orders created in current month)
  (SELECT COUNT(*) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id 
   AND o.created_at >= DATE_TRUNC('month', NOW())) AS documents_this_month,
  
  -- Last order info
  (SELECT MAX(o.created_at) FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id) AS last_order_at,
  
  (SELECT EXTRACT(DAY FROM NOW() - MAX(o.created_at))::INTEGER FROM public.orders o 
   INNER JOIN public.branches b ON o.branch_id = b.id 
   WHERE b.company_id = c.id) AS days_since_last_order,
  
  -- Activity status
  CASE 
    WHEN (SELECT MAX(o.created_at) FROM public.orders o 
          INNER JOIN public.branches b ON o.branch_id = b.id 
          WHERE b.company_id = c.id) >= NOW() - INTERVAL '7 days' THEN 'active'
    WHEN (SELECT MAX(o.created_at) FROM public.orders o 
          INNER JOIN public.branches b ON o.branch_id = b.id 
          WHERE b.company_id = c.id) >= NOW() - INTERVAL '30 days' THEN 'low_activity'
    ELSE 'inactive'
  END AS activity_status
  
FROM public.companies c;