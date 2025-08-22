import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { CashResponse, CashOpenRequest, CashCloseRequest } from '@/types/api';

export const useOpenCash = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CashOpenRequest) => {
      return await apiClient.openCash(data);
    },
    onSuccess: () => {
      // Invalidate and refetch cash sessions
      queryClient.invalidateQueries({ queryKey: ['cash'] });
    },
  });
};

export const useCloseCash = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CashCloseRequest) => {
      return await apiClient.closeCash(data);
    },
    onSuccess: () => {
      // Invalidate and refetch cash sessions
      queryClient.invalidateQueries({ queryKey: ['cash'] });
    },
  });
};