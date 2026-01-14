import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoiceType, mapInvoiceTypeRowToInvoiceType, PrintFormat } from '@/types/invoicing';

// Fetch all invoice types for user's companies (optionally filtered by companyId)
export const useInvoiceTypes = (companyId?: string) => {
  return useQuery({
    queryKey: ['invoice-types', companyId],
    queryFn: async (): Promise<InvoiceType[]> => {
      let query = supabase
        .from('invoice_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row: any) => mapInvoiceTypeRowToInvoiceType(row));
    },
    enabled: companyId ? true : true, // Always enabled, but filtered when companyId provided
    staleTime: 60 * 1000,
  });
};

// Get POS default invoice type
export const usePosDefaultInvoiceType = () => {
  return useQuery({
    queryKey: ['invoice-types', 'pos-default'],
    queryFn: async (): Promise<InvoiceType | null> => {
      const { data, error } = await supabase
        .from('invoice_types')
        .select('*')
        .eq('is_pos_default', true)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapInvoiceTypeRowToInvoiceType(data);
    },
    staleTime: 60 * 1000,
  });
};

// Get Standard default invoice type
export const useStandardDefaultInvoiceType = () => {
  return useQuery({
    queryKey: ['invoice-types', 'standard-default'],
    queryFn: async (): Promise<InvoiceType | null> => {
      const { data, error } = await supabase
        .from('invoice_types')
        .select('*')
        .eq('is_standard_default', true)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapInvoiceTypeRowToInvoiceType(data);
    },
    staleTime: 60 * 1000,
  });
};

// Update invoice type
export const useUpdateInvoiceType = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name?: string;
        prefix?: string;
        printFormat?: PrintFormat;
        description?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('invoice_types')
        .update({
          name: updates.name,
          prefix: updates.prefix,
          print_format: updates.printFormat,
          description: updates.description,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-types'] });
      toast({
        title: 'Tipo de documento actualizado',
        description: 'Los cambios se han guardado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message || 'No se pudieron guardar los cambios',
      });
    },
  });
};

// Create new invoice type
export const useCreateInvoiceType = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      data: typeData,
    }: {
      companyId: string;
      data: {
        code: string;
        name: string;
        prefix: string;
        printFormat: PrintFormat;
        description?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from('invoice_types')
        .insert({
          company_id: companyId,
          code: typeData.code.toUpperCase(),
          name: typeData.name,
          prefix: typeData.prefix.toUpperCase(),
          print_format: typeData.printFormat,
          description: typeData.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-types'] });
      toast({
        title: 'Tipo de documento creado',
        description: 'El nuevo tipo de documento se ha creado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: error.message || 'No se pudo crear el tipo de documento',
      });
    },
  });
};

// Generate invoice number with prefix
export const useGenerateInvoiceNumberWithPrefix = () => {
  return useMutation({
    mutationFn: async ({ branchId, prefix }: { branchId: string; prefix: string }): Promise<string> => {
      const { data, error } = await supabase.rpc('generate_invoice_number_with_prefix', {
        p_branch_id: branchId,
        p_prefix: prefix,
      });

      if (error) throw error;
      return data as string;
    },
  });
};
