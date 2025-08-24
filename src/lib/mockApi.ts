// Mock API for development and fallback scenarios
import { InvoiceRequest, InvoiceResponse, CashSession } from '@/types/api';
import { Product } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
}

// Local storage keys for persistence
const STORAGE_KEYS = {
  products: 'kuppel_mock_products',
  invoices: 'kuppel_mock_invoices',
  expenses: 'kuppel_mock_expenses',
  cashSession: 'kuppel_mock_cash_session',
  cashSessions: 'kuppel_mock_cash_sessions',
  customers: 'kuppel_mock_customers'
};

// Initialize mock data
const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.products)) {
    const mockProducts: Product[] = [
      { id: 'cafe-americano', name: 'Café Americano', category: 'bebidas-calientes', price: 4500, available: true },
      { id: 'capuchino', name: 'Capuchino', category: 'bebidas-calientes', price: 6000, available: true },
      { id: 'chocolate-caliente', name: 'Chocolate Caliente', category: 'bebidas-calientes', price: 5500, available: true },
      { id: 'limonada', name: 'Limonada Natural', category: 'bebidas-frias', price: 7000, available: true },
      { id: 'jugo-naranja', name: 'Jugo de Naranja', category: 'bebidas-frias', price: 8000, available: true },
      { id: 'agua-mineral', name: 'Agua Mineral', category: 'bebidas-frias', price: 3000, available: true },
      { id: 'vino-tinto-sparta', name: 'Vino Tinto Sparta', category: 'bebidas-alcoholicas', price: 45000, available: true, isAlcoholic: true },
      { id: 'vino-blanco-montana', name: 'Vino Blanco Montana', category: 'bebidas-alcoholicas', price: 42000, available: true, isAlcoholic: true },
      { id: 'cerveza-club-colombia', name: 'Cerveza Club Colombia', category: 'bebidas-alcoholicas', price: 8000, available: true, isAlcoholic: true },
      { id: 'pasta-queso', name: 'Pasta en Salsa de Queso', category: 'comida', price: 28000, available: true },
      { id: 'platillo-mar', name: 'Platillo del Mar', category: 'comida', price: 35000, available: true },
      { id: 'cerdo-vegetales', name: 'Cerdo con Vegetales', category: 'comida', price: 32000, available: true },
      { id: 'res-papas', name: 'Res con Papas', category: 'comida', price: 30000, available: true },
      { id: 'langostinos', name: 'Langostinos a la Plancha', category: 'comida', price: 38000, available: true },
      { id: 'galletas-oreo', name: 'Galletas Oreo', category: 'snacks', price: 5000, available: true },
      { id: 'churritos', name: 'Churritos', category: 'snacks', price: 4000, available: true },
      { id: 'papas-fritas', name: 'Papas Fritas', category: 'snacks', price: 8000, available: true }
    ];
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(mockProducts));
  }

  if (!localStorage.getItem(STORAGE_KEYS.invoices)) {
    localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.expenses)) {
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.cashSessions)) {
    localStorage.setItem(STORAGE_KEYS.cashSessions, JSON.stringify([]));
  }
};

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const storeData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock API implementation
export class MockApi {
  constructor() {
    initializeMockData();
  }

  // Products
  async getProducts(category?: string): Promise<{ success: boolean; data: Product[] }> {
    await delay(300); // Simulate network delay
    
    const products = getStoredData<Product>(STORAGE_KEYS.products);
    const filteredProducts = category 
      ? products.filter(p => p.category === category)
      : products;
    
    return { success: true, data: filteredProducts };
  }

  async searchProducts(query: string, category?: string): Promise<{ success: boolean; data: Product[] }> {
    await delay(200);
    
    const products = getStoredData<Product>(STORAGE_KEYS.products);
    let filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    return { success: true, data: filteredProducts };
  }

  // Invoices
  async createInvoice(invoiceData: InvoiceRequest): Promise<InvoiceResponse> {
    await delay(500);
    
    const invoices = getStoredData<any>(STORAGE_KEYS.invoices);
    const newInvoice = {
      id: `INV-${Date.now()}`,
      number: `${invoices.length + 1}`.padStart(6, '0'),
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'paid'
    };

    invoices.push(newInvoice);
    storeData(STORAGE_KEYS.invoices, invoices);

    // Update cash session with sale
    const currentSession = this.getCurrentCashSessionSync();
    if (currentSession) {
      currentSession.totalSales = (currentSession.totalSales || 0) + invoiceData.total;
      localStorage.setItem(STORAGE_KEYS.cashSession, JSON.stringify(currentSession));
    }

    return { success: true, data: newInvoice };
  }

