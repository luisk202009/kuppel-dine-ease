import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_type_id: string;
  variant_value: string;
  price: number;
  cost?: number;
  stock: number;
  min_stock: number;
  sku?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variant_types?: {
    id: string;
    name: string;
  };
}

export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          variant_types!fk_product_variants_variant_type (
            id,
            name
          )
        `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('variant_value', { ascending: true });

      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId,
  });
};

export const useCreateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at' | 'variant_types'>) => {
      const { data: result, error } = await supabase
        .from('product_variants')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variante creada');
    },
    onError: (error) => {
      console.error('Error creating variant:', error);
      toast.error('Error al crear variante');
    },
  });
};

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, product_id, ...data }: Partial<ProductVariant> & { id: string; product_id: string }) => {
      const { data: result, error } = await supabase
        .from('product_variants')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variante actualizada');
    },
    onError: (error) => {
      console.error('Error updating variant:', error);
      toast.error('Error al actualizar variante');
    },
  });
};

export const useDeleteProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variante eliminada');
    },
    onError: (error) => {
      console.error('Error deleting variant:', error);
      toast.error('Error al eliminar variante');
    },
  });
};
