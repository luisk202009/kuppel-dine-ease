-- Insert sample products for existing categories
-- Insert products for Bebidas category
INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Café Americano',
  'Café negro preparado al momento',
  4500,
  2000,
  100,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Bebidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Capuchino',
  'Café con leche espumada',
  6000,
  2500,
  100,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Bebidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Limonada Natural',
  'Limonada natural con hielo',
  7000,
  3000,
  50,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Bebidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Cerveza Club Colombia',
  'Cerveza nacional en botella',
  8000,
  4000,
  80,
  true,
  true
FROM public.categories cat
WHERE cat.name = 'Bebidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

-- Insert products for Comidas category
INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Pasta en Salsa de Queso',
  'Pasta fresca con salsa cremosa de quesos',
  28000,
  12000,
  30,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Comidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Platillo del Mar',
  'Pescado fresco con vegetales y arroz',
  35000,
  18000,
  20,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Comidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Cerdo con Vegetales',
  'Lomo de cerdo con vegetales salteados',
  32000,
  16000,
  25,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Comidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Res con Papas',
  'Carne de res con papas al horno',
  30000,
  15000,
  30,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Comidas' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

-- Insert products for Postres category
INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Tiramisú',
  'Postre italiano con café y mascarpone',
  12000,
  5000,
  15,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Postres' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Brownie con Helado',
  'Brownie de chocolate caliente con helado de vainilla',
  10000,
  4500,
  20,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Postres' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);

INSERT INTO public.products (company_id, category_id, name, description, price, cost, stock, is_active, is_alcoholic)
SELECT 
  cat.company_id,
  cat.id,
  'Cheesecake',
  'Tarta de queso con frutos rojos',
  11000,
  5000,
  15,
  true,
  false
FROM public.categories cat
WHERE cat.name = 'Postres' AND cat.company_id IN (
  SELECT company_id FROM public.user_companies uc
  JOIN public.users u ON uc.user_id = u.id
  WHERE u.email = 'luis.moreno@kuppel.co'
);