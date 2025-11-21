import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Settings, Users, History, BarChart3, CreditCard, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card
        key={item.path}
        className={cn(
          "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
          active && "border-primary border-2 bg-accent"
        )}
        onClick={() => handleNavigate(item.path)}
      >
        <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
          <Icon className={cn(
            "h-12 w-12",
            active ? "text-primary" : "text-muted-foreground"
          )} />
          <h3 className={cn(
            "text-xl font-bold",
            active && "text-primary"
          )}>
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {item.description}
          </p>
        </CardContent>
      </Card>
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
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            {title}
          </h2>
          <Separator className="mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(renderNavItem)}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl text-center">
            Menú Principal
          </DialogTitle>
          <DialogDescription className="text-center">
            Selecciona una sección para continuar
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 space-y-8 pb-8">
          {renderSection('PRINCIPAL', principalItems)}
          {renderSection('GESTIÓN', gestionItems)}
          {renderSection('FINANZAS', finanzasItems)}
          {renderSection('ANÁLISIS', analisisItems)}
        </div>
      </DialogContent>
    </Dialog>
  );
};
