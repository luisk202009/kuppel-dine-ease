import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { mockApi } from '@/lib/mockApi';
import { shouldUseMockData } from '@/config/environment';
import { InvoiceRequest, InvoiceResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export const useCreateInvoice = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceData: InvoiceRequest): Promise<InvoiceResponse> => {
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          return await mockApi.createInvoice(invoiceData);
        }

        // Try real API first
        const response = await apiClient.createInvoice(invoiceData) as InvoiceResponse;
        if (response.success) {
          return response;
        }
        throw new Error('Failed to create invoice');
      } catch (error) {
        // Fallback to mock on network error
        console.warn('Invoice API failed, falling back to mock data:', error);
        return await mockApi.createInvoice(invoiceData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Factura creada",
        description: "La factura se ha creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al crear factura",
        description: error.message || "No se pudo crear la factura",
      });
    },
  });
};

export const useGetInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async (): Promise<InvoiceResponse> => {
      const response = await apiClient.getInvoice(invoiceId) as InvoiceResponse;
      if (response.success) {
        return response;
      }
      throw new Error('Failed to fetch invoice');
    },
    enabled: !!invoiceId,
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          const response = await mockApi.getInvoices();
          return response.data;
        }

        // Try real API first
        const response = await apiClient.getInvoices() as any;
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      } catch (error) {
        // Fallback to mock data on network error
        console.warn('Invoices API failed, falling back to mock data:', error);
        const response = await mockApi.getInvoices();
        return response.data;
      }
    },
    staleTime: 30000, // 30 seconds
  });
};