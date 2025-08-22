import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { POSState, AuthState, User, Table, OrderItem, Product, Area, ProductCategory, Customer, POSSettings } from '@/types/pos';
import { Company, Branch } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useLogin, useLogout, getStoredAuth } from '@/hooks/useAuth';

interface POSContextType {
  posState: POSState;
  authState: AuthState & {
    companies: Company[];
    branches: Branch[];
    selectedCompany: Company | null;
    selectedBranch: Branch | null;
    needsCompanySelection: boolean;
  };
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectCompanyAndBranch: (company: Company, branch: Branch) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  selectTable: (table: Table) => void;
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  searchProducts: (query: string) => Product[];
  searchCustomers: (query: string) => Customer[];
}

const POSContext = createContext<POSContextType | undefined>(undefined);

type POSAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SELECT_TABLE'; payload: Table }
  | { type: 'UPDATE_TABLE_STATUS'; payload: { tableId: string; status: Table['status'] } }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'INITIALIZE_DATA'; payload: { areas: Area[]; categories: ProductCategory[]; customers: Customer[] } };

const initialPOSState: POSState = {
  currentOrder: null,
  selectedTable: null,
  cart: [],
  areas: [],
  categories: [],
  customers: [],
  settings: {
    taxRate: 0.19,
    currency: 'COP',
    businessName: 'Kuppel Restaurant',
    businessAddress: 'Calle Principal #123',
    businessPhone: '+57 300 123 4567',
    receiptFooter: 'Gracias por su visita',
    enableTips: true,
    defaultTipPercentage: 10
  }
};

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false
};

