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
  orderNumber?: string;
  error?: string;
}

export const usePublicStoreOrder = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
    const { companyId, companyName, whatsappNumber, cart, customerInfo, total } = params;

    setIsSubmitting(true);

    try {
      // 1. Generate order number using the database function
      const { data: orderNumber, error: numberError } = await supabase
        .rpc('generate_online_order_number', {
          p_company_id: companyId,
        });

      if (numberError) {
        console.error('Error generating order number:', numberError);
        throw new Error('Error al generar el número de pedido');
      }

      // 2. Create the online order
      const { data: order, error: orderError } = await supabase
        .from('online_orders')
        .insert({
          company_id: companyId,
          order_number: orderNumber,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          status: 'pending',
          subtotal: total,
          total: total,
        })
        .select('id, order_number')
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error('Error al crear el pedido: ' + orderError.message);
      }

      // 3. Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('online_order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Try to delete the order if items failed
        await supabase.from('online_orders').delete().eq('id', order.id);
        throw new Error('Error al guardar los productos del pedido');
      }

      // 4. Generate WhatsApp message with order number
      const cleanNumber = whatsappNumber.replace(/\D/g, '');
      const message = `Hola, soy ${customerInfo.name}. Acabo de hacer el pedido online *#${order.order_number}* por valor de *$${total.toLocaleString()}*. Mi dirección es: ${customerInfo.address}`;
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

      // 5. Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');

      toast.success('¡Pedido enviado correctamente!', {
        description: `Tu pedido #${order.order_number} ha sido registrado`,
      });

      return {
        success: true,
        orderNumber: order.order_number,
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
