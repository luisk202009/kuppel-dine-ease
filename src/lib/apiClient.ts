const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.kuppel.co';
import { secureStorage } from '@/lib/secureStorage';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private secureStorage = secureStorage;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Initialize token from secure storage on construction
    this.loadToken();
  }

  private loadToken() {
    const token = this.secureStorage.getToken();
    if (token) {
      this.token = token;
      return;
    }
    
    // Fallback to localStorage for backwards compatibility
    this.token = localStorage.getItem('kuppel_token');
  }

  setToken(token: string) {
    this.token = token;
    this.secureStorage.setToken(token);
    // Also store in localStorage as fallback
    localStorage.setItem('kuppel_token', token);
  }

  clearToken() {
    this.token = null;
    this.secureStorage.clearToken();
    localStorage.removeItem('kuppel_token');
  }
  
  // Initialize token from secure storage
  initializeToken() {
    this.loadToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearToken();
        window.location.reload();
        throw new ApiClientError(401, 'Token expired or invalid');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiClientError(
          response.status,
          errorData.message || response.statusText,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(0, 'Network error or server unavailable');
    }
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Products endpoints
  async getProducts(category?: string) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/products${params}`);
  }

  async searchProducts(query: string, category?: string) {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    return this.request(`/products/search?${params}`);
  }

  // Invoices endpoints
  async createInvoice(invoiceData: any) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async getInvoice(id: string) {
    return this.request(`/invoices/${id}`);
  }

  async getInvoices() {
    return this.request('/invoices');
  }

  // Customers endpoints
  async getCustomers() {
    return this.request('/customers');
  }

  async createCustomer(customerData: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  // Expenses endpoints
  async createExpense(expenseData: any) {
    // Handle both regular data and FormData for file uploads
    const isFormData = expenseData instanceof FormData;
    
    return this.request('/expenses', {
      method: 'POST',
      body: isFormData ? expenseData : JSON.stringify(expenseData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  }

  async getExpenses(date?: string) {
    const params = date ? `?date=${date}` : '';
    return this.request(`/expenses${params}`);
  }

  // Cash endpoints
  async openCash(data: any) {
    return this.request('/cash/open', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async closeCash(data: any) {
    return this.request('/cash/close', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Stats endpoints
  async getCurrentCashSession() {
    return this.request('/cash/current');
  }

  async getDailyStats(date?: string) {
    const params = date ? `?date=${date}` : '';
    return this.request(`/stats/daily${params}`);
  }
}

export const apiClient = new ApiClient();
export { ApiClient };