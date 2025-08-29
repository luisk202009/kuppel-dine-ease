-- Insert demo data with valid UUIDs
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

-- Insert product categories with valid UUIDs
INSERT INTO public.categories (id, name, description, icon, color)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Bebidas Calientes', 'Café, té y chocolate', '☕', '#8B4513'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Bebidas Frías', 'Jugos, limonadas y aguas', '🥤', '#4A90E2'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bebidas Alcohólicas', 'Vinos y cervezas', '🍷', '#722F37'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Comida', 'Platos principales', '🍽️', '#FF6B35'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Snacks', 'Aperitivos y galletas', '🥨', '#F7931E')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- Insert products with valid UUIDs
INSERT INTO public.products (id, category_id, name, description, price, stock, is_alcoholic, is_active)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Café Americano', 'Café negro tradicional', 4500, 100, false, true),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Capuchino', 'Café con leche espumosa', 6000, 80, false, true),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Chocolate Caliente', 'Chocolate cremoso', 5500, 60, false, true),
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Limonada Natural', 'Limonada fresca', 7000, 50, false, true),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Jugo de Naranja', 'Jugo natural de naranja', 8000, 40, false, true),
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Agua Mineral', 'Agua embotellada', 3000, 200, false, true),
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Vino Tinto Sparta', 'Vino tinto nacional', 45000, 20, true, true),
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Vino Blanco Montana', 'Vino blanco importado', 42000, 15, true, true),
  ('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Cerveza Club Colombia', 'Cerveza nacional', 8000, 100, true, true),
  ('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Pasta en Salsa de Queso', 'Pasta cremosa con queso', 28000, 30, false, true),
  ('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Platillo del Mar', 'Pescado con mariscos', 35000, 20, false, true),
  ('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', 'Cerdo con Vegetales', 'Cerdo salteado', 32000, 25, false, true),
  ('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', 'Res con Papas', 'Carne de res con papas', 30000, 30, false, true),
  ('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', 'Langostinos a la Plancha', 'Langostinos frescos', 38000, 15, false, true),
  ('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', 'Galletas Oreo', 'Galletas de chocolate', 5000, 50, false, true),
  ('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440005', 'Churritos', 'Snack salado', 4000, 80, false, true),
  ('650e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440005', 'Papas Fritas', 'Papas crujientes', 8000, 60, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  is_alcoholic = EXCLUDED.is_alcoholic,
  is_active = EXCLUDED.is_active;

-- Insert restaurant tables with valid UUIDs
INSERT INTO public.tables (id, branch_id, name, area, capacity, status)
VALUES 
  ('750e8400-e29b-41d4-a716-446655440001', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 1', 'Plantas', 4, 'available'),
  ('750e8400-e29b-41d4-a716-446655440002', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 2', 'Plantas', 2, 'occupied'),
  ('750e8400-e29b-41d4-a716-446655440003', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 3', 'Plantas', 6, 'pending'),
  ('750e8400-e29b-41d4-a716-446655440004', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 4', 'Primer Piso', 4, 'available'),
  ('750e8400-e29b-41d4-a716-446655440005', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 5', 'Primer Piso', 8, 'reserved'),
  ('750e8400-e29b-41d4-a716-446655440006', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Mesa 6', 'Segundo Piso', 2, 'available'),
  ('750e8400-e29b-41d4-a716-446655440007', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Balcón 1', 'Segundo Piso', 4, 'occupied'),
  ('750e8400-e29b-41d4-a716-446655440008', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Terraza 1', 'Terraza', 6, 'available'),
  ('750e8400-e29b-41d4-a716-446655440009', 'b8f8d4e8-4f4e-4f4e-8f4e-4f4e8f4e8f4e', 'Barra 1', 'Terraza', 1, 'occupied')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  area = EXCLUDED.area,
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status;

-- Insert demo customers with valid UUIDs
INSERT INTO public.customers (id, name, last_name, identification, phone, city, email)
VALUES 
  ('850e8400-e29b-41d4-a716-446655440001', 'Juan Carlos', 'Pérez García', '1234567890', '+57 300 123 4567', 'Bogotá', 'juan.perez@email.com'),
  ('850e8400-e29b-41d4-a716-446655440002', 'María Elena', 'Rodríguez López', '0987654321', '+57 301 987 6543', 'Medellín', 'maria.rodriguez@email.com'),
  ('850e8400-e29b-41d4-a716-446655440003', 'Carlos', 'Mendoza', '1122334455', '+57 302 555 7777', 'Cali', 'carlos.mendoza@email.com')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  last_name = EXCLUDED.last_name,
  identification = EXCLUDED.identification,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  email = EXCLUDED.email;