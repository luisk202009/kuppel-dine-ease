import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface OnlineOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface OnlineOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OnlineOrderItem[];
}

interface UseOnlineOrdersProps {
  companyId: string | undefined;
}

export const useOnlineOrders = ({ companyId }: UseOnlineOrdersProps) => {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('online_orders')
        .select(`
          *,
          items:online_order_items(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data as OnlineOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('online_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() } 
            : order
        )
      );

      toast.success('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const getWhatsAppLink = (order: OnlineOrder, message?: string) => {
    const phone = order.customer_phone.replace(/\D/g, '');
    const defaultMessage = `Hola ${order.customer_name}, gracias por tu pedido ${order.order_number}. `;
    const encodedMessage = encodeURIComponent(message || defaultMessage);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  return {
    orders,
    isLoading,
    statusFilter,
    setStatusFilter,
    updateOrderStatus,
    getWhatsAppLink,
    refetch: fetchOrders,
  };
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  preparing: { label: 'Preparando', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  shipped: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};
