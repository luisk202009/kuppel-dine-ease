-- ============================================================================
-- Vista: company_usage_stats
-- Propósito: Calcular métricas de uso por empresa para el panel /admin
-- 
-- Descripción:
-- Esta vista agrega estadísticas de uso por cada empresa registrada en el sistema.
-- Incluye métricas de ventas (totales y últimos 30 días), conteo de productos,
-- categorías, usuarios y fecha de última venta.
--
-- Tablas utilizadas:
-- - companies: Tabla principal de empresas
-- - branches: Sucursales (para relacionar orders con companies)
-- - orders: Órdenes/ventas (filtradas por status != 'cancelled')
-- - products: Productos de cada empresa (solo activos)
-- - categories: Categorías de cada empresa (solo activas)
-- - user_companies: Relación usuarios-empresas
--
-- Campos calculados:
-- - total_orders: Número total de órdenes completadas (status IN ('paid', 'delivered'))
-- - total_sales_amount: Suma del campo 'total' de todas las órdenes
-- - total_orders_last_30d: Órdenes en los últimos 30 días
-- - total_sales_last_30d: Importe vendido en los últimos 30 días
-- - products_count: Productos activos (is_active = true)
-- - categories_count: Categorías activas (is_active = true)
-- - users_count: Usuarios únicos asociados a la empresa
-- - last_order_at: Fecha y hora de la última orden
--
-- Uso desde el frontend:
-- Esta vista está diseñada para ser consultada desde el panel /admin
-- por usuarios con role = 'admin' o 'platform_admin'.
--
-- Futuras ampliaciones posibles:
-- - Métricas por mes/trimestre/año
-- - Promedio de ticket
-- - Tasa de crecimiento
-- - Métricas por sucursal
-- - Productos más vendidos por empresa
-- ============================================================================

CREATE OR REPLACE VIEW public.company_usage_stats AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.business_type,
  c.is_active AS company_is_active,
  c.created_at AS company_created_at,
  
  -- Métricas de órdenes/ventas (TOTALES)
  -- Solo contamos órdenes que no están canceladas
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
-- Excluimos órdenes canceladas de las métricas principales
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
-- Comentario sobre la vista
-- ============================================================================
COMMENT ON VIEW public.company_usage_stats IS 
'Vista que agrega métricas de uso y estadísticas por empresa. Incluye datos de ventas, productos, categorías y usuarios. Diseñada para el panel de administración.';

-- ============================================================================
-- Crear política RLS para la vista (heredará de las tablas base)
-- ============================================================================
-- NOTA: Las vistas en PostgreSQL/Supabase no tienen RLS directamente,
-- pero el acceso está controlado por las políticas RLS de las tablas subyacentes.
-- Los platform_admin podrán ver todas las empresas gracias a las políticas existentes
-- en la tabla companies que permiten SELECT con is_platform_admin().