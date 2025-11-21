import React, { useState, useEffect } from 'react';
import { ShoppingBag, User, Settings, LogOut, Users, Receipt, History, BarChart3, DollarSign, CreditCard, RotateCcw, MoreVertical, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LayoutConfig } from '@/components/common/LayoutConfig';
import { VersionInfo } from '@/components/common/VersionInfo';
import { VotingButton } from '@/components/voting/VotingButton';
import { usePOS } from '@/contexts/POSContext';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled, shouldUseMockData, isAuthRequired } from '@/config/environment';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TableGrid } from './TableGrid';
import { ShoppingCart } from './ShoppingCart';
import { ProductManager } from './ProductManager';
import { CustomerManager } from './CustomerManager';
import { OrderHistory } from './OrderHistory';
import { SalesReports } from './SalesReports';
import { ExpenseManager } from './ExpenseManager';
import { CashManager } from './CashManager';
import { Table } from '@/types/pos';

type ViewMode = 'table-list' | 'table-products' | 'products';
type SecondaryView = 'customers' | 'orders' | 'reports' | 'expenses' | 'cash' | null;

export const Dashboard: React.FC = () => {
  const { authState, posState, logout, searchProducts, loadPendingOrder, addToCart } = usePOS();
  const { config } = useLayoutConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(config.tablesEnabled ? 'table-list' : 'products');
  const [secondaryView, setSecondaryView] = useState<SecondaryView>(null);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);

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
    setSecondaryView(null);
  };

  const handleBackToTables = () => {
    setViewMode('table-list');
    setSelectedTableForOrder(null);
    setSecondaryView(null);
  };

  const handleSecondaryViewChange = (view: SecondaryView) => {
    setSecondaryView(view);
    if (view) {
      // Reset to default main view when opening secondary
      if (config.tablesEnabled) {
        setViewMode('table-list');
        setSelectedTableForOrder(null);
      } else {
        setViewMode('products');
      }
    }
  };

  const renderMainContent = () => {
    // Show secondary views first if active
    if (secondaryView === 'customers') {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Clientes</h2>
            <p className="text-muted-foreground">
              Administra la información de tus clientes
            </p>
          </div>
          <CustomerManager />
        </div>
      );
    }

    if (secondaryView === 'orders' && isFeatureEnabled('orderHistory')) {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Historial de Órdenes</h2>
            <p className="text-muted-foreground">
              Consulta y gestiona todas las órdenes procesadas
            </p>
          </div>
          <OrderHistory />
        </div>
      );
    }

    if (secondaryView === 'reports' && hasPermission(authState.user, 'view_reports') && isFeatureEnabled('advancedReporting')) {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Reportes de Ventas</h2>
            <p className="text-muted-foreground">
              Analiza el rendimiento y estadísticas del negocio
            </p>
          </div>
          <SalesReports />
        </div>
      );
    }

    if (secondaryView === 'expenses' && hasPermission(authState.user, 'view_expenses')) {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Gastos</h2>
            <p className="text-muted-foreground">
              Registra y administra los gastos del negocio
            </p>
          </div>
          <ExpenseManager />
        </div>
      );
    }

    if (secondaryView === 'cash' && hasPermission(authState.user, 'view_cash')) {
      return (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Caja</h2>
            <p className="text-muted-foreground">
              Controla la apertura, cierre y movimientos de caja
            </p>
          </div>
          <CashManager />
        </div>
      );
    }

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
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
            <LayoutConfig />
            
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
          <div className="bg-card border-b border-border px-6 py-3">
            <div className="flex items-center space-x-4">
              {config.tablesEnabled && (
                <Button
                  variant={viewMode === 'table-list' && !secondaryView ? 'default' : 'ghost'}
                  onClick={() => {
                    setViewMode('table-list');
                    setSelectedTableForOrder(null);
                    setSecondaryView(null);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Mesas</span>
                </Button>
              )}
              
              <Button
                variant={viewMode === 'products' && !secondaryView ? 'default' : 'ghost'}
                onClick={() => {
                  setViewMode('products');
                  setSelectedTableForOrder(null);
                  setSecondaryView(null);
                }}
                className="flex items-center space-x-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Productos</span>
              </Button>

              {/* More Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <MoreVertical className="h-4 w-4" />
                    <span>Más</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => handleSecondaryViewChange('customers')}>
                    <Users className="h-4 w-4 mr-2" />
                    Clientes
                  </DropdownMenuItem>
                  
                  {isFeatureEnabled('orderHistory') && (
                    <DropdownMenuItem onClick={() => handleSecondaryViewChange('orders')}>
                      <History className="h-4 w-4 mr-2" />
                      Órdenes
                    </DropdownMenuItem>
                  )}
                  
                  {hasPermission(authState.user, 'view_reports') && isFeatureEnabled('advancedReporting') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSecondaryViewChange('reports')}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Reportes
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {hasPermission(authState.user, 'view_expenses') && (
                    <DropdownMenuItem onClick={() => handleSecondaryViewChange('expenses')}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Gastos
                    </DropdownMenuItem>
                  )}
                  
                  {hasPermission(authState.user, 'view_cash') && (
                    <DropdownMenuItem onClick={() => handleSecondaryViewChange('cash')}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Caja
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            {renderMainContent()}
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="w-96 bg-card border-l border-border h-full">
          <ShoppingCart selectedTable={selectedTableForOrder} onBackToTables={handleBackToTables} />
        </div>
      </div>
      
      {/* Version Info */}
      <VersionInfo />
    </div>
  );
};

export default Dashboard;
