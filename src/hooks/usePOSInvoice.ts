import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePosDefaultInvoiceType, useGenerateInvoiceNumberWithPrefix } from './useInvoiceTypes';
import { calculateItemTotals } from '@/types/invoicing';

interface POSInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface POSInvoiceData {
  branchId: string;
  customerId?: string;
  tableId?: string;
  items: POSInvoiceItem[];
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  tipAmount?: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  paymentReference?: string;
  notes?: string;
}

export const useCreatePOSInvoice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: posInvoiceType } = usePosDefaultInvoiceType();
  const generateInvoiceNumber = useGenerateInvoiceNumberWithPrefix();

  return useMutation({
    mutationFn: async (invoiceData: POSInvoiceData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get invoice type (POS default)
      if (!posInvoiceType) {
        throw new Error('No se encontró el tipo de documento POS configurado');
      }

      // Generate invoice number with prefix
      const invoiceNumber = await generateInvoiceNumber.mutateAsync({
        branchId: invoiceData.branchId,
        prefix: posInvoiceType.prefix,
      });

      // Calculate tax rate from provided values
      const taxRate = invoiceData.subtotal > 0 
        ? invoiceData.taxes / invoiceData.subtotal 
        : 0.19;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('standard_invoices')
        .insert({
          branch_id: invoiceData.branchId,
          customer_id: invoiceData.customerId || null,
          invoice_type_id: posInvoiceType.id,
          invoice_number: invoiceNumber,
          source: 'pos',
          table_id: invoiceData.tableId || null,
          issue_date: new Date().toISOString().split('T')[0],
          currency: 'COP',
          subtotal: invoiceData.subtotal,
          total_tax: invoiceData.taxes,
          total_discount: invoiceData.discount,
          total: invoiceData.total,
          payment_method: invoiceData.paymentMethod,
          payment_reference: invoiceData.paymentReference,
          status: 'paid', // POS sales are always paid immediately
          notes: invoiceData.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (invoiceData.items.length > 0) {
        const itemsToInsert = invoiceData.items.map((item, index) => {
          const itemTotals = calculateItemTotals(
            item.quantity,
            item.unitPrice,
            taxRate * 100,
            0
          );

          return {
            invoice_id: invoice.id,
            product_id: item.productId,
            item_name: item.productName,
            description: item.notes || null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            tax_rate: taxRate * 100,
            tax_amount: itemTotals.taxAmount,
            discount_rate: 0,
            discount_amount: 0,
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

      return {
        ...invoice,
        invoiceType: posInvoiceType,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: 'Venta registrada',
        description: 'El ticket se ha generado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al procesar venta',
        description: error.message || 'No se pudo generar el ticket',
      });
    },
  });
};
