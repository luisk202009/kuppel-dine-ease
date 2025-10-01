import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
  attachments?: string[];
}

export const useCreateExpense = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          branch_id: expenseData.branchId,
          category: expenseData.category,
          amount: expenseData.amount,
          description: expenseData.description,
          user_id: user.id,
          receipt_url: expenseData.receiptUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      toast({
        title: "Gasto registrado",
        description: "El gasto se ha guardado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al registrar gasto",
        description: error.message || "No se pudo guardar el gasto",
      });
    },
  });
};

export const useExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(expense => ({
        id: expense.id,
        amount: Number(expense.amount),
        description: expense.description,
        category: expense.category || 'general',
        createdAt: expense.created_at,
        attachments: expense.receipt_url ? [expense.receipt_url] : [],
      }));
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};