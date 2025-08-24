import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { mockApi } from '@/lib/mockApi';
import { shouldUseMockData } from '@/config/environment';
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
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          return await mockApi.createExpense(expenseData);
        }

        // Try real API first
        const response = await apiClient.createExpense(expenseData);
        return response;
      } catch (error) {
        // Fallback to mock on network error
        console.warn('Create expense API failed, falling back to mock data:', error);
        return await mockApi.createExpense(expenseData);
      }
    },
    onSuccess: () => {
      // Invalidate related queries
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
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          const response = await mockApi.getExpenses();
          return response.data;
        }

        // Try real API first
        const response = await apiClient.getExpenses() as any;
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      } catch (error) {
        // Fallback to mock data on network error
        console.warn('Expenses API failed, falling back to mock data:', error);
        const response = await mockApi.getExpenses();
        return response.data;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};