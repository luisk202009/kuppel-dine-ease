-- Limpieza de empresas duplicadas "Soporte Kuppel"
-- Mantener solo: ba5d9f96-8119-4d6b-a9ff-1cbaf64ebb94
-- Eliminar: 0fd65eb7-aaf5-49bb-9ed3-08212f957b33, 258766eb-9f12-4c8a-b124-9d2c738c1f0d, 
--           2aeefc8c-50a1-4749-a20f-553cd7c4601a, d13079fc-d8ac-4e2a-9740-68439973b42d

-- Paso 1: Eliminar order_items relacionados
DELETE FROM public.order_items 
WHERE order_id IN (
  SELECT o.id 
  FROM public.orders o
  INNER JOIN public.branches b ON o.branch_id = b.id
  WHERE b.company_id IN (
    '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
    '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
    '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
    'd13079fc-d8ac-4e2a-9740-68439973b42d'
  )
);

-- Paso 2: Eliminar orders
DELETE FROM public.orders 
WHERE branch_id IN (
  SELECT id FROM public.branches 
  WHERE company_id IN (
    '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
    '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
    '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
    'd13079fc-d8ac-4e2a-9740-68439973b42d'
  )
);

-- Paso 3: Eliminar tables
DELETE FROM public.tables 
WHERE branch_id IN (
  SELECT id FROM public.branches 
  WHERE company_id IN (
    '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
    '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
    '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
    'd13079fc-d8ac-4e2a-9740-68439973b42d'
  )
);

-- Paso 4: Eliminar areas
DELETE FROM public.areas 
WHERE branch_id IN (
  SELECT id FROM public.branches 
  WHERE company_id IN (
    '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
    '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
    '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
    'd13079fc-d8ac-4e2a-9740-68439973b42d'
  )
);

-- Paso 5: Eliminar expenses
DELETE FROM public.expenses 
WHERE branch_id IN (
  SELECT id FROM public.branches 
  WHERE company_id IN (
    '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
    '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
    '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
    'd13079fc-d8ac-4e2a-9740-68439973b42d'
  )
);

-- Paso 6: Eliminar cash_registers
DELETE FROM public.cash_registers 
WHERE branch_id IN (
  SELECT id FROM public.branches 
  WHERE company_id IN (
    '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
    '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
    '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
    'd13079fc-d8ac-4e2a-9740-68439973b42d'
  )
);

-- Paso 7: Eliminar products
DELETE FROM public.products 
WHERE company_id IN (
  '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
  '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
  '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
  'd13079fc-d8ac-4e2a-9740-68439973b42d'
);

-- Paso 8: Eliminar categories
DELETE FROM public.categories 
WHERE company_id IN (
  '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
  '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
  '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
  'd13079fc-d8ac-4e2a-9740-68439973b42d'
);

-- Paso 9: Eliminar customers
DELETE FROM public.customers 
WHERE company_id IN (
  '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
  '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
  '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
  'd13079fc-d8ac-4e2a-9740-68439973b42d'
);

-- Paso 10: Eliminar user_companies
DELETE FROM public.user_companies 
WHERE company_id IN (
  '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
  '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
  '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
  'd13079fc-d8ac-4e2a-9740-68439973b42d'
);

-- Paso 11: Eliminar branches
DELETE FROM public.branches 
WHERE company_id IN (
  '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
  '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
  '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
  'd13079fc-d8ac-4e2a-9740-68439973b42d'
);

-- Paso 12: Eliminar company_subscriptions (si existen)
DELETE FROM public.company_subscriptions 
WHERE company_id IN (
  '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
  '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
  '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
  'd13079fc-d8ac-4e2a-9740-68439973b42d'
);

-- Paso 13: Finalmente eliminar las companies
DELETE FROM public.companies 
WHERE id IN (
  '0fd65eb7-aaf5-49bb-9ed3-08212f957b33',
  '258766eb-9f12-4c8a-b124-9d2c738c1f0d',
  '2aeefc8c-50a1-4749-a20f-553cd7c4601a',
  'd13079fc-d8ac-4e2a-9740-68439973b42d'
);