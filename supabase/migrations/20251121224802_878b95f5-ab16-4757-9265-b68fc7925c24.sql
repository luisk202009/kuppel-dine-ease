-- Extender vista de estadísticas de empresas con estado de actividad
-- Se usa en el panel /admin para detectar empresas en riesgo / inactivas

DROP VIEW IF EXISTS public.company_usage_stats;

CREATE OR REPLACE VIEW public.company_usage_stats AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  c.business_type,
  c.is_active AS company_is_active,
  c.created_at AS company_created_at,
  
  -- Métricas totales
  COALESCE(COUNT(DISTINCT o.id), 0)::integer AS total_orders,
  COALESCE(SUM(o.total), 0) AS total_sales_amount,
  
  -- Últimos 30 días
  COALESCE(COUNT(DISTINCT CASE 
    WHEN o.created_at >= NOW() - INTERVAL '30 days' 
    THEN o.id 
  END), 0)::integer AS total_orders_last_30d,
  COALESCE(SUM(CASE 
    WHEN o.created_at >= NOW() - INTERVAL '30 days' 
    THEN o.total 
    ELSE 0 
  END), 0) AS total_sales_last_30d,
  
  -- Período anterior (30-60 días atrás)
  COALESCE(COUNT(DISTINCT CASE 
    WHEN o.created_at >= NOW() - INTERVAL '60 days' 
    AND o.created_at < NOW() - INTERVAL '30 days'
    THEN o.id 
  END), 0)::integer AS total_orders_prev_30d,
  COALESCE(SUM(CASE 
    WHEN o.created_at >= NOW() - INTERVAL '60 days' 
    AND o.created_at < NOW() - INTERVAL '30 days'
    THEN o.total 
    ELSE 0 
  END), 0) AS total_sales_prev_30d,
  
  -- Contadores
  COALESCE((SELECT COUNT(*) FROM public.products p WHERE p.company_id = c.id), 0)::integer AS products_count,
  COALESCE((SELECT COUNT(*) FROM public.categories cat WHERE cat.company_id = c.id), 0)::integer AS categories_count,
  COALESCE((SELECT COUNT(DISTINCT uc.user_id) FROM public.user_companies uc WHERE uc.company_id = c.id), 0)::integer AS users_count,
  
  -- Última orden
  MAX(o.created_at) AS last_order_at,
  
  -- Días desde última orden
  CASE 
    WHEN MAX(o.created_at) IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM NOW() - MAX(o.created_at))::integer
  END AS days_since_last_order,
  
  -- Estado de actividad basado en última orden
  CASE
    WHEN COUNT(o.id) = 0 THEN 'new'                                    -- Sin órdenes
    WHEN MAX(o.created_at) >= NOW() - INTERVAL '30 days' THEN 'active' -- Activo últimos 30 días
    WHEN MAX(o.created_at) >= NOW() - INTERVAL '90 days' THEN 'cooling' -- 31-90 días
    WHEN MAX(o.created_at) >= NOW() - INTERVAL '180 days' THEN 'at_risk' -- 91-180 días
    ELSE 'churned'                                                     -- > 180 días o muy antiguo
  END AS activity_status

FROM public.companies c
LEFT JOIN public.branches b ON b.company_id = c.id
LEFT JOIN public.orders o ON o.branch_id = b.id AND o.status IN ('paid', 'delivered')
GROUP BY c.id, c.name, c.business_type, c.is_active, c.created_at;