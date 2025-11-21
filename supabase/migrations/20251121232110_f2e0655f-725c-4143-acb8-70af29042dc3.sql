-- =====================================================
-- MIGRATION: Sistema de Planes y Suscripciones Kuppel
-- =====================================================
-- Objetivo: Definir esquema para gestión de planes comerciales,
-- suscripciones por empresa e historial de cambios.
--
-- Tablas:
-- 1. plans: Define la oferta comercial (planes, precios, límites)
-- 2. companies: Se agregan campos para reflejar plan y estado ACTUAL
-- 3. company_subscriptions: Historial de suscripciones y cambios de plan
-- =====================================================

-- =====================================================
-- 1. TABLA: plans
-- =====================================================
-- Define los planes comerciales disponibles en Kuppel
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  price_monthly numeric(12,2) NULL,
  price_yearly numeric(12,2) NULL,
  currency text NOT NULL DEFAULT 'COP',
  billing_interval_default text NOT NULL DEFAULT 'monthly',
  is_active boolean NOT NULL DEFAULT true,
  limits jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_plans_code ON public.plans(code);
CREATE INDEX idx_plans_is_active ON public.plans(is_active);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.plans IS 'Planes comerciales de Kuppel (Starter, Pro, Enterprise, etc.)';
COMMENT ON COLUMN public.plans.code IS 'Slug interno único del plan (ej: starter, pro, enterprise)';
COMMENT ON COLUMN public.plans.limits IS 'Límites del plan en formato JSON: { "max_users": 3, "max_branches": 1, "max_documents_per_month": 500 }';
COMMENT ON COLUMN public.plans.billing_interval_default IS 'Periodo de facturación por defecto: monthly o yearly';

-- RLS en plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Solo platform_admin puede gestionar planes
CREATE POLICY "Platform admins can manage plans"
  ON public.plans
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- =====================================================
-- 2. AGREGAR CAMPOS A companies
-- =====================================================
-- Campos para reflejar el plan y estado ACTUAL de la empresa

ALTER TABLE public.companies 
  ADD COLUMN plan_id uuid NULL REFERENCES public.plans(id) ON DELETE SET NULL,
  ADD COLUMN subscription_status text DEFAULT 'trialing',
  ADD COLUMN billing_period text DEFAULT 'monthly',
  ADD COLUMN trial_end_at timestamptz NULL;

-- Índices para consultas frecuentes
CREATE INDEX idx_companies_plan_id ON public.companies(plan_id);
CREATE INDEX idx_companies_subscription_status ON public.companies(subscription_status);

COMMENT ON COLUMN public.companies.plan_id IS 'Plan actual de la empresa (FK a plans)';
COMMENT ON COLUMN public.companies.subscription_status IS 'Estado actual: trialing, active, past_due, paused, canceled';
COMMENT ON COLUMN public.companies.billing_period IS 'Periodo de facturación actual: monthly o yearly';
COMMENT ON COLUMN public.companies.trial_end_at IS 'Fecha de fin del periodo de prueba';

-- =====================================================
-- 3. TABLA: company_subscriptions
-- =====================================================
-- Historial completo de suscripciones y cambios de plan por empresa

CREATE TABLE public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status text NOT NULL,
  billing_period text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  trial_end_at timestamptz NULL,
  cancel_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas comunes
CREATE INDEX idx_company_subscriptions_company_id ON public.company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_plan_id ON public.company_subscriptions(plan_id);
CREATE INDEX idx_company_subscriptions_status ON public.company_subscriptions(status);
CREATE INDEX idx_company_subscriptions_period ON public.company_subscriptions(current_period_start, current_period_end);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_company_subscriptions_updated_at
  BEFORE UPDATE ON public.company_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.company_subscriptions IS 'Historial de suscripciones y cambios de plan por empresa';
COMMENT ON COLUMN public.company_subscriptions.status IS 'Estado de la suscripción: trialing, active, past_due, paused, canceled';
COMMENT ON COLUMN public.company_subscriptions.billing_period IS 'Periodo de facturación: monthly o yearly';
COMMENT ON COLUMN public.company_subscriptions.cancel_at IS 'Fecha programada de cancelación (al final del ciclo de facturación)';
COMMENT ON COLUMN public.company_subscriptions.notes IS 'Anotaciones internas de soporte/admin';

-- RLS en company_subscriptions
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Solo platform_admin puede gestionar suscripciones
CREATE POLICY "Platform admins can manage company subscriptions"
  ON public.company_subscriptions
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- =====================================================
-- 4. SEED DATA: Planes iniciales
-- =====================================================
-- Crear 3 planes de ejemplo con límites razonables para Kuppel POS

INSERT INTO public.plans (name, code, description, price_monthly, price_yearly, currency, billing_interval_default, is_active, limits) VALUES
(
  'Emprendedor',
  'starter',
  'Ideal para negocios nuevos o pequeños. Funcionalidades básicas de POS.',
  49900,
  499900,
  'COP',
  'monthly',
  true,
  '{
    "max_users": 3,
    "max_branches": 1,
    "max_products": 100,
    "max_documents_per_month": 500
  }'::jsonb
),
(
  'Pyme',
  'pro',
  'Para negocios en crecimiento. Incluye múltiples sucursales y usuarios.',
  99900,
  999900,
  'COP',
  'monthly',
  true,
  '{
    "max_users": 10,
    "max_branches": 3,
    "max_products": 1000,
    "max_documents_per_month": 5000
  }'::jsonb
),
(
  'Empresarial',
  'enterprise',
  'Sin límites. Para grandes empresas con múltiples sucursales.',
  299900,
  2999900,
  'COP',
  'monthly',
  true,
  '{
    "max_users": -1,
    "max_branches": -1,
    "max_products": -1,
    "max_documents_per_month": -1
  }'::jsonb
);

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
-- Próximos pasos (NO incluidos en esta migración):
-- - UI en /admin para gestionar planes
-- - UI en /admin para gestionar suscripciones de empresas
-- - Triggers automáticos para sincronizar companies y company_subscriptions
-- - Validaciones de límites de plan en la aplicación
-- =====================================================