function posReducer(state: POSState & AuthState, action: POSAction): POSState & AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.productId === action.payload.product.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.productId === action.payload.product.id
              ? {
                  ...item,
                  quantity: item.quantity + action.payload.quantity,
                  total: (item.quantity + action.payload.quantity) * item.unitPrice
                }
              : item
          )
        };
      } else {
        const newItem: OrderItem = {
          id: `item-${Date.now()}-${Math.random()}`,
          productId: action.payload.product.id,
          product: action.payload.product,
          quantity: action.payload.quantity,
          unitPrice: action.payload.product.price,
          total: action.payload.product.price * action.payload.quantity
        };
        return {
          ...state,
          cart: [...state.cart, newItem]
        };
      }
      
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };
      
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                quantity: action.payload.quantity,
                total: action.payload.quantity * item.unitPrice
              }
            : item
        )
      };
      
    case 'CLEAR_CART':
      return {
        ...state,
        cart: []
      };
      
    case 'SELECT_TABLE':
      return {
        ...state,
        selectedTable: action.payload
      };
      
    case 'UPDATE_TABLE_STATUS':
      return {
        ...state,
        areas: state.areas.map(area => ({
          ...area,
          tables: area.tables.map(table =>
            table.id === action.payload.tableId
              ? { ...table, status: action.payload.status }
              : table
          )
        }))
      };
      
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, action.payload]
      };
      
    case 'INITIALIZE_DATA':
      return {
        ...state,
        areas: action.payload.areas,
        categories: action.payload.categories,
        customers: action.payload.customers
      };
      
    default:
      return state;
  }
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const loginMutation = useLogin();
  const logout = useLogout();
  
  const [state, dispatch] = useReducer(posReducer, {
    ...initialPOSState,
    ...initialAuthState
  });

  // Initialize authentication state
  const [authState, setAuthState] = React.useState<AuthState & {
    companies: Company[];
    branches: Branch[];
    selectedCompany: Company | null;
    selectedBranch: Branch | null;
    needsCompanySelection: boolean;
  }>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    companies: [],
    branches: [],
    selectedCompany: null,
    selectedBranch: null,
    needsCompanySelection: false,
  });

  useEffect(() => {
    // Initialize demo data
    initializeDemoData();
  }, []);

  const initializeDemoData = () => {
    const demoAreas: Area[] = [
      {
        id: 'plantas',
        name: 'Plantas',
        tables: [
          { id: 'mesa-1', name: 'Mesa 1', area: 'plantas', capacity: 4, status: 'available' },
          { id: 'mesa-2', name: 'Mesa 2', area: 'plantas', capacity: 2, status: 'occupied', customers: 2 },
          { id: 'mesa-3', name: 'Mesa 3', area: 'plantas', capacity: 6, status: 'pending' },
        ]
      },
      {
        id: 'primer-piso',
        name: 'Primer Piso',
        tables: [
          { id: 'mesa-4', name: 'Mesa 4', area: 'primer-piso', capacity: 4, status: 'available' },
          { id: 'mesa-5', name: 'Mesa 5', area: 'primer-piso', capacity: 8, status: 'reserved' },
        ]
      },
      {
        id: 'segundo-piso',
        name: 'Segundo Piso',
        tables: [
          { id: 'mesa-6', name: 'Mesa 6', area: 'segundo-piso', capacity: 2, status: 'available' },
          { id: 'balcon-1', name: 'Balcón 1', area: 'segundo-piso', capacity: 4, status: 'occupied', customers: 3 },
        ]
      },
      {
        id: 'terraza',
        name: 'Terraza',
        tables: [
          { id: 'terraza-1', name: 'Terraza 1', area: 'terraza', capacity: 6, status: 'available' },
          { id: 'barra-1', name: 'Barra 1', area: 'terraza', capacity: 1, status: 'occupied', customers: 1 },
        ]
      }
    ];

    const demoCategories: ProductCategory[] = [
      {
        id: 'bebidas-calientes',
        name: 'Bebidas Calientes',
        products: [
          { id: 'cafe-americano', name: 'Café Americano', category: 'bebidas-calientes', price: 4500, available: true },
          { id: 'capuchino', name: 'Capuchino', category: 'bebidas-calientes', price: 6000, available: true },
          { id: 'chocolate-caliente', name: 'Chocolate Caliente', category: 'bebidas-calientes', price: 5500, available: true },
        ]
      },
      {
        id: 'bebidas-frias',
        name: 'Bebidas Frías',
        products: [
          { id: 'limonada', name: 'Limonada Natural', category: 'bebidas-frias', price: 7000, available: true },
          { id: 'jugo-naranja', name: 'Jugo de Naranja', category: 'bebidas-frias', price: 8000, available: true },
          { id: 'agua-mineral', name: 'Agua Mineral', category: 'bebidas-frias', price: 3000, available: true },
        ]
      },
      {
        id: 'bebidas-alcoholicas',
        name: 'Bebidas Alcohólicas',
        products: [
          { id: 'vino-tinto-sparta', name: 'Vino Tinto Sparta', category: 'bebidas-alcoholicas', price: 45000, available: true, isAlcoholic: true },
          { id: 'vino-blanco-montana', name: 'Vino Blanco Montana', category: 'bebidas-alcoholicas', price: 42000, available: true, isAlcoholic: true },
          { id: 'cerveza-club-colombia', name: 'Cerveza Club Colombia', category: 'bebidas-alcoholicas', price: 8000, available: true, isAlcoholic: true },
        ]
      },
      {
        id: 'comida',
        name: 'Comida',
        products: [
          { id: 'pasta-queso', name: 'Pasta en Salsa de Queso', category: 'comida', price: 28000, available: true },
          { id: 'platillo-mar', name: 'Platillo del Mar', category: 'comida', price: 35000, available: true },
          { id: 'cerdo-vegetales', name: 'Cerdo con Vegetales', category: 'comida', price: 32000, available: true },
          { id: 'res-papas', name: 'Res con Papas', category: 'comida', price: 30000, available: true },
          { id: 'langostinos', name: 'Langostinos a la Plancha', category: 'comida', price: 38000, available: true },
        ]
      },
      {
        id: 'snacks',
        name: 'Snacks',
        products: [
          { id: 'galletas-oreo', name: 'Galletas Oreo', category: 'snacks', price: 5000, available: true },
          { id: 'churritos', name: 'Churritos', category: 'snacks', price: 4000, available: true },
          { id: 'papas-fritas', name: 'Papas Fritas', category: 'snacks', price: 8000, available: true },
        ]
      }
    ];

    const demoCustomers: Customer[] = [
      {
        id: 'cust-1',
        name: 'Juan Carlos',
        lastName: 'Pérez García',
        identification: '1234567890',
        phone: '+57 300 123 4567',
        city: 'Bogotá',
        email: 'juan.perez@email.com',
        createdAt: new Date()
      },
      {
        id: 'cust-2',
        name: 'María Elena',
        lastName: 'Rodríguez López',
        identification: '0987654321',
        phone: '+57 301 987 6543',
        city: 'Medellín',
        email: 'maria.rodriguez@email.com',
        createdAt: new Date()
      }
    ];

    dispatch({
      type: 'INITIALIZE_DATA',
      payload: {
        areas: demoAreas,
        categories: demoCategories,
        customers: demoCustomers
      }
    });
  };

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await loginMutation.mutateAsync({ username, password });
      
      if (result.success) {
        const needsSelection = result.companies.length > 1 || result.branches.length > 1;
        
        setAuthState(prev => ({
          ...prev,
          user: result.user,
          companies: result.companies,
          branches: result.branches,
          isAuthenticated: !needsSelection, // Only authenticated if no selection needed
          needsCompanySelection: needsSelection,
          isLoading: false,
        }));
        
        // If only one company/branch, auto-select them
        if (!needsSelection && result.companies[0] && result.branches[0]) {
          selectCompanyAndBranch(result.companies[0], result.branches[0]);
        }
        
        return true;
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // Company and branch selection
  const selectCompanyAndBranch = (company: Company, branch: Branch) => {
    localStorage.setItem('kuppel_selected_company', JSON.stringify(company));
    localStorage.setItem('kuppel_selected_branch', JSON.stringify(branch));
    
    setAuthState(prev => ({
      ...prev,
      selectedCompany: company,
      selectedBranch: branch,
      isAuthenticated: true,
      needsCompanySelection: false,
    }));
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
  };

  const removeFromCart = (itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { itemId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const selectTable = (table: Table) => {
    dispatch({ type: 'SELECT_TABLE', payload: table });
  };

  const updateTableStatus = (tableId: string, status: Table['status']) => {
    dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId, status } });
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const customer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_CUSTOMER', payload: customer });
  };

  const searchProducts = (query: string): Product[] => {
    const allProducts = state.categories.flatMap(cat => cat.products);
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );
  };

  const searchCustomers = (query: string): Customer[] => {
    return state.customers.filter(customer =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(query.toLowerCase()) ||
      customer.identification.includes(query) ||
      customer.phone.includes(query)
    );
  };

  // Check for stored user on mount
  useEffect(() => {
    const checkStoredAuth = () => {
      const stored = getStoredAuth();
      
      if (stored.user && stored.selectedCompany && stored.selectedBranch) {
        setAuthState({
          user: stored.user,
          companies: stored.companies,
          branches: stored.branches,
          selectedCompany: stored.selectedCompany,
          selectedBranch: stored.selectedBranch,
          isAuthenticated: true,
          needsCompanySelection: false,
          isLoading: false,
        });
      } else if (stored.user && stored.companies.length > 0) {
        // User logged in but needs company selection
        setAuthState({
          user: stored.user,
          companies: stored.companies,
          branches: stored.branches,
          selectedCompany: null,
          selectedBranch: null,
          isAuthenticated: false,
          needsCompanySelection: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkStoredAuth();
  }, []);

  return (
    <POSContext.Provider value={{
      posState: state,
      authState: authState,
      login,
      logout,
      selectCompanyAndBranch,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      selectTable,
      updateTableStatus,
      addCustomer,
      searchProducts,
      searchCustomers
    }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

// Export alias for compatibility
export const usePOSContext = usePOS;