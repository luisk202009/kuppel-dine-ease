import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LogOut, RotateCcw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { VotingButton } from '@/components/voting/VotingButton';
import { NavigationDrawer } from './NavigationDrawer';
import { usePOS } from '@/contexts/POSContext';
import { shouldUseMockData, isAuthRequired } from '@/config/environment';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const AppLayout: React.FC = () => {
  const { authState, logout } = usePOS();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);

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

  // Don't show layout on landing page
  if (location.pathname === '/demo') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setMenuOpen(true)}>
              <Menu className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Menú</span>
            </Button>
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
            <div className="relative w-80 md:w-96 hidden lg:block">
              <Input
                placeholder="Buscar productos, clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-100px)]">
        <Outlet />
      </main>

      {/* Navigation Drawer */}
      <NavigationDrawer open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  );
};

export default AppLayout;
