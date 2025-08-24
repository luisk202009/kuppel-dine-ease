import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { mockApi } from '@/lib/mockApi';
import { shouldUseMockData } from '@/config/environment';
import { useToast } from '@/hooks/use-toast';

export const useOpenCash = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cashData: { branchId: string; initialAmount: number; notes?: string }) => {
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          return await mockApi.openCash(cashData);
        }

        // Try real API first
        const response = await apiClient.openCash(cashData);
        return response;
      } catch (error) {
        // Fallback to mock on network error
        console.warn('Open cash API failed, falling back to mock data:', error);
        return await mockApi.openCash(cashData);
      }
    },
    onSuccess: () => {
      // Invalidate cash session queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      toast({
        title: "Caja abierta exitosamente",
        description: "La sesión de caja ha sido iniciada",
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
    mutationFn: async (cashData: { sessionId: string; finalAmount: number; notes?: string }) => {
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          return await mockApi.closeCash(cashData);
        }

        // Try real API first
        const response = await apiClient.closeCash(cashData);
        return response;
      } catch (error) {
        // Fallback to mock on network error
        console.warn('Close cash API failed, falling back to mock data:', error);
        return await mockApi.closeCash(cashData);
      }
    },
    onSuccess: () => {
      // Invalidate cash session queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      toast({
        title: "Caja cerrada exitosamente",
        description: "La sesión de caja ha sido finalizada",
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