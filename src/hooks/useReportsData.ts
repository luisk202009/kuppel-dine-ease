import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay, format } from 'date-fns';

export interface SalesMetrics {
  totalSales: number;
  avgTicket: number;
  ordersCount: number;
  orders: Array<{
    id: string;
    created_at: string;
    customer_name: string | null;
    payment_method: string;
    status: string;
    total: number;
  }>;
}

export interface ExpenseMetrics {
  totalExpenses: number;
  avgExpense: number;
  expensesCount: number;
  expenses: Array<{
    id: string;
    created_at: string;
    description: string;
    category: string;
    amount: number;
  }>;
}

export interface ProductMetrics {
  topProduct: string;
  totalRevenue: number;
  totalUnitsSold: number;
  products: Array<{
    id: string;
    name: string;
    category: string;
    units_sold: number;
    stock: number;
    total_revenue: number;
  }>;
}

export interface TransactionMetrics {
  netFlow: number;
  totalIncome: number;
  totalExpenses: number;
  transactions: Array<{
    id: string;
    date: string;
    type: 'income' | 'expense';
    concept: string;
    amount: number;
  }>;
}

const formatDateForQuery = (date: Date) => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

export const useSalesReport = (dateRange: DateRange | undefined) => {
  return useQuery({
    queryKey: ['reports', 'sales', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<SalesMetrics> => {
      if (!dateRange?.from || !dateRange?.to) {
        return { totalSales: 0, avgTicket: 0, ordersCount: 0, orders: [] };
      }

      const startDate = formatDateForQuery(startOfDay(dateRange.from));
      const endDate = formatDateForQuery(endOfDay(dateRange.to));

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          payment_method,
          status,
          total,
          customers (name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }

      const paidOrders = orders?.filter(o => o.status === 'paid') || [];
      const totalSales = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const ordersCount = paidOrders.length;
      const avgTicket = ordersCount > 0 ? totalSales / ordersCount : 0;

      return {
        totalSales,
        avgTicket,
        ordersCount,
        orders: (orders || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          customer_name: (order.customers as any)?.name || null,
          payment_method: order.payment_method || 'cash',
          status: order.status || 'pending',
          total: Number(order.total),
        })),
      };
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 30 * 1000,
  });
};

export const useExpensesReport = (dateRange: DateRange | undefined) => {
  return useQuery({
    queryKey: ['reports', 'expenses', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<ExpenseMetrics> => {
      if (!dateRange?.from || !dateRange?.to) {
        return { totalExpenses: 0, avgExpense: 0, expensesCount: 0, expenses: [] };
      }

      const startDate = formatDateForQuery(startOfDay(dateRange.from));
      const endDate = formatDateForQuery(endOfDay(dateRange.to));

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const expensesCount = expenses?.length || 0;
      const avgExpense = expensesCount > 0 ? totalExpenses / expensesCount : 0;

      return {
        totalExpenses,
        avgExpense,
        expensesCount,
        expenses: (expenses || []).map(exp => ({
          id: exp.id,
          created_at: exp.created_at,
          description: exp.description || '',
          category: exp.category || 'general',
          amount: Number(exp.amount),
        })),
      };
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 30 * 1000,
  });
};

export const useProductsReport = (dateRange: DateRange | undefined) => {
  return useQuery({
    queryKey: ['reports', 'products', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<ProductMetrics> => {
      if (!dateRange?.from || !dateRange?.to) {
        return { topProduct: '-', totalRevenue: 0, totalUnitsSold: 0, products: [] };
      }

      const startDate = formatDateForQuery(startOfDay(dateRange.from));
      const endDate = formatDateForQuery(endOfDay(dateRange.to));

      // Get orders in date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'paid')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      const orderIds = orders?.map(o => o.id) || [];

      if (orderIds.length === 0) {
        return { topProduct: '-', totalRevenue: 0, totalUnitsSold: 0, products: [] };
      }

      // Get order items for those orders
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products (
            id,
            name,
            stock,
            categories (name)
          )
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        throw itemsError;
      }

      // Aggregate by product
      const productMap = new Map<string, {
        id: string;
        name: string;
        category: string;
        units_sold: number;
        stock: number;
        total_revenue: number;
      }>();

      orderItems?.forEach(item => {
        const product = item.products as any;
        if (!product) return;

        const existing = productMap.get(product.id);
        if (existing) {
          existing.units_sold += item.quantity;
          existing.total_revenue += Number(item.total_price);
        } else {
          productMap.set(product.id, {
            id: product.id,
            name: product.name,
            category: product.categories?.name || 'Sin categoría',
            units_sold: item.quantity,
            stock: product.stock || 0,
            total_revenue: Number(item.total_price),
          });
        }
      });

      const products = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue);

      const totalRevenue = products.reduce((sum, p) => sum + p.total_revenue, 0);
      const totalUnitsSold = products.reduce((sum, p) => sum + p.units_sold, 0);
      const topProduct = products[0]?.name || '-';

      return {
        topProduct,
        totalRevenue,
        totalUnitsSold,
        products,
      };
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 30 * 1000,
  });
};

export const useTransactionsReport = (dateRange: DateRange | undefined) => {
  return useQuery({
    queryKey: ['reports', 'transactions', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<TransactionMetrics> => {
      if (!dateRange?.from || !dateRange?.to) {
        return { netFlow: 0, totalIncome: 0, totalExpenses: 0, transactions: [] };
      }

      const startDate = formatDateForQuery(startOfDay(dateRange.from));
      const endDate = formatDateForQuery(endOfDay(dateRange.to));

      // Get paid orders (income)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, total, order_number')
        .eq('status', 'paid')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Get expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id, created_at, amount, description')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        throw expensesError;
      }

      const incomeTransactions = (orders || []).map(order => ({
        id: order.id,
        date: order.created_at,
        type: 'income' as const,
        concept: `Venta #${order.order_number || order.id.slice(0, 8)}`,
        amount: Number(order.total),
      }));

      const expenseTransactions = (expenses || []).map(exp => ({
        id: exp.id,
        date: exp.created_at,
        type: 'expense' as const,
        concept: exp.description || 'Gasto',
        amount: Number(exp.amount),
      }));

      const transactions = [...incomeTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const netFlow = totalIncome - totalExpenses;

      return {
        netFlow,
        totalIncome,
        totalExpenses,
        transactions,
      };
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 30 * 1000,
  });
};
