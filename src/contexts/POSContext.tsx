import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { POSState, AuthState, User, Table, OrderItem, Product, Area, ProductCategory, Customer, POSSettings } from '@/types/pos';
import { Company, Branch } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useLogin, useLogout, getStoredAuth } from '@/hooks/useAuth';
import { isAuthRequired } from '@/config/environment';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface POSContextType {
  posState: POSState;
  authState: AuthState & {
    companies: Company[];
    branches: Branch[];
    selectedCompany: Company | null;
    selectedBranch: Branch | null;
    needsCompanySelection: boolean;
  };
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectCompanyAndBranch: (company: Company, branch: Branch) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  selectTable: (table: Table) => void;
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
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

  // Initialize authentication state with Supabase session
  const [authState, setAuthState] = useState<AuthState & {
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

  // Set up Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Only process SIGNED_IN and INITIAL_SESSION events fully
        if (event === 'TOKEN_REFRESHED') {
          // For token refresh, just update basic state without full reload
          if (session?.user) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }
        
        if (session?.user) {
          // User is logged in - defer data loading to avoid deadlock
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: true,
            user: {
              id: session.user.id,
              username: session.user.email || '',
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email || 'Usuario',
              role: 'cashier' as const,
              isActive: true
            }
          }));
          
          // Defer the heavy lifting to avoid blocking the auth callback
          setTimeout(() => {
            handleUserSession(session);
          }, 0);
        } else {
          // User is logged out
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            companies: [],
            branches: [],
            selectedCompany: null,
            selectedBranch: null,
            needsCompanySelection: false,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: true,
          user: {
            id: session.user.id,
            username: session.user.email || '',
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || 'Usuario',
            role: 'cashier' as const,
            isActive: true
          }
        }));
        setTimeout(() => handleUserSession(session), 0);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Failsafe: if loading persists too long, force it to false
    const failsafeTimer = setTimeout(() => {
      setAuthState(prev => {
        if (prev.isLoading) {
          console.warn('Auth loading timeout - forcing to false');
          return { ...prev, isLoading: false };
        }
        return prev;
      });
    }, 10000); // 10 second timeout

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafeTimer);
    };
  }, []);

  // Handle user session and load associated data
  const handleUserSession = async (session: Session) => {
    try {
      // Get or create user profile - with error handling
      let profile = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
        } else {
          profile = data;
        }
      } catch (profileError) {
        console.error('Profile fetch failed:', profileError);
      }

      // Try to get user companies and branches - but don't block on failure
      let companies = [];
      let branches = [];
      try {
        const { data: userCompanies } = await supabase
          .from('user_companies')
          .select(`
            company:companies(*),
            branch:branches(*)
          `)
          .eq('user_id', session.user.id);

        companies = userCompanies?.map(uc => uc.company).filter(Boolean) || [];
        branches = userCompanies?.map(uc => uc.branch).filter(Boolean) || [];
      } catch (companiesError) {
        console.error('Error fetching companies/branches:', companiesError);
      }

      // Check for stored selections
      const stored = getStoredAuth();
      const needsSelection = companies.length > 1 || branches.length > 1;

       setAuthState({
         user: profile ? {
           id: profile.id,
           username: profile.email,
           name: profile.name,
           role: profile.role as 'admin' | 'manager' | 'waiter' | 'cashier',
           email: profile.email,
           isActive: profile.is_active
         } : { 
           id: session.user.id,
           username: session.user.email || '',
           email: session.user.email || '',
           name: session.user.user_metadata?.name || session.user.email || 'Usuario',
           role: 'cashier' as const,
           isActive: true
         },
         companies: companies.map((comp: any) => ({
           id: comp.id,
           name: comp.name,
           address: comp.address,
           phone: comp.phone,
           email: comp.email
         })),
         branches: branches.map((branch: any) => ({
           id: branch.id,
           name: branch.name,
           address: branch.address,
           companyId: branch.company_id
         })),
         selectedCompany: stored.selectedCompany,
         selectedBranch: stored.selectedBranch,
         isAuthenticated: !needsSelection || (stored.selectedCompany && stored.selectedBranch) || companies.length === 0,
         needsCompanySelection: needsSelection && !(stored.selectedCompany && stored.selectedBranch),
         isLoading: false,
       });

       // Auto-select if only one option
       if (!needsSelection && companies[0] && branches[0]) {
         const transformedCompany = {
           id: companies[0].id,
           name: companies[0].name,
           address: companies[0].address,
           phone: companies[0].phone,
           email: companies[0].email
         };
         const transformedBranch = {
           id: branches[0].id,
           name: branches[0].name,
           address: branches[0].address,
           companyId: branches[0].company_id
         };
         selectCompanyAndBranch(transformedCompany, transformedBranch);
       }

    } catch (error) {
      console.error('Error handling user session:', error);
      // Always ensure we don't leave loading state stuck
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        isAuthenticated: !!session?.user // At minimum, mark as authenticated if we have a session
      }));
    }
  };

  // Remove ensureDemoUserAssociation as it was causing RLS issues
  // Demo associations should be handled at the database level or during signup

  useEffect(() => {
    // Initialize data from Supabase when auth state changes
    initializeDataFromSupabase();
  }, [authState.isAuthenticated, authState.selectedCompany, authState.selectedBranch]);

  const initializeDataFromSupabase = async () => {
    // Only initialize data if user is authenticated and has selected company/branch
    if (!authState.isAuthenticated || !authState.selectedCompany) {
      console.log('Skipping data initialization - not authenticated or no company selected');
      return;
    }

    console.log('Initializing data from Supabase for company:', authState.selectedCompany.name);

    try {
      // Get categories and products from Supabase with tenant filtering
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          products(*)
        `);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        toast({
          title: "Error de conexión",
          description: "No se pudieron cargar las categorías. Intenta recargar la página.",
          variant: "destructive"
        });
        return;
      }

      // Get tables from current branch
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('branch_id', authState.selectedBranch?.id);

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
      }

      // Get customers from current company
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      // Transform data to match our interfaces
      const transformedCategories: ProductCategory[] = categories?.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        products: cat.products?.map((prod: any) => ({
          id: prod.id,
          name: prod.name,
          category: cat.name,
          price: parseFloat(prod.price),
          description: prod.description,
          image: prod.image_url,
          available: prod.is_active,
          isAlcoholic: prod.is_alcoholic
        })) || []
      })) || [];

      console.log(`Loaded ${transformedCategories.length} categories with products`);

      // Group tables by area
      const groupedTables = tables?.reduce((acc: any, table: any) => {
        const areaName = table.area || 'Sin área';
        if (!acc[areaName]) {
          acc[areaName] = {
            id: areaName.toLowerCase().replace(/\s+/g, '-'),
            name: areaName,
            tables: []
          };
        }
        acc[areaName].tables.push({
          id: table.id,
          name: table.name,
          area: areaName,
          capacity: table.capacity,
          status: table.status,
          customers: table.customers || 0
        });
        return acc;
      }, {});

      const areas: Area[] = Object.values(groupedTables || {});

      const transformedCustomers: Customer[] = customers?.map((cust: any) => ({
        id: cust.id,
        name: cust.name,
        lastName: cust.last_name || '',
        identification: cust.identification || '',
        phone: cust.phone || '',
        city: cust.city || '',
        email: cust.email || '',
        createdAt: new Date(cust.created_at)
      })) || [];

      console.log(`Loaded ${areas.length} areas, ${transformedCustomers.length} customers`);

      dispatch({
        type: 'INITIALIZE_DATA',
        payload: {
          areas,
          categories: transformedCategories,
          customers: transformedCustomers
        }
      });

      toast({
        title: "Datos cargados",
        description: `${transformedCategories.length} categorías, ${areas.length} áreas, ${transformedCustomers.length} clientes`,
      });

    } catch (error) {
      console.error('Unexpected error initializing data from Supabase:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar los datos. Por favor recarga la página.",
        variant: "destructive"
      });
    }
  };

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
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await loginMutation.mutateAsync({ email, password });
      
      if (result.success && result.data) {
        const needsSelection = result.data.companies.length > 1 || result.data.branches.length > 1;
        
        setAuthState(prev => ({
          ...prev,
          user: result.data!.user,
          companies: result.data!.companies,
          branches: result.data!.branches,
          isAuthenticated: !needsSelection, // Only authenticated if no selection needed
          needsCompanySelection: needsSelection,
          isLoading: false,
        }));
        
        // If only one company/branch, auto-select them
        if (!needsSelection && result.data.companies[0] && result.data.branches[0]) {
          selectCompanyAndBranch(result.data.companies[0], result.data.branches[0]);
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

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      // Add customer to Supabase with company association
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          last_name: customerData.lastName,
          identification: customerData.identification,
          phone: customerData.phone,
          city: customerData.city,
          email: customerData.email,
          company_id: authState.selectedCompany?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        toast({
          title: "Error",
          description: "No se pudo agregar el cliente.",
          variant: "destructive"
        });
        return;
      }

      // Add to local state
      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        lastName: data.last_name || '',
        identification: data.identification || '',
        phone: data.phone || '',
        city: data.city || '',
        email: data.email || '',
        createdAt: new Date(data.created_at)
      };
      
      dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
      
      toast({
        title: "Cliente agregado",
        description: `${customerData.name} ha sido agregado exitosamente.`,
      });
    } catch (error) {
      console.error('Error in addCustomer:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente.",
        variant: "destructive"
      });
    }
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

  // Check for stored user on mount - simplified since Supabase handles session persistence
  useEffect(() => {
    // Supabase auth listener will handle the session automatically
    // Just initialize demo data and ensure loading state is handled properly
    if (!isAuthRequired()) {
      // In demo mode without required login, the auth listener will handle auto-login
      console.log('Demo mode: Auth listener will handle session');
    }
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
export const usePOSContext = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOSContext must be used within a POSProvider');
  }
  return context;
};