import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ExpensesResponse, ExpenseRequest, ApiExpense } from '@/types/api';

export const useExpenses = (date?: string) => {
  return useQuery({
    queryKey: ['expenses', date],
    queryFn: async (): Promise<ApiExpense[]> => {
      const response = await apiClient.getExpenses(date) as ExpensesResponse;
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expenseData: ExpenseRequest) => {
      return await apiClient.createExpense(expenseData);
    },
    onSuccess: () => {
      // Invalidate and refetch expenses
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};