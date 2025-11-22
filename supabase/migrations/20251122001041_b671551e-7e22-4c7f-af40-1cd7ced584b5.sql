-- Función para verificar límites de plan de una empresa
CREATE OR REPLACE FUNCTION public.check_company_limits(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_limits jsonb;
  v_users_count int;
  v_branches_count int;
  v_documents_this_month int;
  v_max_users int;
  v_max_branches int;
  v_max_documents int;
  v_users_status text;
  v_branches_status text;
  v_documents_status text;
  v_users_pct numeric;
  v_branches_pct numeric;
  v_documents_pct numeric;
  result jsonb;
BEGIN
  -- Obtener plan_id de la empresa
  SELECT plan_id INTO v_plan_id
  FROM public.companies
  WHERE id = p_company_id;

  -- Obtener métricas de uso desde la vista
  SELECT
    COALESCE(users_count, 0),
    COALESCE(branches_count, 0),
    COALESCE(documents_this_month, 0)
  INTO v_users_count, v_branches_count, v_documents_this_month
  FROM public.company_usage_stats
  WHERE company_id = p_company_id;

  -- Si no hay datos de uso, inicializar en 0
  v_users_count := COALESCE(v_users_count, 0);
  v_branches_count := COALESCE(v_branches_count, 0);
  v_documents_this_month := COALESCE(v_documents_this_month, 0);

  -- Si no hay plan asignado
  IF v_plan_id IS NULL THEN
    result := jsonb_build_object(
      'users', jsonb_build_object(
        'used', v_users_count,
        'limit', null,
        'status', 'no_plan',
        'usage_pct', null
      ),
      'branches', jsonb_build_object(
        'used', v_branches_count,
        'limit', null,
        'status', 'no_plan',
        'usage_pct', null
      ),
      'documents', jsonb_build_object(
        'used', v_documents_this_month,
        'limit', null,
        'status', 'no_plan',
        'usage_pct', null
      ),
      'overall_status', 'no_plan'
    );
    RETURN result;
  END IF;

  -- Obtener límites del plan
  SELECT limits INTO v_limits
  FROM public.plans
  WHERE id = v_plan_id;

  -- Extraer límites individuales del JSONB
  v_max_users := (v_limits->>'max_users')::int;
  v_max_branches := (v_limits->>'max_branches')::int;
  v_max_documents := (v_limits->>'max_documents_per_month')::int;

  -- Calcular status para usuarios
  IF v_max_users IS NULL THEN
    v_users_status := 'no_limit';
    v_users_pct := NULL;
  ELSIF v_max_users = 0 THEN
    v_users_status := 'no_limit';
    v_users_pct := NULL;
  ELSE
    v_users_pct := ROUND((v_users_count::numeric / v_max_users::numeric) * 100, 1);
    IF v_users_count > v_max_users THEN
      v_users_status := 'over_limit';
    ELSIF v_users_pct > 80 THEN
      v_users_status := 'near_limit';
    ELSE
      v_users_status := 'ok';
    END IF;
  END IF;

  -- Calcular status para sucursales
  IF v_max_branches IS NULL THEN
    v_branches_status := 'no_limit';
    v_branches_pct := NULL;
  ELSIF v_max_branches = 0 THEN
    v_branches_status := 'no_limit';
    v_branches_pct := NULL;
  ELSE
    v_branches_pct := ROUND((v_branches_count::numeric / v_max_branches::numeric) * 100, 1);
    IF v_branches_count > v_max_branches THEN
      v_branches_status := 'over_limit';
    ELSIF v_branches_pct > 80 THEN
      v_branches_status := 'near_limit';
    ELSE
      v_branches_status := 'ok';
    END IF;
  END IF;

  -- Calcular status para documentos
  IF v_max_documents IS NULL THEN
    v_documents_status := 'no_limit';
    v_documents_pct := NULL;
  ELSIF v_max_documents = 0 THEN
    v_documents_status := 'no_limit';
    v_documents_pct := NULL;
  ELSE
    v_documents_pct := ROUND((v_documents_this_month::numeric / v_max_documents::numeric) * 100, 1);
    IF v_documents_this_month > v_max_documents THEN
      v_documents_status := 'over_limit';
    ELSIF v_documents_pct > 80 THEN
      v_documents_status := 'near_limit';
    ELSE
      v_documents_status := 'ok';
    END IF;
  END IF;

  -- Determinar estado general (el peor de los tres)
  DECLARE
    v_overall_status text;
  BEGIN
    v_overall_status := 'ok';
    
    IF v_users_status = 'over_limit' OR v_branches_status = 'over_limit' OR v_documents_status = 'over_limit' THEN
      v_overall_status := 'over_limit';
    ELSIF v_users_status = 'near_limit' OR v_branches_status = 'near_limit' OR v_documents_status = 'near_limit' THEN
      v_overall_status := 'near_limit';
    END IF;

    -- Construir resultado JSON
    result := jsonb_build_object(
      'users', jsonb_build_object(
        'used', v_users_count,
        'limit', v_max_users,
        'status', v_users_status,
        'usage_pct', v_users_pct
      ),
      'branches', jsonb_build_object(
        'used', v_branches_count,
        'limit', v_max_branches,
        'status', v_branches_status,
        'usage_pct', v_branches_pct
      ),
      'documents', jsonb_build_object(
        'used', v_documents_this_month,
        'limit', v_max_documents,
        'status', v_documents_status,
        'usage_pct', v_documents_pct
      ),
      'overall_status', v_overall_status
    );
  END;

  RETURN result;
END;
$$;