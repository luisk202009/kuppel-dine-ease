import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockApi } from '@/lib/mockApi';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('MockApi', () => {
  let mockApi: MockApi;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockApi = new MockApi();
  });

  describe('Products', () => {
    it('should return all products when no category specified', async () => {
      // Mock localStorage to return products
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_products') {
          return JSON.stringify([
            { id: 'prod-1', name: 'Product 1', category: 'cat-1', price: 1000, available: true },
            { id: 'prod-2', name: 'Product 2', category: 'cat-2', price: 2000, available: true }
          ]);
        }
        return null;
      });

      const result = await mockApi.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: 'prod-1',
          name: 'Product 1',
          category: 'cat-1'
        })
      );
    });

    it('should filter products by category', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_products') {
          return JSON.stringify([
            { id: 'prod-1', name: 'Product 1', category: 'cat-1', price: 1000, available: true },
            { id: 'prod-2', name: 'Product 2', category: 'cat-2', price: 2000, available: true }
          ]);
        }
        return null;
      });

      const result = await mockApi.getProducts('cat-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].category).toBe('cat-1');
    });

    it('should search products by name', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_products') {
          return JSON.stringify([
            { id: 'prod-1', name: 'Café Americano', category: 'bebidas', price: 1000, available: true },
            { id: 'prod-2', name: 'Pizza Margherita', category: 'comida', price: 2000, available: true }
          ]);
        }
        return null;
      });

      const result = await mockApi.searchProducts('café');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Café Americano');
    });
  });

  describe('Invoices', () => {
    it('should create invoice and return success', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_invoices') {
          return JSON.stringify([]);
        }
        return null;
      });

      const invoiceData = {
        tableId: 'table-1',
        branchId: 'branch-1',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 1000, notes: '' }
        ],
        subtotal: 2000,
        taxes: 380,
        discount: 0,
        total: 2380,
        paymentMethod: 'cash' as const,
        receivedAmount: 3000
      };

      const result = await mockApi.createInvoice(invoiceData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^INV-/),
          total: 2380,
          status: 'paid',
          createdAt: expect.any(String)
        })
      );

      // Verify localStorage was called to save
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kuppel_mock_invoices',
        expect.any(String)
      );
    });

    it('should get invoices from storage', async () => {
      const mockInvoices = [
        { id: 'INV-001', total: 1000, createdAt: '2024-01-01T00:00:00Z' },
        { id: 'INV-002', total: 2000, createdAt: '2024-01-02T00:00:00Z' }
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_invoices') {
          return JSON.stringify(mockInvoices);
        }
        return null;
      });

      const result = await mockApi.getInvoices();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      // Should be reversed (most recent first)
      expect(result.data[0].id).toBe('INV-002');
    });
  });

  describe('Cash Management', () => {
    it('should open cash session', async () => {
      const cashData = {
        branchId: 'branch-1',
        initialAmount: 100000,
        notes: 'Opening cash'
      };

      const result = await mockApi.openCash(cashData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/^CASH-/),
          branchId: 'branch-1',
          initialAmount: 100000,
          status: 'open',
          openedBy: 'mock-user'
        })
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kuppel_mock_cash_session',
        expect.any(String)
      );
    });

    it('should close cash session', async () => {
      // Mock current session in localStorage
      const currentSession = {
        id: 'CASH-123',
        branchId: 'branch-1',
        initialAmount: 100000,
        totalSales: 50000,
        totalExpenses: 5000,
        status: 'open',
        notes: 'Test session'
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_cash_session') {
          return JSON.stringify(currentSession);
        }
        if (key === 'kuppel_mock_cash_sessions') {
          return JSON.stringify([]);
        }
        return null;
      });

      const cashData = {
        sessionId: 'CASH-123',
        finalAmount: 145000,
        notes: 'Closing notes'
      };

      const result = await mockApi.closeCash(cashData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: 'CASH-123',
          finalAmount: 145000,
          status: 'closed',
          closedBy: 'mock-user'
        })
      );

      // Should save to history and remove current session
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kuppel_mock_cash_sessions',
        expect.any(String)
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kuppel_mock_cash_session');
    });

    it('should get current cash session', async () => {
      const currentSession = {
        id: 'CASH-123',
        status: 'open',
        initialAmount: 100000
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_cash_session') {
          return JSON.stringify(currentSession);
        }
        return null;
      });

      const result = await mockApi.getCurrentCashSession();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(currentSession);
    });

    it('should return null when no current session', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await mockApi.getCurrentCashSession();

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('Daily Stats', () => {
    it('should calculate daily stats correctly', async () => {
      const today = new Date().toISOString();
      const mockInvoices = [
        { id: 'INV-001', total: 1000, createdAt: today },
        { id: 'INV-002', total: 2000, createdAt: today }
      ];
      const mockExpenses = [
        { id: 'EXP-001', amount: 500, createdAt: today }
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'kuppel_mock_invoices') {
          return JSON.stringify(mockInvoices);
        }
        if (key === 'kuppel_mock_expenses') {
          return JSON.stringify(mockExpenses);
        }
        return null;
      });

      const result = await mockApi.getDailyStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalSales: 3000,
        totalExpenses: 500,
        netIncome: 2500,
        transactionCount: 2,
        averageTicket: 1500
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await mockApi.getProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});