// Offline storage using IndexedDB for POS data
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface POSOfflineDB extends DBSchema {
  orders: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
  };
  products: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  customers: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  tables: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  pendingSync: {
    key: string;
    value: {
      id: string;
      type: 'order' | 'customer' | 'expense' | 'table_status';
      data: any;
      timestamp: number;
      retries: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<POSOfflineDB>> | null = null;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<POSOfflineDB>('kuppel-pos-offline', 1, {
      upgrade(db) {
        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
        
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        
        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        
        // Tables store
        if (!db.objectStoreNames.contains('tables')) {
          db.createObjectStore('tables', { keyPath: 'id' });
        }
        
        // Pending sync queue
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Save pending order offline
export const saveOfflineOrder = async (orderId: string, orderData: any) => {
  const db = await getDB();
  await db.put('orders', {
    id: orderId,
    data: orderData,
    timestamp: Date.now(),
    synced: false,
  });
  console.log('💾 Order saved offline:', orderId);
};

// Get offline orders
export const getOfflineOrders = async () => {
  const db = await getDB();
  return await db.getAll('orders');
};

// Cache products for offline use
export const cacheProducts = async (products: any[]) => {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  await Promise.all([
    ...products.map(product =>
      tx.store.put({
        id: product.id,
        data: product,
        timestamp: Date.now(),
      })
    ),
    tx.done,
  ]);
  console.log(`💾 Cached ${products.length} products offline`);
};

// Get cached products
export const getCachedProducts = async () => {
  const db = await getDB();
  const items = await db.getAll('products');
  return items.map(item => item.data);
};

// Cache customers
export const cacheCustomers = async (customers: any[]) => {
  const db = await getDB();
  const tx = db.transaction('customers', 'readwrite');
  await Promise.all([
    ...customers.map(customer =>
      tx.store.put({
        id: customer.id,
        data: customer,
        timestamp: Date.now(),
      })
    ),
    tx.done,
  ]);
  console.log(`💾 Cached ${customers.length} customers offline`);
};

// Get cached customers
export const getCachedCustomers = async () => {
  const db = await getDB();
  const items = await db.getAll('customers');
  return items.map(item => item.data);
};

// Cache tables
export const cacheTables = async (tables: any[]) => {
  const db = await getDB();
  const tx = db.transaction('tables', 'readwrite');
  await Promise.all([
    ...tables.map(table =>
      tx.store.put({
        id: table.id,
        data: table,
        timestamp: Date.now(),
      })
    ),
    tx.done,
  ]);
  console.log(`💾 Cached ${tables.length} tables offline`);
};

// Get cached tables
export const getCachedTables = async () => {
  const db = await getDB();
  const items = await db.getAll('tables');
  return items.map(item => item.data);
};

// Add item to sync queue
export const addToSyncQueue = async (
  type: 'order' | 'customer' | 'expense' | 'table_status',
  data: any
) => {
  const db = await getDB();
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.put('pendingSync', {
    id,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  });
  console.log('📋 Added to sync queue:', type, id);
  return id;
};

// Get pending sync items
export const getPendingSyncItems = async () => {
  const db = await getDB();
  return await db.getAll('pendingSync');
};

// Remove from sync queue
export const removeFromSyncQueue = async (id: string) => {
  const db = await getDB();
  await db.delete('pendingSync', id);
  console.log('✅ Removed from sync queue:', id);
};

// Update sync retry count
export const updateSyncRetry = async (id: string) => {
  const db = await getDB();
  const item = await db.get('pendingSync', id);
  if (item) {
    item.retries += 1;
    await db.put('pendingSync', item);
  }
};

// Clear all offline data (use carefully)
export const clearOfflineData = async () => {
  const db = await getDB();
  await Promise.all([
    db.clear('orders'),
    db.clear('products'),
    db.clear('customers'),
    db.clear('tables'),
    db.clear('pendingSync'),
  ]);
  console.log('🗑️ Cleared all offline data');
};

// Get storage stats
export const getStorageStats = async () => {
  const db = await getDB();
  const [orders, products, customers, tables, pending] = await Promise.all([
    db.count('orders'),
    db.count('products'),
    db.count('customers'),
    db.count('tables'),
    db.count('pendingSync'),
  ]);
  
  return {
    orders,
    products,
    customers,
    tables,
    pendingSync: pending,
  };
};
