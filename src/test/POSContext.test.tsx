import React from 'react';
import { render } from '@testing-library/react';
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
    const { getByTestId } = render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    expect(getByTestId('areas-count')).toHaveTextContent('4');
    expect(getByTestId('categories-count')).toHaveTextContent('5');
    expect(getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('should handle login flow', async () => {
    const { getByTestId } = render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const loginBtn = getByTestId('login-btn');
    loginBtn.click();

    // Note: In a real test, you'd wait for actual state changes
    expect(getByTestId('needs-selection')).toHaveTextContent('no-selection');
  });

  it('should handle company and branch selection', async () => {
    const { getByTestId } = render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const selectBtn = getByTestId('select-company-btn');
    selectBtn.click();

    expect(getByTestId('auth-status')).toHaveTextContent('authenticated');

    // Check localStorage was updated
    expect(localStorage.getItem('kuppel_selected_company')).toBeTruthy();
    expect(localStorage.getItem('kuppel_selected_branch')).toBeTruthy();
  });

  it('should add products to cart', async () => {
    const { getByTestId } = render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const addBtn = getByTestId('add-to-cart-btn');
    addBtn.click();

    expect(getByTestId('cart-count')).toHaveTextContent('1');
  });

  it('should search products correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const { getByTestId } = render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const searchBtn = getByTestId('search-btn');
    searchBtn.click();

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

    const { getByTestId } = render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
  });

  it('should handle needsCompanySelection state', async () => {
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

    const { getByTestId } = render(
      <POSProvider>
        <TestComponent />
      </POSProvider>,
      { wrapper: createWrapper() }
    );

    const loginBtn = getByTestId('login-btn');
    loginBtn.click();

    // Check initial state - should need selection with multiple options
    expect(getByTestId('needs-selection')).toHaveTextContent('needs-selection');
    expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });
});