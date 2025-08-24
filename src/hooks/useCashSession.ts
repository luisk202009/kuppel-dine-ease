import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { mockApi } from '@/lib/mockApi';
import { shouldUseMockData } from '@/config/environment';
import { CashSession } from '@/types/api';

export const useCashSession = () => {
  return useQuery({
    queryKey: ['cash', 'current-session'],
    queryFn: async (): Promise<CashSession | null> => {
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          const response = await mockApi.getCurrentCashSession();
          return response.data;
        }

        // Try real API first
        const response = await apiClient.getCurrentCashSession() as any;
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      } catch (error) {
        // Fallback to mock data on network error
        if (!shouldUseMockData()) {
          console.warn('Cash session API failed, falling back to mock data:', error);
          try {
            const response = await mockApi.getCurrentCashSession();
            return response.data;
          } catch {
            return null;
          }
        }
        return null;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};