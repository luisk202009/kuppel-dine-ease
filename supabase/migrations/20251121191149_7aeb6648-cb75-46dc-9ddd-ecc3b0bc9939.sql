-- ============================================================================
-- MIGRACIÓN: Corregir seed_default_data_for_business_type
-- ============================================================================
-- Elimina el uso de ARRAY_AGG en RETURNING, que no está permitido en Postgres.
-- Ahora usa CTEs (Common Table Expressions) para capturar los IDs insertados.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_default_data_for_business_type(
  _company_id uuid,
  _branch_id uuid,
  _business_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  category_ids uuid[];
  area_ids uuid[];
  seed_exists boolean;
BEGIN
  -- Verificar si ya existe seed para esta company
  SELECT EXISTS(
    SELECT 1 FROM public.categories WHERE company_id = _company_id
  ) INTO seed_exists;
  
  IF seed_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Seed data already exists',
      'skipped', true
    );
  END IF;

  -- SEED según tipo de negocio
  CASE _business_type
    
    -- ==================== RESTAURANT ====================
    WHEN 'restaurant' THEN
      -- Categorías - Usar CTE para evitar ARRAY_AGG en RETURNING
      WITH inserted_categories AS (
        INSERT INTO public.categories (company_id, name, color, icon, is_active)
        VALUES 
          (_company_id, 'Entradas', '#f97316', 'Pizza', true),
          (_company_id, 'Platos Principales', '#22c55e', 'UtensilsCrossed', true),
          (_company_id, 'Postres', '#ec4899', 'IceCream', true),
          (_company_id, 'Bebidas', '#3b82f6', 'Coffee', true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO category_ids FROM inserted_categories;

      -- Productos demo
      INSERT INTO public.products (company_id, category_id, name, price, cost, stock, is_active)
      VALUES
        (_company_id, category_ids[1], 'Ensalada César', 12000, 5000, 50, true),
        (_company_id, category_ids[2], 'Filete de Res', 35000, 15000, 30, true),
        (_company_id, category_ids[3], 'Cheesecake', 8000, 3000, 20, true),
        (_company_id, category_ids[4], 'Limonada Natural', 5000, 1500, 100, true);

      -- Áreas - Usar CTE para evitar ARRAY_AGG en RETURNING
      WITH inserted_areas AS (
        INSERT INTO public.areas (branch_id, name, color, display_order, is_active)
        VALUES
          (_branch_id, 'Salón Principal', '#3b82f6', 1, true),
          (_branch_id, 'Terraza', '#22c55e', 2, true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO area_ids FROM inserted_areas;

      -- Mesas
      INSERT INTO public.tables (branch_id, area_id, name, capacity, status)
      SELECT 
        _branch_id,
        area_ids[1],
        'Mesa ' || i,
        4,
        'available'
      FROM generate_series(1, 8) i;

      INSERT INTO public.tables (branch_id, area_id, name, capacity, status)
      SELECT 
        _branch_id,
        area_ids[2],
        'Mesa T' || i,
        4,
        'available'
      FROM generate_series(1, 6) i;

    -- ==================== CAFE ====================
    WHEN 'cafe' THEN
      WITH inserted_categories AS (
        INSERT INTO public.categories (company_id, name, color, icon, is_active)
        VALUES 
          (_company_id, 'Café', '#a855f7', 'Coffee', true),
          (_company_id, 'Repostería', '#ec4899', 'Cake', true),
          (_company_id, 'Bebidas Frías', '#3b82f6', 'IceCream', true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO category_ids FROM inserted_categories;

      INSERT INTO public.products (company_id, category_id, name, price, cost, stock, is_active)
      VALUES
        (_company_id, category_ids[1], 'Café Americano', 4000, 1200, 200, true),
        (_company_id, category_ids[1], 'Cappuccino', 5500, 1800, 150, true),
        (_company_id, category_ids[2], 'Croissant', 6000, 2500, 50, true),
        (_company_id, category_ids[3], 'Frappé', 8000, 3000, 100, true);

      WITH inserted_areas AS (
        INSERT INTO public.areas (branch_id, name, color, display_order, is_active)
        VALUES
          (_branch_id, 'Interior', '#3b82f6', 1, true),
          (_branch_id, 'Barra', '#22c55e', 2, true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO area_ids FROM inserted_areas;

      INSERT INTO public.tables (branch_id, area_id, name, capacity, status)
      SELECT 
        _branch_id,
        area_ids[1],
        'Mesa ' || i,
        2,
        'available'
      FROM generate_series(1, 10) i;

    -- ==================== PIZZERIA ====================
    WHEN 'pizzeria' THEN
      WITH inserted_categories AS (
        INSERT INTO public.categories (company_id, name, color, icon, is_active)
        VALUES 
          (_company_id, 'Pizzas', '#f97316', 'Pizza', true),
          (_company_id, 'Entradas', '#22c55e', 'UtensilsCrossed', true),
          (_company_id, 'Bebidas', '#3b82f6', 'Coffee', true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO category_ids FROM inserted_categories;

      INSERT INTO public.products (company_id, category_id, name, price, cost, stock, is_active)
      VALUES
        (_company_id, category_ids[1], 'Pizza Margherita', 25000, 10000, 30, true),
        (_company_id, category_ids[1], 'Pizza Pepperoni', 28000, 11000, 30, true),
        (_company_id, category_ids[2], 'Pan de Ajo', 8000, 3000, 50, true),
        (_company_id, category_ids[3], 'Coca Cola', 4000, 1500, 100, true);

      WITH inserted_areas AS (
        INSERT INTO public.areas (branch_id, name, color, display_order, is_active)
        VALUES
          (_branch_id, 'Comedor', '#3b82f6', 1, true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO area_ids FROM inserted_areas;

      INSERT INTO public.tables (branch_id, area_id, name, capacity, status)
      SELECT 
        _branch_id,
        area_ids[1],
        'Mesa ' || i,
        4,
        'available'
      FROM generate_series(1, 12) i;

    -- ==================== BAR ====================
    WHEN 'bar' THEN
      WITH inserted_categories AS (
        INSERT INTO public.categories (company_id, name, color, icon, is_active)
        VALUES 
          (_company_id, 'Cócteles', '#a855f7', 'Wine', true),
          (_company_id, 'Cervezas', '#eab308', 'Coffee', true),
          (_company_id, 'Piqueos', '#f97316', 'Pizza', true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO category_ids FROM inserted_categories;

      INSERT INTO public.products (company_id, category_id, name, price, cost, stock, is_active)
      VALUES
        (_company_id, category_ids[1], 'Mojito', 15000, 5000, 50, true),
        (_company_id, category_ids[2], 'Cerveza Nacional', 6000, 2500, 200, true),
        (_company_id, category_ids[3], 'Alitas Picantes', 18000, 7000, 40, true);

      WITH inserted_areas AS (
        INSERT INTO public.areas (branch_id, name, color, display_order, is_active)
        VALUES
          (_branch_id, 'Barra', '#a855f7', 1, true),
          (_branch_id, 'Zona VIP', '#ec4899', 2, true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO area_ids FROM inserted_areas;

      INSERT INTO public.tables (branch_id, area_id, name, capacity, status)
      SELECT 
        _branch_id,
        area_ids[1],
        'Mesa ' || i,
        4,
        'available'
      FROM generate_series(1, 8) i;

    -- ==================== BAKERY ====================
    WHEN 'bakery' THEN
      WITH inserted_categories AS (
        INSERT INTO public.categories (company_id, name, color, icon, is_active)
        VALUES 
          (_company_id, 'Pan', '#eab308', 'Cake', true),
          (_company_id, 'Pasteles', '#ec4899', 'IceCream', true),
          (_company_id, 'Bebidas', '#3b82f6', 'Coffee', true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO category_ids FROM inserted_categories;

      INSERT INTO public.products (company_id, category_id, name, price, cost, stock, is_active)
      VALUES
        (_company_id, category_ids[1], 'Pan Francés', 2000, 800, 100, true),
        (_company_id, category_ids[2], 'Torta de Chocolate', 45000, 20000, 10, true),
        (_company_id, category_ids[3], 'Café con Leche', 4000, 1500, 50, true);

    -- ==================== RETAIL ====================
    WHEN 'retail' THEN
      WITH inserted_categories AS (
        INSERT INTO public.categories (company_id, name, color, icon, is_active)
        VALUES 
          (_company_id, 'Productos', '#3b82f6', 'UtensilsCrossed', true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO category_ids FROM inserted_categories;

      INSERT INTO public.products (company_id, category_id, name, price, cost, stock, is_active)
      VALUES
        (_company_id, category_ids[1], 'Producto 1', 10000, 5000, 50, true),
        (_company_id, category_ids[1], 'Producto 2', 15000, 7500, 30, true);

    -- ==================== OTHER (default) ====================
    ELSE
      WITH inserted_categories AS (
        INSERT INTO public.categories (company_id, name, color, icon, is_active)
        VALUES 
          (_company_id, 'General', '#3b82f6', 'UtensilsCrossed', true)
        RETURNING id
      )
      SELECT ARRAY_AGG(id) INTO category_ids FROM inserted_categories;

      INSERT INTO public.products (company_id, category_id, name, price, cost, stock, is_active)
      VALUES
        (_company_id, category_ids[1], 'Producto Ejemplo', 10000, 5000, 50, true);

  END CASE;

  -- Construir respuesta
  result := jsonb_build_object(
    'success', true,
    'message', 'Seed data created successfully',
    'business_type', _business_type,
    'categories_count', (SELECT COUNT(*) FROM public.categories WHERE company_id = _company_id),
    'products_count', (SELECT COUNT(*) FROM public.products WHERE company_id = _company_id),
    'areas_count', (SELECT COUNT(*) FROM public.areas WHERE branch_id = _branch_id),
    'tables_count', (SELECT COUNT(*) FROM public.tables WHERE branch_id = _branch_id)
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- ============================================================================
-- NOTA: Se eliminó el uso de funciones de agregado (ARRAY_AGG) directamente
-- en la cláusula RETURNING porque Postgres no lo permite. Ahora se usan CTEs
-- (Common Table Expressions) para capturar los IDs insertados y luego
-- agregarlos en una consulta separada.
-- ============================================================================