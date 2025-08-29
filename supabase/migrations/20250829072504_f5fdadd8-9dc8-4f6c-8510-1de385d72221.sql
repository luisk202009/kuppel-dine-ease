-- Insert demo data
-- Insert demo company
INSERT INTO public.companies (id, name, tax_id, address, phone, email)
VALUES (
  'c8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e',
  'Kuppel Demo Restaurant',
  '900123456-1',
  'Calle Demo 123, Bogotá, Colombia',
  '+57 300 123 4567',
  'demo@kuppel.co'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;

-- Insert demo branch
INSERT INTO public.branches (id, company_id, name, address, phone)
VALUES (
  'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e',
  'c8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e',
  'Sucursal Principal',
  'Calle Demo 123, Bogotá, Colombia',
  '+57 300 123 4567'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone;

-- Insert demo user (will be created automatically via trigger when signing up)
-- But we can create a demo user manually for testing
INSERT INTO public.users (id, email, name, role, is_active)
VALUES (
  'd8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e',
  'demo@kuppel.co',
  'Usuario Demo',
  'demo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Associate demo user with demo company
INSERT INTO public.user_companies (user_id, company_id, branch_id)
VALUES (
  'd8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e',
  'c8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e',
  'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e'
)
ON CONFLICT (user_id, company_id) DO UPDATE SET
  branch_id = EXCLUDED.branch_id;

-- Insert product categories
INSERT INTO public.categories (id, name, description, icon, color)
VALUES 
  ('cat-bebidas-calientes', 'Bebidas Calientes', 'Café, té y chocolate', '☕', '#8B4513'),
  ('cat-bebidas-frias', 'Bebidas Frías', 'Jugos, limonadas y aguas', '🥤', '#4A90E2'),
  ('cat-bebidas-alcoholicas', 'Bebidas Alcohólicas', 'Vinos y cervezas', '🍷', '#722F37'),
  ('cat-comida', 'Comida', 'Platos principales', '🍽️', '#FF6B35'),
  ('cat-snacks', 'Snacks', 'Aperitivos y galletas', '🥨', '#F7931E')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- Insert products
INSERT INTO public.products (id, category_id, name, description, price, stock, is_alcoholic, is_active)
VALUES 
  ('prod-cafe-americano', 'cat-bebidas-calientes', 'Café Americano', 'Café negro tradicional', 4500, 100, false, true),
  ('prod-capuchino', 'cat-bebidas-calientes', 'Capuchino', 'Café con leche espumosa', 6000, 80, false, true),
  ('prod-chocolate', 'cat-bebidas-calientes', 'Chocolate Caliente', 'Chocolate cremoso', 5500, 60, false, true),
  ('prod-limonada', 'cat-bebidas-frias', 'Limonada Natural', 'Limonada fresca', 7000, 50, false, true),
  ('prod-jugo-naranja', 'cat-bebidas-frias', 'Jugo de Naranja', 'Jugo natural de naranja', 8000, 40, false, true),
  ('prod-agua-mineral', 'cat-bebidas-frias', 'Agua Mineral', 'Agua embotellada', 3000, 200, false, true),
  ('prod-vino-tinto', 'cat-bebidas-alcoholicas', 'Vino Tinto Sparta', 'Vino tinto nacional', 45000, 20, true, true),
  ('prod-vino-blanco', 'cat-bebidas-alcoholicas', 'Vino Blanco Montana', 'Vino blanco importado', 42000, 15, true, true),
  ('prod-cerveza', 'cat-bebidas-alcoholicas', 'Cerveza Club Colombia', 'Cerveza nacional', 8000, 100, true, true),
  ('prod-pasta-queso', 'cat-comida', 'Pasta en Salsa de Queso', 'Pasta cremosa con queso', 28000, 30, false, true),
  ('prod-platillo-mar', 'cat-comida', 'Platillo del Mar', 'Pescado con mariscos', 35000, 20, false, true),
  ('prod-cerdo-vegetales', 'cat-comida', 'Cerdo con Vegetales', 'Cerdo salteado', 32000, 25, false, true),
  ('prod-res-papas', 'cat-comida', 'Res con Papas', 'Carne de res con papas', 30000, 30, false, true),
  ('prod-langostinos', 'cat-comida', 'Langostinos a la Plancha', 'Langostinos frescos', 38000, 15, false, true),
  ('prod-galletas-oreo', 'cat-snacks', 'Galletas Oreo', 'Galletas de chocolate', 5000, 50, false, true),
  ('prod-churritos', 'cat-snacks', 'Churritos', 'Snack salado', 4000, 80, false, true),
  ('prod-papas-fritas', 'cat-snacks', 'Papas Fritas', 'Papas crujientes', 8000, 60, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  is_alcoholic = EXCLUDED.is_alcoholic,
  is_active = EXCLUDED.is_active;

-- Insert restaurant tables
INSERT INTO public.tables (id, branch_id, name, area, capacity, status)
VALUES 
  ('table-plantas-1', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 1', 'Plantas', 4, 'available'),
  ('table-plantas-2', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 2', 'Plantas', 2, 'occupied'),
  ('table-plantas-3', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 3', 'Plantas', 6, 'pending'),
  ('table-piso1-4', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 4', 'Primer Piso', 4, 'available'),
  ('table-piso1-5', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 5', 'Primer Piso', 8, 'reserved'),
  ('table-piso2-6', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 6', 'Segundo Piso', 2, 'available'),
  ('table-piso2-balcon', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Balcón 1', 'Segundo Piso', 4, 'occupied'),
  ('table-terraza-1', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Terraza 1', 'Terraza', 6, 'available'),
  ('table-barra-1', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Barra 1', 'Terraza', 1, 'occupied')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  area = EXCLUDED.area,
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status;

-- Insert demo customers
INSERT INTO public.customers (id, name, last_name, identification, phone, city, email)
VALUES 
  ('cust-demo-1', 'Juan Carlos', 'Pérez García', '1234567890', '+57 300 123 4567', 'Bogotá', 'juan.perez@email.com'),
  ('cust-demo-2', 'María Elena', 'Rodríguez López', '0987654321', '+57 301 987 6543', 'Medellín', 'maria.rodriguez@email.com'),
  ('cust-demo-3', 'Carlos', 'Mendoza', '1122334455', '+57 302 555 7777', 'Cali', 'carlos.mendoza@email.com')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  last_name = EXCLUDED.last_name,
  identification = EXCLUDED.identification,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  email = EXCLUDED.email;