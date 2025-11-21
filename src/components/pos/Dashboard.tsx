import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Settings, LogOut, Receipt, RotateCcw, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { VersionInfo } from '@/components/common/VersionInfo';
import { VotingButton } from '@/components/voting/VotingButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePOS } from '@/contexts/POSContext';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
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

type ViewMode = 'table-list' | 'table-products' | 'products';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { authState, posState, logout, searchProducts, loadPendingOrder, addToCart, refreshAreas } = usePOS();
  const { config } = useLayoutConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(config.tablesEnabled ? 'table-list' : 'products');
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [showTourPrompt, setShowTourPrompt] = useState(false);

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

  // Update view mode when tablesEnabled changes
  useEffect(() => {
    if (!config.tablesEnabled) {
      setViewMode('products');
      setSelectedTableForOrder(null);
    } else if (viewMode === 'products' && !selectedTableForOrder) {
      setViewMode('table-list');
    }
  }, [config.tablesEnabled]);

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

  const renderMainContent = () => {
    // Main views
    if (viewMode === 'table-list' && config.tablesEnabled) {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Mesas</h2>
            <p className="text-muted-foreground">
              Selecciona una mesa para iniciar o continuar un pedido
            </p>
          </div>
          
          <Tabs defaultValue={posState.areas[0]?.id || 'plantas'} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {posState.areas.map((area) => (
                <TabsTrigger key={area.id} value={area.id} className="capitalize">
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
      <header id="dashboard-header" className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-4">
              <Logo width={120} height={40} />
              {!isAuthRequired() && (
                <Badge variant="secondary" className="hidden md:flex">
                  Modo Demo
                </Badge>
              )}
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-semibold text-foreground">
                ¡Hola, {authState.user?.name}!
              </h1>
              <p className="text-xs text-muted-foreground capitalize">
                {getCurrentDate()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div id="search-bar" className="relative w-80 md:w-96">
              <Input
                placeholder="Buscar productos, clientes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-3"
              />
            </div>

            {/* Actions */}
            <VotingButton />
            <div id="theme-toggle">
              <ThemeToggle />
            </div>
            <Button id="settings-button" variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
            
            {shouldUseMockData() && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Demo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Restablecer datos demo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará todos los datos de demostración (facturas, gastos, sesiones de caja) y los restablecerá a los valores iniciales. Esta acción no se puede deshacer.
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
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Navigation Tabs */}
          <div id="main-navigation" className="bg-card border-b border-border px-6 py-3">
            <div className="flex items-center space-x-4">
              {config.tablesEnabled && (
                <Button
                  variant={viewMode === 'table-list' ? 'default' : 'ghost'}
                  onClick={() => {
                    setViewMode('table-list');
                    setSelectedTableForOrder(null);
                  }}
                  className="flex items-center space-x-2"
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
                className="flex items-center space-x-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Productos</span>
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            {renderMainContent()}
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        <div id="shopping-cart" className="w-96 bg-card border-l border-border h-full">
          <ShoppingCart selectedTable={selectedTableForOrder} onBackToTables={handleBackToTables} />
        </div>
      </div>
      
      {/* Version Info */}
      <VersionInfo />
    </div>
  );
};

export default Dashboard;
