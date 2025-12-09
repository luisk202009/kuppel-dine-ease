import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  StandardInvoiceItem,
  StandardInvoiceItemFormData,
  mapInvoiceItemRowToItem,
  calculateItemTotals,
  calculateInvoiceTotals,
} from '@/types/invoicing';

// Fetch items for a specific invoice
export const useStandardInvoiceItems = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['standard-invoice-items', invoiceId],
    queryFn: async (): Promise<StandardInvoiceItem[]> => {
      if (!invoiceId) return [];

      const { data, error } = await supabase
        .from('standard_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(mapInvoiceItemRowToItem);
    },
    enabled: !!invoiceId,
  });
};

// Helper to update invoice totals after item changes
const updateInvoiceTotals = async (invoiceId: string) => {
  const { data: items, error: itemsError } = await supabase
    .from('standard_invoice_items')
    .select('quantity, unit_price, tax_rate, discount_rate')
    .eq('invoice_id', invoiceId);

  if (itemsError) throw itemsError;

  const formItems: StandardInvoiceItemFormData[] = (items || []).map(item => ({
    itemName: '',
    quantity: item.quantity,
    unitPrice: item.unit_price,
    taxRate: item.tax_rate,
    discountRate: item.discount_rate,
  }));

  const totals = calculateInvoiceTotals(formItems);

  const { error: updateError } = await supabase
    .from('standard_invoices')
    .update({
      subtotal: totals.subtotal,
      total_tax: totals.totalTax,
      total_discount: totals.totalDiscount,
      total: totals.total,
    })
    .eq('id', invoiceId);

  if (updateError) throw updateError;
};

// Add item to invoice
export const useAddInvoiceItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      item,
    }: {
      invoiceId: string;
      item: StandardInvoiceItemFormData;
    }) => {
      // Get current max display_order
      const { data: existingItems } = await supabase
        .from('standard_invoice_items')
        .select('display_order')
        .eq('invoice_id', invoiceId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingItems && existingItems.length > 0
        ? (existingItems[0].display_order || 0) + 1
        : 0;

      const itemTotals = calculateItemTotals(
        item.quantity,
        item.unitPrice,
        item.taxRate,
        item.discountRate
      );

      const { data, error } = await supabase
        .from('standard_invoice_items')
        .insert({
          invoice_id: invoiceId,
          product_id: item.productId || null,
          item_name: item.itemName,
          description: item.description || null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
          tax_amount: itemTotals.taxAmount,
          discount_rate: item.discountRate,
          discount_amount: itemTotals.discountAmount,
          subtotal: itemTotals.subtotal,
          total: itemTotals.total,
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      // Update invoice totals
      await updateInvoiceTotals(invoiceId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoice-items', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: 'Ítem agregado',
        description: 'El ítem se ha agregado a la factura',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al agregar ítem',
        description: error.message || 'No se pudo agregar el ítem',
      });
    },
  });
};

// Update invoice item
export const useUpdateInvoiceItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      invoiceId,
      item,
    }: {
      itemId: string;
      invoiceId: string;
      item: Partial<StandardInvoiceItemFormData>;
    }) => {
      // Get current item to merge with updates
      const { data: currentItem, error: fetchError } = await supabase
        .from('standard_invoice_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const quantity = item.quantity ?? currentItem.quantity;
      const unitPrice = item.unitPrice ?? currentItem.unit_price;
      const taxRate = item.taxRate ?? currentItem.tax_rate;
      const discountRate = item.discountRate ?? currentItem.discount_rate;

      const itemTotals = calculateItemTotals(quantity, unitPrice, taxRate, discountRate);

      const updateData: any = {};
      if (item.productId !== undefined) updateData.product_id = item.productId || null;
      if (item.itemName !== undefined) updateData.item_name = item.itemName;
      if (item.description !== undefined) updateData.description = item.description || null;
      if (item.quantity !== undefined) updateData.quantity = item.quantity;
      if (item.unitPrice !== undefined) updateData.unit_price = item.unitPrice;
      if (item.taxRate !== undefined) updateData.tax_rate = item.taxRate;
      if (item.discountRate !== undefined) updateData.discount_rate = item.discountRate;

      // Always update calculated fields
      updateData.tax_amount = itemTotals.taxAmount;
      updateData.discount_amount = itemTotals.discountAmount;
      updateData.subtotal = itemTotals.subtotal;
      updateData.total = itemTotals.total;

      const { data, error } = await supabase
        .from('standard_invoice_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Update invoice totals
      await updateInvoiceTotals(invoiceId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoice-items', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: 'Ítem actualizado',
        description: 'Los cambios se han guardado',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar ítem',
        description: error.message || 'No se pudieron guardar los cambios',
      });
    },
  });
};

// Delete invoice item
export const useDeleteInvoiceItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      invoiceId,
    }: {
      itemId: string;
      invoiceId: string;
    }) => {
      const { error } = await supabase
        .from('standard_invoice_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update invoice totals
      await updateInvoiceTotals(invoiceId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoice-items', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: 'Ítem eliminado',
        description: 'El ítem se ha eliminado de la factura',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar ítem',
        description: error.message || 'No se pudo eliminar el ítem',
      });
    },
  });
};

// Reorder invoice items
export const useReorderInvoiceItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      itemIds,
    }: {
      invoiceId: string;
      itemIds: string[];
    }) => {
      // Update display_order for each item
      const updates = itemIds.map((id, index) =>
        supabase
          .from('standard_invoice_items')
          .update({ display_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoice-items', variables.invoiceId] });
    },
  });
};
