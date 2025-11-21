-- ============================================================================
-- Vista: company_monthly_sales_stats
-- Propósito: Calcular métricas de ventas mensuales por empresa para gráficos
--
-- Descripción:
-- Esta vista agrega estadísticas de ventas por mes para cada empresa.
-- Se usa para generar gráficos de tendencia en el panel de administración.
--
-- Campos:
-- - company_id: ID de la empresa
-- - company_name: Nombre de la empresa
-- - year_month: Fecha truncada al mes (YYYY-MM-01)
-- - month_label: Etiqueta del mes (ej: "Jun 2025")
-- - total_orders_month: Número de órdenes completadas en ese mes
-- - total_sales_month: Importe total vendido en ese mes
--
-- Período: Últimos 12 meses (se puede filtrar en frontend a 6 meses)
-- ============================================================================

CREATE OR REPLACE VIEW public.company_monthly_sales_stats AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  DATE_TRUNC('month', o.created_at)::DATE AS year_month,
  TO_CHAR(DATE_TRUNC('month', o.created_at), 'Mon YYYY') AS month_label,
  
  COUNT(o.id)::INTEGER AS total_orders_month,
  COALESCE(SUM(o.total), 0)::NUMERIC(10,2) AS total_sales_month

FROM public.companies c

-- JOIN con branches para relacionar con orders
INNER JOIN public.branches b ON b.company_id = c.id AND b.is_active = true

-- JOIN con orders (solo órdenes completadas de los últimos 12 meses)
INNER JOIN public.orders o ON o.branch_id = b.id
  AND o.status IN ('paid', 'delivered')
  AND o.created_at >= NOW() - INTERVAL '12 months'

GROUP BY
  c.id,
  c.name,
  DATE_TRUNC('month', o.created_at)

ORDER BY
  c.name ASC,
  DATE_TRUNC('month', o.created_at) ASC;

-- ============================================================================
-- Comentario sobre la vista
-- ============================================================================
COMMENT ON VIEW public.company_monthly_sales_stats IS
'Vista que agrega métricas de ventas mensuales por empresa para los últimos 12 meses. Usado para gráficos de tendencia en el panel de administración.';


-- ============================================================================
-- Actualización de la vista: company_usage_stats
-- Agregar métricas del período anterior (30 días previos) para comparación
-- ============================================================================

DROP VIEW IF EXISTS public.company_usage_stats;

CREATE OR REPLACE VIEW public.company_usage_stats AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  c.business_type,
  c.is_active AS company_is_active,
  c.created_at AS company_created_at,

  -- Métricas de órdenes/ventas (TOTALES)
  COALESCE(COUNT(DISTINCT CASE
    WHEN o.status IN ('paid', 'delivered')
    THEN o.id
  END), 0)::INTEGER AS total_orders,

  COALESCE(SUM(CASE
    WHEN o.status IN ('paid', 'delivered')
    THEN o.total
    ELSE 0
  END), 0)::NUMERIC(10,2) AS total_sales_amount,

  -- Métricas de órdenes/ventas (ÚLTIMOS 30 DÍAS)
  COALESCE(COUNT(DISTINCT CASE
    WHEN o.status IN ('paid', 'delivered')
      AND o.created_at >= NOW() - INTERVAL '30 days'
    THEN o.id
  END), 0)::INTEGER AS total_orders_last_30d,

  COALESCE(SUM(CASE
    WHEN o.status IN ('paid', 'delivered')
      AND o.created_at >= NOW() - INTERVAL '30 days'
    THEN o.total
    ELSE 0
  END), 0)::NUMERIC(10,2) AS total_sales_last_30d,

  -- NUEVO: Métricas del período ANTERIOR (días -60 a -30)
  COALESCE(COUNT(DISTINCT CASE
    WHEN o.status IN ('paid', 'delivered')
      AND o.created_at >= NOW() - INTERVAL '60 days'
      AND o.created_at < NOW() - INTERVAL '30 days'
    THEN o.id
  END), 0)::INTEGER AS total_orders_prev_30d,

  COALESCE(SUM(CASE
    WHEN o.status IN ('paid', 'delivered')
      AND o.created_at >= NOW() - INTERVAL '60 days'
      AND o.created_at < NOW() - INTERVAL '30 days'
    THEN o.total
    ELSE 0
  END), 0)::NUMERIC(10,2) AS total_sales_prev_30d,

  -- Conteo de recursos de la empresa
  COALESCE(COUNT(DISTINCT CASE
    WHEN p.is_active = true
    THEN p.id
  END), 0)::INTEGER AS products_count,

  COALESCE(COUNT(DISTINCT CASE
    WHEN cat.is_active = true
    THEN cat.id
  END), 0)::INTEGER AS categories_count,

  COALESCE(COUNT(DISTINCT uc.user_id), 0)::INTEGER AS users_count,

  -- Fecha de última orden
  MAX(CASE
    WHEN o.status IN ('paid', 'delivered')
    THEN o.created_at
  END) AS last_order_at

FROM public.companies c

-- LEFT JOIN con branches (sucursales de la empresa)
LEFT JOIN public.branches b ON b.company_id = c.id AND b.is_active = true

-- LEFT JOIN con orders (órdenes asociadas a las sucursales)
LEFT JOIN public.orders o ON o.branch_id = b.id

-- LEFT JOIN con products (productos de la empresa)
LEFT JOIN public.products p ON p.company_id = c.id

-- LEFT JOIN con categories (categorías de la empresa)
LEFT JOIN public.categories cat ON cat.company_id = c.id

-- LEFT JOIN con user_companies (usuarios asociados a la empresa)
LEFT JOIN public.user_companies uc ON uc.company_id = c.id

-- Agrupamos por empresa
GROUP BY
  c.id,
  c.name,
  c.business_type,
  c.is_active,
  c.created_at

-- Ordenamos por nombre de empresa
ORDER BY c.name ASC;

-- ============================================================================
-- Comentario actualizado sobre la vista
-- ============================================================================
COMMENT ON VIEW public.company_usage_stats IS
'Vista que agrega métricas de uso y estadísticas por empresa. Incluye datos de ventas (actuales y período anterior para comparación), productos, categorías y usuarios. Diseñada para el panel de administración.';