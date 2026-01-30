import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface DataicoResponse {
  success: boolean;
  message: string;
  dataico?: {
    uuid?: string;
    cufe?: string;
    pdf_url?: string;
    xml_url?: string;
  };
  error?: string;
  details?: any;
}

interface SendOptions {
  sendEmail?: boolean;
}

export const useDataico = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const sendInvoiceToDataico = async (
    invoiceId: string, 
    options?: SendOptions
  ): Promise<DataicoResponse | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-dataico-invoice', {
        body: { 
          invoiceId,
          sendEmail: options?.sendEmail ?? false
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Error al comunicarse con el servidor');
      }

      if (data?.success) {
        toast({
          title: '✅ Factura enviada a la DIAN',
          description: data.message || 'La factura fue procesada correctamente',
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
        queryClient.invalidateQueries({ queryKey: ['standard-invoice', invoiceId] });
        
        return data;
      } else {
        // Handle Dataico API errors
        const errorMessage = data?.error || data?.message || 'Error desconocido';
        const errorDetails = data?.details;
        
        throw { message: errorMessage, details: errorDetails };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'No se pudo enviar la factura a la DIAN';
      const errorDetails = error.details;
      
      console.error('Dataico error:', { errorMessage, errorDetails });
      
      toast({
        variant: 'destructive',
        title: '❌ Error de Facturación Electrónica',
        description: typeof errorDetails === 'object' 
          ? JSON.stringify(errorDetails).slice(0, 150) 
          : errorMessage,
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendInvoiceToDataico,
    isLoading,
  };
};
