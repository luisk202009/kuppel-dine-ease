import React, { useState } from 'react';
import { Search, User, Settings, LogOut, Plus, Users, Receipt, Moon, Sun, History, BarChart3, DollarSign, CreditCard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LayoutConfig } from '@/components/common/LayoutConfig';
import { VersionInfo } from '@/components/common/VersionInfo';
import { usePOS } from '@/contexts/POSContext';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled, shouldUseMockData, isAuthRequired } from '@/config/environment';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TableGrid } from './TableGrid';
import { ProductCatalog } from './ProductCatalog';
import { ShoppingCart } from './ShoppingCart';
import { CustomerManager } from './CustomerManager';
import { OrderHistory } from './OrderHistory';
import { SalesReports } from './SalesReports';
import { ExpenseManager } from './ExpenseManager';
import { CashManager } from './CashManager';

export const Dashboard: React.FC = () => {
  const { authState, posState, logout, searchProducts } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'tables' | 'products' | 'customers' | 'orders' | 'reports' | 'expenses' | 'cash'>('tables');

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
    
    // Clear all mock data from localStorage
    const keysToRemove = [
      'kuppel_mock_products',
      'kuppel_mock_invoices', 
      'kuppel_mock_expenses',
      'kuppel_mock_cash_session',
      'kuppel_mock_customers'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    toast({
      title: "Datos demo restablecidos",
      description: "Los datos han sido restablecidos a los valores iniciales. Recarga la página para ver los cambios.",
    });
    
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo width={120} height={40} />
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-foreground">
                ¡Hola, {authState.user?.name}!
              </h1>
              <p className="text-sm text-muted-foreground capitalize">
                {getCurrentDate()}
              </p>
            </div>
            {!isAuthRequired() && (
              <Badge variant="secondary" className="hidden md:flex">
                Modo Demo
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos, clientes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Actions */}
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
            
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Settings className="h-4 w-4 mr-2" />
              Config
            </Button>
            
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
            <div className="flex space-x-4 overflow-x-auto">
              <Button
                variant={activeView === 'tables' ? 'default' : 'ghost'}
                onClick={() => setActiveView('tables')}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Receipt className="h-4 w-4" />
                <span>Mesas</span>
              </Button>
              <Button
                variant={activeView === 'products' ? 'default' : 'ghost'}
                onClick={() => setActiveView('products')}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Productos</span>
              </Button>
              <Button
                variant={activeView === 'customers' ? 'default' : 'ghost'}
                onClick={() => setActiveView('customers')}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Users className="h-4 w-4" />
                <span>Clientes</span>
              </Button>
              {isFeatureEnabled('orderHistory') && (
                <Button
                  variant={activeView === 'orders' ? 'default' : 'ghost'}
                  onClick={() => setActiveView('orders')}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <History className="h-4 w-4" />
                  <span>Órdenes</span>
                </Button>
              )}
              {hasPermission(authState.user, 'view_reports') && isFeatureEnabled('advancedReporting') && (
                <Button
                  variant={activeView === 'reports' ? 'default' : 'ghost'}
                  onClick={() => setActiveView('reports')}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Reportes</span>
                </Button>
              )}
              {hasPermission(authState.user, 'view_expenses') && (
                <Button
                  variant={activeView === 'expenses' ? 'default' : 'ghost'}
                  onClick={() => setActiveView('expenses')}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Gastos</span>
                </Button>
              )}
              {hasPermission(authState.user, 'view_cash') && (
                <Button
                  variant={activeView === 'cash' ? 'default' : 'ghost'}
                  onClick={() => setActiveView('cash')}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Caja</span>
                </Button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            {activeView === 'tables' && (
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
                      <TableGrid area={area} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {activeView === 'products' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Catálogo de Productos</h2>
                  <p className="text-muted-foreground">
                    Selecciona productos para agregar al pedido
                  </p>
                </div>
                <ProductCatalog searchQuery={searchQuery} />
              </div>
            )}

            {activeView === 'customers' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Clientes</h2>
                  <p className="text-muted-foreground">
                    Administra la información de tus clientes
                  </p>
                </div>
                <CustomerManager />
              </div>
            )}

            {activeView === 'orders' && isFeatureEnabled('orderHistory') && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Historial de Órdenes</h2>
                  <p className="text-muted-foreground">
                    Consulta y gestiona todas las órdenes procesadas
                  </p>
                </div>
                <OrderHistory />
              </div>
            )}

            {activeView === 'reports' && hasPermission(authState.user, 'view_reports') && isFeatureEnabled('advancedReporting') && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Reportes de Ventas</h2>
                  <p className="text-muted-foreground">
                    Analiza el rendimiento y estadísticas del negocio
                  </p>
                </div>
                <SalesReports />
              </div>
            )}

            {activeView === 'expenses' && hasPermission(authState.user, 'view_expenses') && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Gastos</h2>
                  <p className="text-muted-foreground">
                    Registra y administra los gastos del negocio
                  </p>
                </div>
                <ExpenseManager />
              </div>
            )}

            {activeView === 'cash' && hasPermission(authState.user, 'view_cash') && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Caja</h2>
                  <p className="text-muted-foreground">
                    Controla la apertura, cierre y movimientos de caja
                  </p>
                </div>
                <CashManager />
              </div>
            )}
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="w-96 bg-card border-l border-border">
          <ShoppingCart />
        </div>
      </div>
      
      {/* Version Info */}
      <VersionInfo />
    </div>
  );
};

export default Dashboard;