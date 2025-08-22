import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { InvoiceRequest, InvoiceResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export const useCreateInvoice = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceData: InvoiceRequest): Promise<InvoiceResponse> => {
      const response = await apiClient.createInvoice(invoiceData) as InvoiceResponse;
      if (response.success) {
        return response;
      }
      throw new Error('Failed to create invoice');
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