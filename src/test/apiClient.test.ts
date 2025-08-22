import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '@/lib/apiClient';

// Mock fetch
global.fetch = vi.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:3000/api');
    vi.clearAllMocks();
  });

  describe('createExpense', () => {
    it('should handle regular JSON expense data', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const expenseData = {
        category: 'Office',
        description: 'Office supplies',
        amount: 100,
        branchId: 'branch-1'
      };

      await apiClient.createExpense(expenseData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/expenses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(expenseData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle FormData with file attachments', async () => {
      const mockResponse = { success: true, data: { id: '1' } };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const formData = new FormData();
      formData.append('category', 'Office');
      formData.append('description', 'Office supplies');
      formData.append('amount', '100');
      formData.append('attachments', new File(['test'], 'receipt.pdf'));

      await apiClient.createExpense(formData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/expenses',
        expect.objectContaining({
          method: 'POST',
          body: formData,
          headers: {} // No Content-Type header for FormData
        })
      );
    });
  });

  describe('getCurrentCashSession', () => {
    it('should fetch current cash session', async () => {
      const mockResponse = { 
        success: true, 
        data: { 
          id: 'session-1', 
          status: 'open',
          initialAmount: 100000 
        } 
      };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.getCurrentCashSession();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/cash/current',
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});