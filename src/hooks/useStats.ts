import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { StatsResponse, DailyStats } from '@/types/api';

export const useDailyStats = (date?: string) => {
  return useQuery({
    queryKey: ['stats', 'daily', date],
    queryFn: async (): Promise<DailyStats | null> => {
      const response = await apiClient.getDailyStats(date) as StatsResponse;
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};