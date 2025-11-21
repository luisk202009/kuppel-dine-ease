import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvoiceRequest } from '@/types/api';
import { Order } from '@/types/pos';

// Helper function to map Supabase orders to Order type
const mapSupabaseOrderToOrder = (order: any): Order => ({
  id: order.id,
  tableId: order.table_id || '',
  customerId: order.customer_id,
  customer: order.customers ? {
    id: order.customers.id,
    name: order.customers.name,
    lastName: order.customers.last_name || '',
    identification: order.customers.identification || '',
    phone: order.customers.phone || '',
    city: order.customers.city || '',
    email: order.customers.email || '',
    createdAt: new Date(order.customers.created_at),
  } : undefined,
  items: (order.order_items || []).map((item: any) => ({
    id: item.id,
    productId: item.product_id,
    product: item.products ? {
      id: item.products.id,
      name: item.products.name,
      category: item.products.category_id,
      price: Number(item.products.price),
      description: item.products.description,
      image: item.products.image_url,
      available: item.products.is_active,
      isAlcoholic: item.products.is_alcoholic,
    } : {
      id: item.product_id,
      name: 'Producto desconocido',
      category: '',
      price: Number(item.unit_price),
      available: true,
    },
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    total: Number(item.total_price),
    notes: item.notes,
  })),
  subtotal: Number(order.subtotal),
  taxes: Number(order.tax_amount),
  discount: Number(order.discount),
  total: Number(order.total),
  status: order.status,
  paymentMethod: order.payment_method,
  createdAt: new Date(order.created_at),
  updatedAt: new Date(order.updated_at),
  waiterId: order.waiter_id,
});

export const useCreateInvoice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: InvoiceRequest) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Generar número de orden
      const orderNumber = `ORD-${Date.now()}`;

      // Crear la orden
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          branch_id: invoiceData.branchId,
          table_id: invoiceData.tableId,
          customer_id: invoiceData.customerId,
          subtotal: invoiceData.subtotal,
          tax_amount: invoiceData.taxes,
          discount: invoiceData.discount,
          total: invoiceData.total,
          payment_method: invoiceData.paymentMethod,
          status: 'paid',
          order_number: orderNumber,
          cashier_id: user.id,
          notes: invoiceData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear los items de la orden
      const orderItems = invoiceData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Factura creada",
        description: "La factura se ha creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al crear factura",
        description: error.message || "No se pudo crear la factura",
      });
    },
  });
};

export const useGetInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          customers (*),
          branches (*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          customers (*),
          branches (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapSupabaseOrderToOrder);
    },
    staleTime: 30000, // 30 seconds
  });
};