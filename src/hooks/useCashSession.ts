import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCashSession = () => {
  return useQuery({
    queryKey: ['cash', 'current-session'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('cashier_id', user.id)
        .eq('is_active', true)
        .order('opened_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching cash session:', error);
        return null;
      }

      if (!data) return null;

      // Calcular totales de ventas y gastos
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'paid')
        .gte('created_at', data.opened_at);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('cash_register_id', data.id);

      const totalSales = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      return {
        id: data.id,
        branchId: data.branch_id,
        initialAmount: Number(data.initial_amount),
        finalAmount: data.final_amount ? Number(data.final_amount) : undefined,
        totalSales,
        totalExpenses,
        openedAt: data.opened_at,
        closedAt: data.closed_at,
        openedBy: data.cashier_id,
        closedBy: data.cashier_id,
        status: (data.is_active ? 'open' : 'closed') as 'open' | 'closed',
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};