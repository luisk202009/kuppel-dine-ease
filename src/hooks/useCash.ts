import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOpenCash = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { branchId: string; initialAmount: number; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: cashRegister, error } = await supabase
        .from('cash_registers')
        .insert({
          branch_id: data.branchId,
          cashier_id: user.id,
          initial_amount: data.initialAmount,
          notes: data.notes,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return cashRegister;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'current-session'] });
      toast({
        title: "Caja abierta",
        description: "La caja se ha abierto exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al abrir caja",
        description: error.message || "No se pudo abrir la caja",
      });
    },
  });
};

export const useCloseCash = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string; finalAmount: number; notes?: string }) => {
      // Obtener el registro de caja actual
      const { data: currentRegister } = await supabase
        .from('cash_registers')
        .select('initial_amount, opened_at')
        .eq('id', data.sessionId)
        .single();

      if (!currentRegister) throw new Error('Sesión de caja no encontrada');

      // Calcular el monto esperado basado en ventas y gastos
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'paid')
        .gte('created_at', currentRegister.opened_at);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('cash_register_id', data.sessionId);

      const totalSales = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const expectedAmount = Number(currentRegister.initial_amount) + totalSales - totalExpenses;

      const { data: cashRegister, error } = await supabase
        .from('cash_registers')
        .update({
          final_amount: data.finalAmount,
          expected_amount: expectedAmount,
          difference: data.finalAmount - expectedAmount,
          closed_at: new Date().toISOString(),
          is_active: false,
          notes: data.notes,
        })
        .eq('id', data.sessionId)
        .select()
        .single();

      if (error) throw error;
      return cashRegister;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'current-session'] });
      toast({
        title: "Caja cerrada",
        description: "La caja se ha cerrado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al cerrar caja",
        description: error.message || "No se pudo cerrar la caja",
      });
    },
  });
};