  async getInvoice(invoiceId: string): Promise<InvoiceResponse> {
    await delay(200);
    
    const invoices = getStoredData<any>(STORAGE_KEYS.invoices);
    const invoice = invoices.find((inv: any) => inv.id === invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return { success: true, data: invoice };
  }

  async getInvoices(): Promise<{ success: boolean; data: any[] }> {
    await delay(300);
    
    const invoices = getStoredData<any>(STORAGE_KEYS.invoices);
    return { success: true, data: invoices.reverse() }; // Most recent first
  }

  // Expenses
  async createExpense(expenseData: any): Promise<{ success: boolean; data: Expense }> {
    await delay(400);
    
    const expenses = getStoredData<Expense>(STORAGE_KEYS.expenses);
    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      ...expenseData,
      createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    storeData(STORAGE_KEYS.expenses, expenses);

    // Update cash session with expense
    const currentSession = this.getCurrentCashSessionSync();
    if (currentSession) {
      currentSession.totalExpenses = (currentSession.totalExpenses || 0) + expenseData.amount;
      localStorage.setItem(STORAGE_KEYS.cashSession, JSON.stringify(currentSession));
    }

    return { success: true, data: newExpense };
  }

  async getExpenses(): Promise<{ success: boolean; data: Expense[] }> {
    await delay(250);
    
    const expenses = getStoredData<Expense>(STORAGE_KEYS.expenses);
    return { success: true, data: expenses.reverse() }; // Most recent first
  }

  // Cash management
  async getCurrentCashSession(): Promise<{ success: boolean; data: CashSession | null }> {
    await delay(200);
    
    const session = this.getCurrentCashSessionSync();
    return { success: true, data: session };
  }

  private getCurrentCashSessionSync(): CashSession | null {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.cashSession);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  async openCash(cashData: { branchId: string; initialAmount: number; notes?: string }): Promise<{ success: boolean; data: CashSession }> {
    await delay(300);
    
    const newSession: CashSession = {
      id: `CASH-${Date.now()}`,
      branchId: cashData.branchId,
      openedBy: 'mock-user',
      openedAt: new Date().toISOString(),
      initialAmount: cashData.initialAmount,
      totalSales: 0,
      totalExpenses: 0,
      status: 'open'
    };

    localStorage.setItem(STORAGE_KEYS.cashSession, JSON.stringify(newSession));
    
    return { success: true, data: newSession };
  }

  async closeCash(cashData: { sessionId: string; finalAmount: number; notes?: string }): Promise<{ success: boolean; data: CashSession }> {
    await delay(400);
    
    const currentSession = this.getCurrentCashSessionSync();
    if (!currentSession) {
      throw new Error('No active cash session found');
    }

    const closedSession: CashSession = {
      ...currentSession,
      closedAt: new Date().toISOString(),
      closedBy: 'mock-user',
      finalAmount: cashData.finalAmount,
      status: 'closed'
    };

    // Save to history
    const sessions = getStoredData<CashSession>(STORAGE_KEYS.cashSessions);
    sessions.push(closedSession);
    storeData(STORAGE_KEYS.cashSessions, sessions);

    // Clear current session
    localStorage.removeItem(STORAGE_KEYS.cashSession);

    return { success: true, data: closedSession };
  }

  async getDailyStats(): Promise<{ success: boolean; data: any }> {
    await delay(250);
    
    const invoices = getStoredData<any>(STORAGE_KEYS.invoices);
    const expenses = getStoredData<Expense>(STORAGE_KEYS.expenses);
    
    const today = new Date().toDateString();
    const todayInvoices = invoices.filter((inv: any) => 
      new Date(inv.createdAt).toDateString() === today
    );
    const todayExpenses = expenses.filter(exp => 
      new Date(exp.createdAt).toDateString() === today
    );

    const totalSales = todayInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
    const totalExpenses = todayExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

    return {
      success: true,
      data: {
        totalSales,
        totalExpenses,
        netIncome: totalSales - totalExpenses,
        transactionCount: todayInvoices.length,
        averageTicket: todayInvoices.length > 0 ? totalSales / todayInvoices.length : 0
      }
    };
  }

  // Customers
  async getCustomers(): Promise<{ success: boolean; data: any[] }> {
    await delay(200);
    
    const customers = getStoredData<any>(STORAGE_KEYS.customers);
    return { success: true, data: customers };
  }

  async createCustomer(customerData: any): Promise<{ success: boolean; data: any }> {
    await delay(300);
    
    const customers = getStoredData<any>(STORAGE_KEYS.customers);
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      ...customerData,
      createdAt: new Date().toISOString()
    };

    customers.push(newCustomer);
    storeData(STORAGE_KEYS.customers, customers);

    return { success: true, data: newCustomer };
  }
}

// Export singleton instance
export const mockApi = new MockApi();