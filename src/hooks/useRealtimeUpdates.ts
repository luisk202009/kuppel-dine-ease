import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;
type Table = Tables<'tables'>;

interface UseRealtimeUpdatesProps {
  onNewOrder?: (order: Order) => void;
  onTableStatusChange?: (table: Table, oldStatus: string) => void;
  enabled?: boolean;
}

export const useRealtimeUpdates = ({
  onNewOrder,
  onTableStatusChange,
  enabled = true
}: UseRealtimeUpdatesProps) => {
  useEffect(() => {
    if (!enabled) return;

    console.log('Setting up realtime subscriptions...');

    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          if (onNewOrder) {
            onNewOrder(payload.new as Order);
          }
        }
      )
      .subscribe();

    // Subscribe to table status changes
    const tablesChannel = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tables'
        },
        (payload) => {
          console.log('Table updated:', payload);
          const oldTable = payload.old as Table;
          const newTable = payload.new as Table;
          
          if (oldTable.status !== newTable.status && onTableStatusChange) {
            onTableStatusChange(newTable, oldTable.status);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tablesChannel);
    };
  }, [enabled, onNewOrder, onTableStatusChange]);
};
