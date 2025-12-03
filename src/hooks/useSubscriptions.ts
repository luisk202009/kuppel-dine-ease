import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

export interface SubscriptionWithPlan {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  current_period_start: string;
  current_period_end: string;
  trial_end_at: string | null;
  cancel_at: string | null;
  notes: string | null;
  payment_link: string | null;
  created_at: string;
  updated_at: string;
  plans: {
    id: string;
    name: string;
    code: string;
    price_monthly: number | null;
    price_yearly: number | null;
    currency: string;
    description: string | null;
  } | null;
}

export const useSubscriptions = () => {
  const { authState } = usePOS();
  const companyId = authState.selectedCompany?.id;

  const { data: subscriptions, isLoading, error, refetch } = useQuery({
    queryKey: ['company-subscriptions', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          plans (
            id,
            name,
            code,
            price_monthly,
            price_yearly,
            currency,
            description
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubscriptionWithPlan[];
    },
    enabled: !!companyId,
  });

  return { 
    subscriptions: subscriptions || [], 
    isLoading, 
    error,
    refetch 
  };
};
