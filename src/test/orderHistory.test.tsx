import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderHistory } from '@/components/pos/OrderHistory';
import { useInvoices } from '@/hooks/useInvoices';
import { Order } from '@/types/pos';

// Mock the hooks
vi.mock('@/hooks/useInvoices');
vi.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: () => '2024-01-15 10:30 AM',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

const mockOrders: Order[] = [
  {
    id: 'order-1',
    tableId: 'mesa-1',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        product: {
          id: 'prod-1',
          name: 'Café Americano',
          category: 'Bebidas',
          price: 4500,
          available: true,
        },
        quantity: 2,
        unitPrice: 4500,
        total: 9000,
      },
    ],
    subtotal: 9000,
    taxes: 1710,
    discount: 0,
    total: 10710,
    status: 'paid',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    paymentMethod: 'cash',
  },
  {
    id: 'order-2',
    tableId: 'mesa-2',
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        product: {
          id: 'prod-2',
          name: 'Pasta en Salsa de Queso',
          category: 'Comida',
          price: 28000,
          available: true,
        },
        quantity: 1,
        unitPrice: 28000,
        total: 28000,
      },
    ],
    subtotal: 28000,
    taxes: 5320,
    discount: 0,
    total: 33320,
    status: 'preparing',
    createdAt: new Date('2024-01-15T11:00:00'),
    updatedAt: new Date('2024-01-15T11:00:00'),
  },
];

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

describe('OrderHistory Component', () => {
  const mockUseInvoices = useInvoices as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInvoices.mockReturnValue({
      data: mockOrders,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  it('should render order history component', async () => {
    const { container } = render(<OrderHistory />, { wrapper: createWrapper() });
    expect(container).toBeInTheDocument();
  });

  it('should display loading state', () => {
    mockUseInvoices.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { getByText } = render(<OrderHistory />, { wrapper: createWrapper() });
    expect(getByText('Cargando historial...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    mockUseInvoices.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    const { getByText } = render(<OrderHistory />, { wrapper: createWrapper() });
    expect(getByText('Error al cargar el historial de órdenes')).toBeInTheDocument();
  });

  it('should display no orders message when no orders available', () => {
    mockUseInvoices.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { getByText } = render(<OrderHistory />, { wrapper: createWrapper() });
    expect(getByText('No se encontraron órdenes')).toBeInTheDocument();
  });
});