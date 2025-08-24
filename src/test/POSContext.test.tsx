import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { POSProvider, usePOS } from '@/contexts/POSContext';
import { Company, Branch } from '@/types/api';

// Mock the auth hooks
vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      success: true,
      user: { id: '1', name: 'Test User', role: 'admin' },
      companies: [{ id: 'comp-1', name: 'Test Company' }],
      branches: [{ id: 'branch-1', name: 'Main Branch' }]
    }),
  }),
  useLogout: () => vi.fn(),
  getStoredAuth: () => ({
    user: null,
    companies: [],
    branches: [],
    selectedCompany: null,
    selectedBranch: null
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Test component to access context
const TestComponent = () => {
  const { 
    posState, 
    authState, 
    login, 
    selectCompanyAndBranch,
    addToCart,
    searchProducts 
  } = usePOS();

  return (
    <div>
      <div data-testid="auth-status">
        {authState.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="needs-selection">
        {authState.needsCompanySelection ? 'needs-selection' : 'no-selection'}
      </div>
      <div data-testid="cart-count">{posState.cart.length}</div>
      <div data-testid="areas-count">{posState.areas.length}</div>
      <div data-testid="categories-count">{posState.categories.length}</div>
      
      <button 
        onClick={() => login('test', 'password')}
        data-testid="login-btn"
      >
        Login
      </button>
      
      <button 
        onClick={() => {
          const company: Company = { id: 'comp-1', name: 'Test Company', address: '', phone: '' };
          const branch: Branch = { id: 'branch-1', name: 'Main Branch', address: '', companyId: 'comp-1' };
          selectCompanyAndBranch(company, branch);
        }}
        data-testid="select-company-btn"
      >
        Select Company
      </button>
      
      <button 
        onClick={() => {
          const product = posState.categories[0]?.products[0];
          if (product) addToCart(product, 2);
        }}
        data-testid="add-to-cart-btn"
      >
        Add to Cart
      </button>
      
      <button 
        onClick={() => {
          const results = searchProducts('café');
          console.log('Search results:', results);
        }}
        data-testid="search-btn"
      >
        Search Products
      </button>
    </div>
  );
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('POSContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('should initialize with demo data', () => {
    render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('areas-count')).toHaveTextContent('4');
    expect(screen.getByTestId('categories-count')).toHaveTextContent('5');
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('should handle login flow', async () => {
    render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('needs-selection')).toHaveTextContent('no-selection');
    });
  });

  it('should handle company and branch selection', async () => {
    render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const selectBtn = screen.getByTestId('select-company-btn');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Check localStorage was updated
    expect(localStorage.getItem('kuppel_selected_company')).toBeTruthy();
    expect(localStorage.getItem('kuppel_selected_branch')).toBeTruthy();
  });

  it('should add products to cart', () => {
    render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const addBtn = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(addBtn);

    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
  });

  it('should search products correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const searchBtn = screen.getByTestId('search-btn');
    fireEvent.click(searchBtn);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Search results:',
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.stringContaining('Café')
        })
      ])
    );

    consoleSpy.mockRestore();
  });

  it('should restore auth state from localStorage', () => {
    // Setup localStorage with auth data
    const mockUser = { id: '1', name: 'Test User', role: 'admin' };
    const mockCompany = { id: 'comp-1', name: 'Test Company' };
    const mockBranch = { id: 'branch-1', name: 'Main Branch' };

    localStorage.setItem('kuppel_secure_user', JSON.stringify(mockUser));
    localStorage.setItem('kuppel_selected_company', JSON.stringify(mockCompany));
    localStorage.setItem('kuppel_selected_branch', JSON.stringify(mockBranch));

    // Mock getStoredAuth to return the stored data
    vi.mocked(require('@/hooks/useAuth').getStoredAuth).mockReturnValue({
      user: mockUser,
      companies: [mockCompany],
      branches: [mockBranch],
      selectedCompany: mockCompany,
      selectedBranch: mockBranch
    });

    render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
  });

  it('should handle needsCompanySelection state', () => {
    // Mock login with multiple companies/branches
    vi.mocked(require('@/hooks/useAuth').useLogin).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Test User', role: 'admin' },
        companies: [
          { id: 'comp-1', name: 'Company 1' },
          { id: 'comp-2', name: 'Company 2' }
        ],
        branches: [
          { id: 'branch-1', name: 'Branch 1' },
          { id: 'branch-2', name: 'Branch 2' }
        ]
      }),
    });

    render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const loginBtn = screen.getByTestId('login-btn');
    fireEvent.click(loginBtn);

    waitFor(() => {
      expect(screen.getByTestId('needs-selection')).toHaveTextContent('needs-selection');
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });
});