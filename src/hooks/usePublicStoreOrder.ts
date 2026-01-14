import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface CreateOrderParams {
  companyId: string;
  companyName: string;
  whatsappNumber: string;
  cart: CartItem[];
  customerInfo: CustomerInfo;
  total: number;
}

interface CreateOrderResult {
  success: boolean;
  invoiceNumber?: string;
  error?: string;
}

export const usePublicStoreOrder = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
    const { companyId, companyName, whatsappNumber, cart, customerInfo, total } = params;

    setIsSubmitting(true);

    try {
      // 1. Get the first branch for this company (needed for invoice creation)
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(1);

      if (branchError || !branches || branches.length === 0) {
        throw new Error('No se encontró una sucursal activa para esta empresa');
      }

      const branchId = branches[0].id;

      // 2. Get or create a default invoice type for online orders
      let invoiceTypeId: string | null = null;
      
      const { data: invoiceTypes } = await supabase
        .from('invoice_types')
        .select('id, prefix')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(1);

      if (invoiceTypes && invoiceTypes.length > 0) {
        invoiceTypeId = invoiceTypes[0].id;
      }

      // 3. Generate invoice number
      const prefix = invoiceTypes?.[0]?.prefix || 'WEB';
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('generate_invoice_number_with_prefix', {
          p_branch_id: branchId,
          p_prefix: prefix,
        });

      if (numberError) {
        console.error('Error generating invoice number:', numberError);
        throw new Error('Error al generar el número de factura');
      }

      // 4. Create customer info JSON for notes
      const customerData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        origin: 'online_store',
      };

      // 5. Create the invoice - use a system user approach for public orders
      // Since this is a public store, we need to insert without authentication
      // We'll use the notes field to store customer info
      const { data: invoice, error: invoiceError } = await supabase
        .from('standard_invoices')
        .insert({
          branch_id: branchId,
          invoice_number: invoiceNumber,
          invoice_type_id: invoiceTypeId,
          status: 'pending',
          source: 'online_store',
          subtotal: total,
          total: total,
          total_tax: 0,
          total_discount: 0,
          notes: JSON.stringify(customerData),
          issue_date: new Date().toISOString().split('T')[0],
          created_by: '00000000-0000-0000-0000-000000000000', // Placeholder for public orders
        })
        .select('id, invoice_number')
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw new Error('Error al crear el pedido: ' + invoiceError.message);
      }

      // 6. Create invoice items
      const invoiceItems = cart.map((item, index) => ({
        invoice_id: invoice.id,
        product_id: item.product.id,
        item_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
        total: item.product.price * item.quantity,
        display_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('standard_invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        // Try to delete the invoice if items failed
        await supabase.from('standard_invoices').delete().eq('id', invoice.id);
        throw new Error('Error al guardar los productos del pedido');
      }

      // 7. Generate WhatsApp message with invoice number
      const cleanNumber = whatsappNumber.replace(/\D/g, '');
      const message = `Hola, soy ${customerInfo.name}. Acabo de hacer el pedido online *#${invoice.invoice_number}* por valor de *$${total.toLocaleString()}*. Mi dirección es: ${customerInfo.address}`;
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

      // 8. Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');

      toast.success('¡Pedido enviado correctamente!', {
        description: `Tu pedido #${invoice.invoice_number} ha sido registrado`,
      });

      return {
        success: true,
        invoiceNumber: invoice.invoice_number,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al procesar el pedido', {
        description: message,
      });
      return {
        success: false,
        error: message,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createOrder,
    isSubmitting,
  };
};
