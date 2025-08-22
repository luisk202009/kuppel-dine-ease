import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { CashSession } from '@/types/api';

export const useCashSession = () => {
  return useQuery({
    queryKey: ['cash', 'current-session'],
    queryFn: async (): Promise<CashSession | null> => {
      try {
        const response = await apiClient.getCurrentCashSession() as any;
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      } catch (error) {
        // If no active session, return null instead of throwing
        return null;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};