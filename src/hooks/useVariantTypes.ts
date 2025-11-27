import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VariantType {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useVariantTypes = (companyId: string) => {
  return useQuery({
    queryKey: ['variant-types', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variant_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as VariantType[];
    },
    enabled: !!companyId,
  });
};

export const useCreateVariantType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<VariantType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('variant_types')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-types'] });
      toast.success('Tipo de variante creado');
    },
    onError: (error) => {
      console.error('Error creating variant type:', error);
      toast.error('Error al crear tipo de variante');
    },
  });
};

export const useUpdateVariantType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<VariantType> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('variant_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-types'] });
      toast.success('Tipo de variante actualizado');
    },
    onError: (error) => {
      console.error('Error updating variant type:', error);
      toast.error('Error al actualizar tipo de variante');
    },
  });
};

export const useDeleteVariantType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('variant_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-types'] });
      toast.success('Tipo de variante eliminado');
    },
    onError: (error) => {
      console.error('Error deleting variant type:', error);
      toast.error('Error al eliminar tipo de variante');
    },
  });
};
