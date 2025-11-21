-- Vista de estadísticas de ventas de productos por empresa
-- Se usa en el panel /admin para mostrar top productos por cantidad y facturación

CREATE OR REPLACE VIEW public.company_product_sales_stats AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  p.id AS product_id,
  p.name AS product_name,
  -- Total histórico
  COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
  COALESCE(SUM(oi.total_price), 0) AS total_sales_amount,
  -- Últimos 30 días
  COALESCE(SUM(CASE 
    WHEN o.created_at >= NOW() - INTERVAL '30 days' 
    THEN oi.quantity 
    ELSE 0 
  END), 0) AS total_quantity_last_30d,
  COALESCE(SUM(CASE 
    WHEN o.created_at >= NOW() - INTERVAL '30 days' 
    THEN oi.total_price 
    ELSE 0 
  END), 0) AS total_sales_last_30d
FROM public.companies c
INNER JOIN public.branches b ON b.company_id = c.id
INNER JOIN public.orders o ON o.branch_id = b.id
INNER JOIN public.order_items oi ON oi.order_id = o.id
INNER JOIN public.products p ON p.id = oi.product_id
WHERE o.status IN ('paid', 'delivered') -- Solo órdenes completadas
GROUP BY c.id, c.name, p.id, p.name;