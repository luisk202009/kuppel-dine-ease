// Offline sync service to push pending data when online
import { supabase } from '@/integrations/supabase/client';
import { 
  getPendingSyncItems, 
  removeFromSyncQueue, 
  updateSyncRetry 
} from './offlineStorage';

const MAX_RETRIES = 3;

export const syncPendingData = async () => {
  console.log('🔄 Starting sync of pending data...');
  
  const pendingItems = await getPendingSyncItems();
  
  if (pendingItems.length === 0) {
    console.log('✅ No pending data to sync');
    return { success: true, synced: 0, failed: 0 };
  }
  
  let synced = 0;
  let failed = 0;
  
  for (const item of pendingItems) {
    try {
      // Skip if max retries exceeded
      if (item.retries >= MAX_RETRIES) {
        console.warn(`⚠️ Max retries exceeded for ${item.type}:`, item.id);
        failed++;
        continue;
      }
      
      let success = false;
      
      switch (item.type) {
        case 'order':
          success = await syncOrder(item.data);
          break;
        case 'customer':
          success = await syncCustomer(item.data);
          break;
        case 'expense':
          success = await syncExpense(item.data);
          break;
        case 'table_status':
          success = await syncTableStatus(item.data);
          break;
      }
      
      if (success) {
        await removeFromSyncQueue(item.id);
        synced++;
        console.log(`✅ Synced ${item.type}:`, item.id);
      } else {
        await updateSyncRetry(item.id);
        failed++;
        console.warn(`❌ Failed to sync ${item.type}:`, item.id);
      }
    } catch (error) {
      console.error(`Error syncing ${item.type}:`, error);
      await updateSyncRetry(item.id);
      failed++;
    }
  }
  
  console.log(`🔄 Sync complete: ${synced} synced, ${failed} failed`);
  
  return { success: true, synced, failed };
};

const syncOrder = async (orderData: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .insert(orderData);
    
    return !error;
  } catch (error) {
    console.error('Error syncing order:', error);
    return false;
  }
};

const syncCustomer = async (customerData: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('customers')
      .insert(customerData);
    
    return !error;
  } catch (error) {
    console.error('Error syncing customer:', error);
    return false;
  }
};

const syncExpense = async (expenseData: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('expenses')
      .insert(expenseData);
    
    return !error;
  } catch (error) {
    console.error('Error syncing expense:', error);
    return false;
  }
};

const syncTableStatus = async (tableData: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tables')
      .update({ status: tableData.status })
      .eq('id', tableData.id);
    
    return !error;
  } catch (error) {
    console.error('Error syncing table status:', error);
    return false;
  }
};

// Setup auto-sync on online event
export const setupAutoSync = () => {
  window.addEventListener('online-sync-trigger', async () => {
    console.log('🔄 Auto-sync triggered by online event');
    await syncPendingData();
  });
};
