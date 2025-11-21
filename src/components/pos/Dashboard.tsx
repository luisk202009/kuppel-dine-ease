import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { VotingButton } from '@/components/voting/VotingButton';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { usePOS } from '@/contexts/POSContext';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { shouldUseMockData, isAuthRequired } from '@/config/environment';
import { toast } from '@/hooks/use-toast';
import { TableGrid } from './TableGrid';
import { ShoppingCart } from './ShoppingCart';
import { ProductManager } from './ProductManager';
import { Table } from '@/types/pos';

// Import page views
import Settings from '@/pages/Settings';
import Customers from '@/pages/Customers';
import Orders from '@/pages/Orders';
import Reports from '@/pages/Reports';
import Expenses from '@/pages/Expenses';
import Cash from '@/pages/Cash';

type ViewMode = 'table-list' | 'table-products' | 'products';
type MainView = 'dashboard' | 'settings' | 'customers' | 'orders' | 'reports' | 'expenses' | 'cash';

export const Dashboard: React.FC = () => {
  const { authState, posState, searchProducts, loadPendingOrder, addToCart } = usePOS();
  const { config } = useLayoutConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<MainView>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>(config.tablesEnabled ? 'table-list' : 'products');
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  
  // Notifications setup
  const { showNotification, requestPermission, isGranted, isSupported } = useNotifications();
  
  // Request notification permission on mount
  useEffect(() => {
    if (isSupported && !isGranted) {
      requestPermission();
    }
  }, [isSupported, isGranted, requestPermission]);
  
  // Realtime updates for orders and tables
  useRealtimeUpdates({
    onNewOrder: (order) => {
      showNotification('Nueva Orden', {
        body: `Orden ${order.order_number} creada`,
        tag: 'new-order',
        requireInteraction: false
      });
      
      toast({
        title: "Nueva Orden",
        description: `Orden ${order.order_number} ha sido creada`
      });
    },
    onTableStatusChange: (table, oldStatus) => {
      const statusLabels: Record<string, string> = {
        available: 'Disponible',
        occupied: 'Ocupada',
        pending: 'Cuenta Pendiente',
        reserved: 'Reservada'
      };
      
      showNotification('Cambio en Mesa', {
        body: `${table.name}: ${statusLabels[oldStatus]} → ${statusLabels[table.status]}`,
        tag: 'table-status',
        requireInteraction: false
      });
      
      toast({
        title: "Cambio en Mesa",
        description: `${table.name} cambió a ${statusLabels[table.status]}`
      });
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

  const handleViewChange = (view: string) => {
    setCurrentView(view as MainView);
    // Reset dashboard state when changing views
    if (view !== 'dashboard') {
      setViewMode(config.tablesEnabled ? 'table-list' : 'products');
      setSelectedTableForOrder(null);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'settings':
        return <Settings />;
      case 'customers':
        return <Customers />;
      case 'orders':
        return <Orders />;
      case 'reports':
        return <Reports />;
      case 'expenses':
        return <Expenses />;
      case 'cash':
        return <Cash />;
      case 'dashboard':
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => {
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
          {!config.tablesEnabled && (
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                Modo sin mesas - Ventas de mostrador
              </Badge>
            </div>
          )}
          <ProductManager />
        </div>
      );
    }

    return null;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar currentView={currentView} onViewChange={handleViewChange} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
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
                    <Breadcrumbs currentView={currentView} />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search Bar */}
                <div className="relative w-80 md:w-96">
                  <Input
                    placeholder="Buscar productos, clientes..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-3"
                  />
                </div>

                {/* Actions */}
                <VotingButton />
                <ThemeToggle />
                
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
              </div>
            </div>
          </header>

          <div className="flex flex-1 h-[calc(100vh-80px)]">
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Navigation Tabs - Only show for dashboard view */}
              {currentView === 'dashboard' && (
                <div className="bg-card border-b border-border px-6 py-3">
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
                        <ShoppingBag className="h-4 w-4" />
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
              )}

              {/* Content Area */}
              <div className="flex-1 p-6 overflow-auto">
                {renderCurrentView()}
              </div>
            </div>

            {/* Shopping Cart - Only show for dashboard view */}
            {currentView === 'dashboard' && (
              <aside className="w-96 border-l border-border bg-card overflow-auto">
                <ShoppingCart selectedTable={selectedTableForOrder} />
              </aside>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
