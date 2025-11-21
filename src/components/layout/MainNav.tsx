import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Users, History, MoreHorizontal, BarChart3, CreditCard, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { usePOS } from '@/contexts/POSContext';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled } from '@/config/environment';
import { cn } from '@/lib/utils';

export const MainNav: React.FC = () => {
  const location = useLocation();
  const { authState } = usePOS();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card border-b border-border px-6 py-3">
      <div className="flex items-center space-x-2">
        <Button
          variant={isActive('/') ? 'default' : 'ghost'}
          size="sm"
          asChild
        >
          <Link to="/" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Inicio</span>
          </Link>
        </Button>

        <Button
          variant={isActive('/settings') ? 'default' : 'ghost'}
          size="sm"
          asChild
        >
          <Link to="/settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Ajustes</span>
          </Link>
        </Button>

        <Button
          variant={isActive('/customers') ? 'default' : 'ghost'}
          size="sm"
          asChild
        >
          <Link to="/customers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Clientes</span>
          </Link>
        </Button>

        {isFeatureEnabled('orderHistory') && (
          <Button
            variant={isActive('/orders') ? 'default' : 'ghost'}
            size="sm"
            asChild
          >
            <Link to="/orders" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Órdenes</span>
            </Link>
          </Button>
        )}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <MoreHorizontal className="h-4 w-4" />
              <span>Más</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {hasPermission(authState.user, 'view_reports') && isFeatureEnabled('advancedReporting') && (
              <DropdownMenuItem asChild>
                <Link to="/reports" className="flex items-center cursor-pointer">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reportes
                </Link>
              </DropdownMenuItem>
            )}
            
            {hasPermission(authState.user, 'view_expenses') && (
              <DropdownMenuItem asChild>
                <Link to="/expenses" className="flex items-center cursor-pointer">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gastos
                </Link>
              </DropdownMenuItem>
            )}
            
            {hasPermission(authState.user, 'view_cash') && (
              <DropdownMenuItem asChild>
                <Link to="/cash" className="flex items-center cursor-pointer">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Caja
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default MainNav;
