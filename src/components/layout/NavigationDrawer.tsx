import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Settings, Users, History, BarChart3, CreditCard, DollarSign } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePOS } from '@/contexts/POSContext';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled } from '@/config/environment';
import { cn } from '@/lib/utils';

interface NavigationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavItem {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  permission?: string;
  featureFlag?: string;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = usePOS();

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const principalItems: NavItem[] = [
    {
      title: 'Inicio',
      description: 'Volver a punto de venta',
      icon: Home,
      path: '/',
    },
    {
      title: 'Ajustes',
      description: 'Configuración del sistema',
      icon: Settings,
      path: '/settings',
    },
  ];

  const gestionItems: NavItem[] = [
    {
      title: 'Clientes',
      description: 'Administrar clientes',
      icon: Users,
      path: '/customers',
    },
    {
      title: 'Órdenes',
      description: 'Historial de ventas',
      icon: History,
      path: '/orders',
      featureFlag: 'orderHistory',
    },
  ];

  const finanzasItems: NavItem[] = [
    {
      title: 'Gastos',
      description: 'Registro de gastos',
      icon: CreditCard,
      path: '/expenses',
      permission: 'view_expenses',
    },
    {
      title: 'Caja',
      description: 'Gestión de caja',
      icon: DollarSign,
      path: '/cash',
      permission: 'view_cash',
    },
  ];

  const analisisItems: NavItem[] = [
    {
      title: 'Reportes',
      description: 'Estadísticas y análisis',
      icon: BarChart3,
      path: '/reports',
      permission: 'view_reports',
      featureFlag: 'advancedReporting',
    },
  ];

  const renderNavItem = (item: NavItem) => {
    // Check permissions and feature flags
    if (item.permission && !hasPermission(authState.user, item.permission as any)) {
      return null;
    }
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag as any)) {
      return null;
    }

    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <Button
        key={item.path}
        variant="ghost"
        className={cn(
          "w-full justify-start h-auto py-4 px-4 text-left hover:bg-accent/50 transition-colors",
          active && "bg-accent border-l-4 border-primary font-medium"
        )}
        onClick={() => handleNavigate(item.path)}
      >
        <div className="flex items-start space-x-4 w-full">
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", active && "text-primary")} />
          <div className="flex-1 min-w-0">
            <div className={cn("font-medium text-base", active && "text-primary")}>
              {item.title}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {item.description}
            </div>
          </div>
        </div>
      </Button>
    );
  };

  const renderSection = (title: string, items: NavItem[]) => {
    const visibleItems = items.filter(item => {
      if (item.permission && !hasPermission(authState.user, item.permission as any)) {
        return false;
      }
      if (item.featureFlag && !isFeatureEnabled(item.featureFlag as any)) {
        return false;
      }
      return true;
    });

    if (visibleItems.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {items.map(renderNavItem)}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">Menú Principal</SheetTitle>
          <SheetDescription>
            Navegue por las diferentes secciones del sistema
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {renderSection('Principal', principalItems)}
          
          <Separator />
          
          {renderSection('Gestión', gestionItems)}
          
          <Separator />
          
          {renderSection('Finanzas', finanzasItems)}
          
          {analisisItems.some(item => 
            (!item.permission || hasPermission(authState.user, item.permission as any)) &&
            (!item.featureFlag || isFeatureEnabled(item.featureFlag as any))
          ) && (
            <>
              <Separator />
              {renderSection('Análisis', analisisItems)}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
