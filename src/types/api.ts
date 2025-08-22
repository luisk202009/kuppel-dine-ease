// Authentication types
export interface AuthRequest {
  username: string;
  password: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  companyId: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'waiter' | 'cashier';
    isActive: boolean;
  };
  companies: Company[];
  branches: Branch[];
}

// Product types
export interface ApiProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  available: boolean;
  isAlcoholic?: boolean;
  tax_rate?: number;
}

export interface ProductsResponse {
  success: boolean;
  data: ApiProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Invoice types
export interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface InvoiceRequest {
  customerId?: string;
  tableId?: string;
  branchId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'transfer';
  receivedAmount?: number;
  notes?: string;
}

export interface InvoiceResponse {
  success: boolean;
  data: {
    id: string;
    number: string;
    customerId?: string;
    tableId?: string;
    branchId: string;
    items: Array<{
      id: string;
      productId: string;
      product: ApiProduct;
      quantity: number;
      unitPrice: number;
      total: number;
      notes?: string;
    }>;
    subtotal: number;
    taxes: number;
    discount: number;
    total: number;
    paymentMethod: string;
    receivedAmount?: number;
    change?: number;
    status: 'pending' | 'paid' | 'cancelled';
    createdAt: string;
    updatedAt: string;
  };
}

// Customer types
export interface ApiCustomer {
  id: string;
  name: string;
  lastName: string;
  identification: string;
  phone: string;
  city: string;
  email: string;
  createdAt: string;
}

export interface CustomersResponse {
  success: boolean;
  data: ApiCustomer[];
}

export interface CustomerRequest {
  name: string;
  lastName: string;
  identification: string;
  phone: string;
  city: string;
  email: string;
}

// Expense types
export interface ExpenseRequest {
  category: string;
  amount: number;
  description: string;
  branchId: string;
  attachments?: File[];
}

export interface ApiExpense {
  id: string;
  category: string;
  amount: number;
  description: string;
  branchId: string;
  attachments: string[];
  createdAt: string;
  createdBy: string;
}

export interface ExpensesResponse {
  success: boolean;
  data: ApiExpense[];
}

// Cash session types
export interface CashOpenRequest {
  branchId: string;
  initialAmount: number;
  notes?: string;
}

export interface CashCloseRequest {
  sessionId: string;
  finalAmount: number;
  notes?: string;
}

export interface CashSession {
  id: string;
  branchId: string;
  initialAmount: number;
  finalAmount?: number;
  totalSales: number;
  totalExpenses: number;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  status: 'open' | 'closed';
}

export interface CashResponse {
  success: boolean;
  data: CashSession;
}

// Stats types
export interface DailyStats {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalCustomers: number;
  averageTicket: number;
  paymentMethods: {
    cash: number;
    card: number;
    credit: number;
    transfer: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  hourlySales: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
}

export interface StatsResponse {
  success: boolean;
  data: DailyStats;
}

// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}