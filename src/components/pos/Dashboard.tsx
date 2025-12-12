import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut, Receipt, RotateCcw, ArrowLeft, HelpCircle, Shield, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { VersionInfo } from '@/components/common/VersionInfo';
import { VotingButton } from '@/components/voting/VotingButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { Menu, X } from 'lucide-react';
import { usePOS } from '@/contexts/POSContext';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { setupAutoSync } from '@/lib/offlineSync';
import { cacheProducts, cacheCustomers, cacheTables } from '@/lib/offlineStorage';
import { shouldUseMockData, isAuthRequired } from '@/config/environment';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TableGrid } from './TableGrid';
import { ShoppingCart } from './ShoppingCart';
import { ProductManager } from './ProductManager';
import { CategoryProductView } from './CategoryProductView';
import { Table } from '@/types/pos';
import { SetupWizard } from '../onboarding/SetupWizard';
import { DashboardTourPrompt } from '../onboarding/DashboardTourPrompt';
import { useDashboardTour } from '@/hooks/useDashboardTour';
import { useCompanyLimits } from '@/hooks/useCompanyLimits';
import { PlanLimitsAlert } from '@/components/common/PlanLimitsAlert';

type ViewMode = 'table-list' | 'table-products' | 'products';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { authState, posState, logout, searchProducts, loadPendingOrder, addToCart, refreshAreas, dataLoading } = usePOS();
  const { limitsStatus } = useCompanyLimits(authState.selectedCompany?.id);
  const { config } = useLayoutConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(config.tablesEnabled ? 'table-list' : 'products');
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [showTourPrompt, setShowTourPrompt] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { isOnline } = useOnlineStatus();

  // Check if tables are available and should be enabled
  useEffect(() => {
    const checkTablesAvailability = async () => {
      if (!authState.selectedBranch?.id) return;
      
      // Query areas to check if tables exist
      const { data: areasData } = await supabase
        .from('areas')
        .select('id')
        .eq('branch_id', authState.selectedBranch.id)
        .eq('is_active', true)
        .limit(1);
      
      const hasAreas = areasData && areasData.length > 0;
      
      // If no areas/tables exist but tablesEnabled is true, switch to products view
      if (!hasAreas && config.tablesEnabled) {
        setViewMode('products');
      }
    };
    
    checkTablesAvailability();
  }, [authState.selectedBranch?.id, config.tablesEnabled]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!authState.user?.id) return;

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', authState.user.id)
        .single();

      setIsAdmin(data?.role === 'admin');
    };

    checkAdminStatus();
  }, [authState.user?.id]);

  // Check if tour should be shown after setup
  useEffect(() => {
    if (!authState.needsInitialSetup && !authState.tourCompleted && !showTourPrompt) {
      // Small delay to let dashboard render
      const timer = setTimeout(() => {
        setShowTourPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [authState.needsInitialSetup, authState.tourCompleted]);

  // Dashboard tour
  const { startTour, skipTour, isTourActive } = useDashboardTour(
    authState.user?.id,
    false // Don't auto-start, we'll control it with prompt
  );
  
  // Realtime updates for orders and tables
  useRealtimeUpdates({
    onNewOrder: (order) => {
      console.log('New order detected via Realtime:', order);
      // Visual feedback is sufficient, no notification needed
    },
    onTableStatusChange: (table, oldStatus) => {
      console.log('Table status changed via Realtime:', table, oldStatus);
      // Visual feedback is sufficient, no notification needed
    },
    onTableCreated: async (table) => {
      console.log('New table detected via Realtime:', table);
      // Refrescar áreas para mostrar la nueva mesa
      await refreshAreas();
    },
    enabled: true
  });

  // Setup offline sync and caching
  useEffect(() => {
    setupAutoSync();
    
    // Cache data for offline use when online
    if (isOnline && authState.selectedCompany) {
      const cacheData = async () => {
        try {
          // Cache products from all categories
          const allProducts = posState.categories.flatMap(cat => cat.products || []);
          if (allProducts.length > 0) {
            await cacheProducts(allProducts);
          }
          
          // Cache customers
          if (posState.customers.length > 0) {
            await cacheCustomers(posState.customers);
          }
          
          // Cache tables
          const allTables = posState.areas.flatMap(area => area.tables || []);
          if (allTables.length > 0) {
            await cacheTables(allTables);
          }
          
          console.log('✅ Data cached for offline use');
        } catch (error) {
          console.error('Error caching data:', error);
        }
      };
      
      cacheData();
    }
  }, [isOnline, authState.selectedCompany, posState.categories, posState.customers, posState.areas]);

  // Update view mode when tablesEnabled changes
  useEffect(() => {
    if (!config.tablesEnabled) {
      setViewMode('products');
      setSelectedTableForOrder(null);
    } else if (config.tablesEnabled && !dataLoading && posState.areas.length > 0) {
      // Solo establecer table-list si hay áreas cargadas y no estamos en una vista específica
      if (!selectedTableForOrder && viewMode !== 'table-list') {
        setViewMode('table-list');
      }
    }
  }, [config.tablesEnabled, dataLoading, posState.areas.length, selectedTableForOrder]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const products = searchProducts(query);
      console.log('Search results:', products);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleResetDemoData = () => {
    if (!shouldUseMockData()) return;
    
    const keysToRemove = [
      'kuppel_mock_products',
      'kuppel_mock_invoices', 
      'kuppel_mock_expenses',
      'kuppel_mock_cash_session',
      'kuppel_mock_customers',
      'kuppel_pending_orders'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    toast({
      title: "Datos demo restablecidos",
      description: "Los datos han sido restablecidos a los valores iniciales. Recarga la página para ver los cambios.",
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleTableClick = (table: Table) => {
    setSelectedTableForOrder(table);
    
    // Check if table has pending order
    if (table.status === 'pending') {
      const pendingOrder = loadPendingOrder(table.id);
      if (pendingOrder) {
        // Load items into cart
        pendingOrder.items.forEach(item => {
          const product = posState.categories
            .flatMap(cat => cat.products)
            .find(p => p.id === item.id);
          if (product) {
            addToCart(product, item.quantity);
          }
        });
        toast({
          title: "Cuenta abierta cargada",
          description: `Se cargaron los items de la mesa ${table.name}`,
        });
      }
    }
    
    setViewMode('table-products');
  };

  const handleBackToTables = () => {
    setViewMode('table-list');
    setSelectedTableForOrder(null);
  };

  const handlePaymentComplete = () => {
    // Limpiar mesa seleccionada
    setSelectedTableForOrder(null);
    
    // Determinar vista según el contexto
    if (config.tablesEnabled) {
      // Si hay mesas habilitadas, siempre volver a la lista de mesas
      setViewMode('table-list');
    } else {
      // Si no hay mesas, quedarse en productos
      setViewMode('products');
    }
  };

  const renderMainContent = () => {
    // Main views
    if (viewMode === 'table-list' && config.tablesEnabled) {
      if (dataLoading || posState.areas.length === 0) {
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando mesas...</p>
            </div>
          </div>
        );
      }
      
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Mesas</h2>
            <p className="text-muted-foreground">
              Selecciona una mesa para iniciar o continuar un pedido
            </p>
          </div>
          
          <Tabs defaultValue={posState.areas[0]?.id || 'plantas'} className="w-full">
            <TabsList className={isMobile ? 'flex w-full overflow-x-auto mb-6' : 'grid w-full mb-6 grid-cols-2 md:grid-cols-3 laptop:grid-cols-4'}>
              {posState.areas.map((area) => (
                <TabsTrigger key={area.id} value={area.id} className="capitalize whitespace-nowrap flex-shrink-0">
                  {area.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {posState.areas.map((area) => (
              <TabsContent key={area.id} value={area.id}>
                <TableGrid area={area} onTableClick={handleTableClick} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      );
    }

    if (viewMode === 'table-products' && selectedTableForOrder) {
      return (
        <div>
          <div className="mb-6 flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToTables}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mesas
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Mesa: {selectedTableForOrder.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedTableForOrder.area} • Capacidad: {selectedTableForOrder.capacity} personas
              </p>
            </div>
          </div>
          <ProductManager />
        </div>
      );
    }

    if (viewMode === 'products') {
      return (
        <div>
          {!config.tablesEnabled ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="secondary" className="mb-2">
                  Modo sin mesas - Ventas de mostrador
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 mb-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>En este modo no se usan mesas. Selecciona una categoría y agrega productos directamente al carrito para ventas rápidas de mostrador.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CategoryProductView />
            </>
          ) : (
            <ProductManager />
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Tour Prompt */}
      {showTourPrompt && (
        <DashboardTourPrompt
          onStart={() => {
            setShowTourPrompt(false);
            startTour();
          }}
          onSkip={async () => {
            setShowTourPrompt(false);
            await skipTour();
          }}
        />
      )}

      {/* Header */}
      <header id="dashboard-header" className="bg-card border-b border-border px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Left side - Logo and welcome */}
          <div className="flex flex-col space-y-1 md:space-y-2 min-w-0 flex-shrink">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Logo width={isMobile ? 80 : 120} height={isMobile ? 26 : 40} />
              {!isAuthRequired() && (
                <Badge variant="secondary" className="hidden laptop:flex text-xs">
                  Modo Demo
                </Badge>
              )}
            </div>
            <div className="hidden laptop:block">
              <h1 className="text-xs md:text-sm font-semibold text-foreground">
                ¡Hola, {authState.user?.name}!
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground capitalize line-clamp-1">
                {getCurrentDate()}
              </p>
            </div>
          </div>

          {/* Center - Search Bar (Hidden on mobile) */}
          <div id="search-bar" className="relative hidden laptop:block flex-1 max-w-md">
            <Input
              placeholder="Buscar productos, clientes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-3"
            />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Mobile Menu */}
            {isMobile && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                  <div className="flex flex-col gap-4 pt-8">
                    {/* Mobile Search */}
                    <div className="relative">
                      <Input
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <VotingButton />
                      {isAdmin && (
                        <Button variant="outline" onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}>
                          <Shield className="h-4 w-4 mr-2" />
                          Admin
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
                        <Home className="h-4 w-4 mr-2" />
                        Volver a Kuppel App
                      </Button>
                      {shouldUseMockData() && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline">
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Demo
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Restablecer datos demo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará todos los datos de demostración.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetDemoData}>
                                Restablecer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button variant="outline" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Desktop actions */}
            <div className="hidden laptop:flex items-center gap-2">
              <OfflineIndicator />
              <VotingButton />
              <div id="theme-toggle">
                <ThemeToggle />
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button id="back-to-app-button" variant="outline" size="sm" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Volver a Kuppel App
              </Button>
              
              {shouldUseMockData() && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Demo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Restablecer datos demo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará todos los datos de demostración (facturas, gastos, sesiones de caja) y los restablecerá a los valores iniciales.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetDemoData}>
                        Restablecer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>

            {/* Mobile cart button */}
            {isMobile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCartOpen(true)}
                className="relative h-9 w-9 p-0"
              >
                <ShoppingBag className="h-4 w-4" />
                {posState.cart.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {posState.cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            )}

            {/* Tablet/Desktop theme toggle (only on tablet) */}
            <div className="laptop:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-76px)] lg:h-[calc(100vh-88px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Plan Limits Alert */}
          {limitsStatus && (
            <div className="px-3 md:px-6 pt-2 md:pt-4">
              <PlanLimitsAlert limitsStatus={limitsStatus} />
            </div>
          )}
          
          {/* Navigation Tabs */}
          <div id="main-navigation" className="bg-card border-b border-border px-3 md:px-6 py-2 md:py-3">
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto">
              {config.tablesEnabled && (
                <Button
                  variant={viewMode === 'table-list' ? 'default' : 'ghost'}
                  onClick={() => {
                    setViewMode('table-list');
                    setSelectedTableForOrder(null);
                  }}
                  size={isMobile ? 'sm' : 'default'}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Mesas</span>
                </Button>
              )}
              
              <Button
                variant={viewMode === 'products' ? 'default' : 'ghost'}
                onClick={() => {
                  setViewMode('products');
                  setSelectedTableForOrder(null);
                }}
                size={isMobile ? 'sm' : 'default'}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Productos</span>
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-3 md:p-6 overflow-auto">
            {renderMainContent()}
          </div>
        </div>

        {/* Shopping Cart - Desktop Sidebar / Mobile Drawer / Tablet Sheet */}
        {isMobile ? (
          <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
            <DrawerContent className="max-h-[85vh]">
              <div className="h-full overflow-hidden">
                <ShoppingCart 
                  selectedTable={selectedTableForOrder} 
                  onBackToTables={handleBackToTables}
                  onPaymentComplete={() => {
                    handlePaymentComplete();
                    setIsCartOpen(false);
                  }}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : isTablet ? (
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
              >
                <ShoppingBag className="h-6 w-6" />
                {posState.cart.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center">
                    {posState.cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <ShoppingCart 
                selectedTable={selectedTableForOrder} 
                onBackToTables={handleBackToTables}
                onPaymentComplete={() => {
                  handlePaymentComplete();
                  setIsCartOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <div id="shopping-cart" className="w-80 xl:w-96 bg-card border-l border-border h-full flex-shrink-0">
            <ShoppingCart 
              selectedTable={selectedTableForOrder} 
              onBackToTables={handleBackToTables}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>
        )}
      </div>
      
      {/* Version Info */}
      <VersionInfo />
    </div>
  );
};

export default Dashboard;
