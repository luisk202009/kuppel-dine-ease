import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LimitDimension {
  used: number;
  limit: number | null;
  status: 'ok' | 'near_limit' | 'over_limit' | 'no_limit' | 'no_plan';
  usage_pct: number | null;
}

export interface CompanyLimitsStatus {
  users: LimitDimension;
  branches: LimitDimension;
  documents: LimitDimension;
  overall_status: 'ok' | 'near_limit' | 'over_limit' | 'no_limit' | 'no_plan';
}

interface UseCompanyLimitsResult {
  limitsStatus: CompanyLimitsStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  checkDimension: (dimension: 'users' | 'branches' | 'documents') => LimitDimension | null;
}

/**
 * Hook para verificar los límites del plan de la empresa actual.
 * 
 * @param companyId - ID de la empresa. Si no se proporciona, no se hace la consulta.
 * @returns Estado de los límites, loading, error y función refetch
 * 
 * @example
 * const { limitsStatus, isLoading, refetch } = useCompanyLimits(companyId);
 * 
 * // Después de crear un usuario
 * await createUser(...);
 * await refetch();
 */
export const useCompanyLimits = (companyId?: string): UseCompanyLimitsResult => {
  const [limitsStatus, setLimitsStatus] = useState<CompanyLimitsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = useCallback(async () => {
    if (!companyId) {
      setLimitsStatus(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('check_company_limits', { p_company_id: companyId });

      if (rpcError) {
        console.error('Error checking company limits:', rpcError);
        throw rpcError;
      }

      setLimitsStatus(data as unknown as CompanyLimitsStatus);
    } catch (err) {
      console.error('Error fetching company limits:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar límites del plan');
      setLimitsStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Cargar límites al montar o cuando cambie el companyId
  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Helper para verificar una dimensión específica
  const checkDimension = useCallback((dimension: 'users' | 'branches' | 'documents'): LimitDimension | null => {
    if (!limitsStatus) return null;
    return limitsStatus[dimension];
  }, [limitsStatus]);

  return {
    limitsStatus,
    isLoading,
    error,
    refetch: fetchLimits,
    checkDimension,
  };
};
