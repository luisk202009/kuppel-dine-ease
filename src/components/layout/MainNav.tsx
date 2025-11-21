import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Users, History, BarChart3, CreditCard, DollarSign } from 'lucide-react';
import { usePOS } from '@/contexts/POSContext';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled } from '@/config/environment';
import { cn } from '@/lib/utils';

export const MainNav: React.FC = () => {
  const location = useLocation();
  const { authState } = usePOS();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
              "hover:bg-accent hover:text-accent-foreground rounded-t-lg",
              isActive('/') && "bg-accent text-accent-foreground border-b-2 border-primary"
            )}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>

          <Link
            to="/customers"
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
              "hover:bg-accent hover:text-accent-foreground rounded-t-lg",
              isActive('/customers') && "bg-accent text-accent-foreground border-b-2 border-primary"
            )}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </Link>

          {isFeatureEnabled('orderHistory') && (
            <Link
              to="/orders"
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                "hover:bg-accent hover:text-accent-foreground rounded-t-lg",
                isActive('/orders') && "bg-accent text-accent-foreground border-b-2 border-primary"
              )}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Órdenes</span>
            </Link>
          )}

          {hasPermission(authState.user, 'view_expenses') && (
            <Link
              to="/expenses"
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                "hover:bg-accent hover:text-accent-foreground rounded-t-lg",
                isActive('/expenses') && "bg-accent text-accent-foreground border-b-2 border-primary"
              )}
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Gastos</span>
            </Link>
          )}

          {hasPermission(authState.user, 'view_cash') && (
            <Link
              to="/cash"
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                "hover:bg-accent hover:text-accent-foreground rounded-t-lg",
                isActive('/cash') && "bg-accent text-accent-foreground border-b-2 border-primary"
              )}
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Caja</span>
            </Link>
          )}

          {hasPermission(authState.user, 'view_reports') && isFeatureEnabled('advancedReporting') && (
            <Link
              to="/reports"
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                "hover:bg-accent hover:text-accent-foreground rounded-t-lg",
                isActive('/reports') && "bg-accent text-accent-foreground border-b-2 border-primary"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reportes</span>
            </Link>
          )}

          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
              "hover:bg-accent hover:text-accent-foreground rounded-t-lg",
              isActive('/settings') && "bg-accent text-accent-foreground border-b-2 border-primary"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ajustes</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
