import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  StandardInvoice,
  StandardInvoiceFormData,
  InvoiceStatus,
  InvoiceSource,
  mapInvoiceRowToInvoice,
  mapInvoiceItemRowToItem,
  mapInvoiceTypeRowToInvoiceType,
  calculateItemTotals,
  calculateInvoiceTotals,
} from '@/types/invoicing';

// Fetch all invoices for user's branches
export const useStandardInvoices = (filters?: {
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  source?: InvoiceSource;
  invoiceTypeCode?: string;
}) => {
  return useQuery({
    queryKey: ['standard-invoices', filters],
    queryFn: async (): Promise<StandardInvoice[]> => {
      let query = supabase
        .from('standard_invoices')
        .select(`
          *,
          customers (
            id,
            name,
            last_name,
            identification,
            email,
            phone,
            address,
            city
          ),
          invoice_types (
            id,
            company_id,
            code,
            name,
            prefix,
            print_format,
            is_pos_default,
            is_standard_default,
            is_active,
            display_order,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('issue_date', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters?.endDate) {
        query = query.lte('issue_date', filters.endDate.toISOString().split('T')[0]);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;

      if (error) throw error;

      let results = (data || []).map((row: any) => ({
        ...mapInvoiceRowToInvoice(row),
        customer: row.customers ? {
          id: row.customers.id,
          name: row.customers.name,
          lastName: row.customers.last_name,
          identification: row.customers.identification,
          email: row.customers.email,
          phone: row.customers.phone,
          address: row.customers.address,
          city: row.customers.city,
        } : undefined,
        invoiceType: row.invoice_types ? mapInvoiceTypeRowToInvoiceType(row.invoice_types) : undefined,
      }));

      // Filter by invoice type code if specified
      if (filters?.invoiceTypeCode) {
        results = results.filter(inv => inv.invoiceType?.code === filters.invoiceTypeCode);
      }

      return results;
    },
    staleTime: 30 * 1000,
  });
};

// Fetch single invoice with items
export const useStandardInvoice = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['standard-invoice', invoiceId],
    queryFn: async (): Promise<StandardInvoice | null> => {
      if (!invoiceId) return null;

      const { data: invoice, error: invoiceError } = await supabase
        .from('standard_invoices')
        .select(`
          *,
          customers (
            id,
            name,
            last_name,
            identification,
            email,
            phone,
            address,
            city
          ),
          invoice_types (
            id,
            company_id,
            code,
            name,
            prefix,
            print_format,
            is_pos_default,
            is_standard_default,
            is_active,
            display_order,
            created_at,
            updated_at
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from('standard_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('display_order', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...mapInvoiceRowToInvoice(invoice),
        items: (items || []).map(mapInvoiceItemRowToItem),
        customer: invoice.customers ? {
          id: invoice.customers.id,
          name: invoice.customers.name,
          lastName: invoice.customers.last_name,
          identification: invoice.customers.identification,
          email: invoice.customers.email,
          phone: invoice.customers.phone,
          address: invoice.customers.address,
          city: invoice.customers.city,
        } : undefined,
        invoiceType: invoice.invoice_types ? mapInvoiceTypeRowToInvoiceType(invoice.invoice_types) : undefined,
      };
    },
    enabled: !!invoiceId,
  });
};

// Generate unique invoice number (legacy - kept for backward compatibility)
export const useGenerateInvoiceNumber = () => {
  return useMutation({
    mutationFn: async (branchId: string): Promise<string> => {
      const today = new Date();
      const prefix = `FE-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('standard_invoices')
        .select('invoice_number')
        .eq('branch_id', branchId)
        .like('invoice_number', `${prefix}%`)
        .order('invoice_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number;
        const numPart = parseInt(lastNumber.split('-').pop() || '0', 10);
        nextNumber = numPart + 1;
      }

      return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
    },
  });
};

// Create invoice with items
export const useCreateStandardInvoice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      branchId,
      formData,
      invoiceTypeId,
    }: {
      branchId: string;
      formData: StandardInvoiceFormData;
      invoiceTypeId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get invoice type to determine prefix
      let prefix = 'FE';
      if (invoiceTypeId || formData.invoiceTypeId) {
        const { data: invoiceType } = await supabase
          .from('invoice_types')
          .select('prefix')
          .eq('id', invoiceTypeId || formData.invoiceTypeId)
          .single();
        
        if (invoiceType) {
          prefix = invoiceType.prefix;
        }
      } else {
        // Use standard default
        const { data: defaultType } = await supabase
          .from('invoice_types')
          .select('id, prefix')
          .eq('is_standard_default', true)
          .maybeSingle();
        
        if (defaultType) {
          invoiceTypeId = defaultType.id;
          prefix = defaultType.prefix;
        }
      }

      // Generate invoice number with prefix
      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number_with_prefix', {
        p_branch_id: branchId,
        p_prefix: prefix,
      });

      // Calculate totals
      const totals = calculateInvoiceTotals(formData.items);

      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('standard_invoices')
        .insert({
          branch_id: branchId,
          customer_id: formData.customerId || null,
          invoice_type_id: invoiceTypeId || formData.invoiceTypeId || null,
          invoice_number: invoiceNumber,
          source: 'manual',
          issue_date: formData.issueDate.toISOString().split('T')[0],
          due_date: formData.dueDate?.toISOString().split('T')[0] || null,
          currency: formData.currency,
          subtotal: totals.subtotal,
          total_tax: totals.totalTax,
          total_discount: totals.totalDiscount,
          total: totals.total,
          payment_method: formData.paymentMethod || null,
          status: 'draft',
          notes: formData.notes || null,
          terms_conditions: formData.termsConditions || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items
      if (formData.items.length > 0) {
        const itemsToInsert = formData.items.map((item, index) => {
          const itemTotals = calculateItemTotals(
            item.quantity,
            item.unitPrice,
            item.taxRate,
            item.discountRate
          );

          return {
            invoice_id: invoice.id,
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
            display_order: index,
          };
        });

        const { error: itemsError } = await supabase
          .from('standard_invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: 'Factura creada',
        description: 'La factura se ha guardado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear factura',
        description: error.message || 'No se pudo crear la factura',
      });
    },
  });
};

// Update invoice
export const useUpdateStandardInvoice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      formData,
    }: {
      invoiceId: string;
      formData: StandardInvoiceFormData;
    }) => {
      // Calculate totals
      const totals = calculateInvoiceTotals(formData.items);

      // Update invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('standard_invoices')
        .update({
          customer_id: formData.customerId || null,
          issue_date: formData.issueDate.toISOString().split('T')[0],
          due_date: formData.dueDate?.toISOString().split('T')[0] || null,
          currency: formData.currency,
          subtotal: totals.subtotal,
          total_tax: totals.totalTax,
          total_discount: totals.totalDiscount,
          total: totals.total,
          payment_method: formData.paymentMethod || null,
          notes: formData.notes || null,
          terms_conditions: formData.termsConditions || null,
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Delete existing items
      await supabase
        .from('standard_invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      // Insert new items
      if (formData.items.length > 0) {
        const itemsToInsert = formData.items.map((item, index) => {
          const itemTotals = calculateItemTotals(
            item.quantity,
            item.unitPrice,
            item.taxRate,
            item.discountRate
          );

          return {
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
            display_order: index,
          };
        });

        const { error: itemsError } = await supabase
          .from('standard_invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoice', variables.invoiceId] });
      toast({
        title: 'Factura actualizada',
        description: 'Los cambios se han guardado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar factura',
        description: error.message || 'No se pudieron guardar los cambios',
      });
    },
  });
};

// Update invoice status
export const useUpdateInvoiceStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      status,
      paymentReference,
    }: {
      invoiceId: string;
      status: InvoiceStatus;
      paymentReference?: string;
    }) => {
      const updateData: any = { status };
      if (paymentReference) {
        updateData.payment_reference = paymentReference;
      }

      const { data, error } = await supabase
        .from('standard_invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoice', variables.invoiceId] });
      
      const statusMessages: Record<InvoiceStatus, string> = {
        draft: 'Factura marcada como borrador',
        issued: 'Factura emitida exitosamente',
        paid: 'Factura marcada como pagada',
        cancelled: 'Factura cancelada',
        overdue: 'Factura marcada como vencida',
      };
      
      toast({
        title: 'Estado actualizado',
        description: statusMessages[variables.status],
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar estado',
        description: error.message || 'No se pudo cambiar el estado',
      });
    },
  });
};

// Delete invoice (only drafts)
export const useDeleteStandardInvoice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // First delete items
      await supabase
        .from('standard_invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      // Then delete invoice
      const { error } = await supabase
        .from('standard_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: 'Factura eliminada',
        description: 'La factura se ha eliminado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar factura',
        description: error.message || 'No se pudo eliminar la factura',
      });
    },
  });
};
