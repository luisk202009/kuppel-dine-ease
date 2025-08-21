export type TableStatus = 'available' | 'occupied' | 'pending' | 'reserved';

export interface Table {
  id: string;
  name: string;
  area: string;
  capacity: number;
  status: TableStatus;
  currentOrder?: string;
  customers?: number;
  waiter?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  available: boolean;
  isAlcoholic?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  lastName: string;
  identification: string;
  phone: string;
  city: string;
  email: string;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
  waiterId?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'cashier';
  email: string;
  isActive: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'transfer';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number;
  change?: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Date;
}

export interface Area {
  id: string;
  name: string;
  tables: Table[];
  color?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  products: Product[];
}

export interface POSSettings {
  taxRate: number;
  currency: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  receiptFooter: string;
  enableTips: boolean;
  defaultTipPercentage: number;
}

// App State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface POSState {
  currentOrder: Order | null;
  selectedTable: Table | null;
  cart: OrderItem[];
  areas: Area[];
  categories: ProductCategory[];
  customers: Customer[];
  settings: POSSettings;
}