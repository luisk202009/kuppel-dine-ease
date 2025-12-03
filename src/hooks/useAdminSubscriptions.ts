import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminSubscription {
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
  created_at: string;
  updated_at: string;
  companies: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  plans: {
    id: string;
    name: string;
    code: string;
    price_monthly: number | null;
    price_yearly: number | null;
    currency: string;
  } | null;
}

export interface SubscriptionFilters {
  status: string;
  plan: string;
  expiration: string;
}

export const useAdminSubscriptions = (filters: SubscriptionFilters) => {
  const { data: subscriptions, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-subscriptions', filters],
    queryFn: async () => {
      let query = supabase
        .from('company_subscriptions')
        .select(`
          *,
          companies (
            id,
            name,
            email
          ),
          plans (
            id,
            name,
            code,
            price_monthly,
            price_yearly,
            currency
          )
        `)
        .order('current_period_end', { ascending: true });

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply plan filter
      if (filters.plan && filters.plan !== 'all') {
        query = query.eq('plan_id', filters.plan);
      }

      // Apply expiration filter
      if (filters.expiration && filters.expiration !== 'all') {
        const now = new Date();
        if (filters.expiration === '7days') {
          const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          query = query.gte('current_period_end', now.toISOString()).lte('current_period_end', in7Days.toISOString());
        } else if (filters.expiration === '30days') {
          const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          query = query.gte('current_period_end', now.toISOString()).lte('current_period_end', in30Days.toISOString());
        } else if (filters.expiration === 'expired') {
          query = query.lt('current_period_end', now.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AdminSubscription[];
    },
  });

  // Calculate stats
  const stats = {
    total: subscriptions?.length || 0,
    active: subscriptions?.filter(s => s.status === 'active').length || 0,
    trialing: subscriptions?.filter(s => s.status === 'trialing').length || 0,
    expired: subscriptions?.filter(s => s.status === 'expired').length || 0,
    canceled: subscriptions?.filter(s => s.status === 'canceled').length || 0,
    pastDue: subscriptions?.filter(s => s.status === 'past_due').length || 0,
    expiringSoon: subscriptions?.filter(s => {
      const daysUntil = Math.ceil((new Date(s.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0 && s.status !== 'canceled';
    }).length || 0,
  };

  return { 
    subscriptions: subscriptions || [], 
    stats,
    isLoading, 
    error,
    refetch 
  };
};

export const useCompanySubscriptionHistory = (companyId: string | null) => {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['subscription-history', companyId],
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
            currency
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  return { history: history || [], isLoading, error };
};
