import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyStats } from '@/types/api';

export const useDailyStats = (date?: string) => {
  return useQuery({
    queryKey: ['stats', 'daily', date],
    queryFn: async (): Promise<DailyStats | null> => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;

      // Obtener órdenes del día
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('status', 'paid')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) {
        console.error('Error fetching stats:', error);
        return null;
      }

      if (!orders || orders.length === 0) {
        return {
          date: targetDate,
          totalSales: 0,
          totalTransactions: 0,
          totalCustomers: 0,
          averageTicket: 0,
          paymentMethods: { cash: 0, card: 0, credit: 0, transfer: 0 },
          topProducts: [],
          hourlySales: [],
        };
      }

      // Calcular estadísticas
      const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const totalTransactions = orders.length;
      const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;
      const averageTicket = totalSales / totalTransactions;

      // Métodos de pago
      const paymentMethods = orders.reduce((acc, order) => {
        const method = order.payment_method || 'cash';
        acc[method] = (acc[method] || 0) + Number(order.total);
        return acc;
      }, { cash: 0, card: 0, credit: 0, transfer: 0 });

      // Top productos
      const productStats: Record<string, any> = {};
      orders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productId = item.product_id;
          if (!productStats[productId]) {
            productStats[productId] = {
              productId,
              productName: item.products?.name || 'Unknown',
              quantity: 0,
              revenue: 0,
            };
          }
          productStats[productId].quantity += item.quantity;
          productStats[productId].revenue += Number(item.total_price);
        });
      });

      const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      // Ventas por hora
      const hourlySales = Array.from({ length: 24 }, (_, hour) => {
        const hourOrders = orders.filter(order => {
          const orderHour = new Date(order.created_at).getHours();
          return orderHour === hour;
        });
        return {
          hour,
          sales: hourOrders.reduce((sum, order) => sum + Number(order.total), 0),
          transactions: hourOrders.length,
        };
      });

      return {
        date: targetDate,
        totalSales,
        totalTransactions,
        totalCustomers: uniqueCustomers,
        averageTicket,
        paymentMethods,
        topProducts,
        hourlySales,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};