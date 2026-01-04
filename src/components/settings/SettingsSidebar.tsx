import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  Receipt, 
  BarChart3, 
  CreditCard, 
  DollarSign, 
  Package, 
  Wallet, 
  FileText,
  ShoppingCart,
  Monitor,
  ChevronDown,
  ChevronRight,
  Shield,
  LayoutDashboard,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled } from '@/config/environment';
import { User, EnabledModules } from '@/types/pos';
import { SettingsSection } from '@/pages/Settings';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  user: User | null;
  enabledModules?: EnabledModules | null;
}

interface SidebarItem {
  id: SettingsSection | 'pos';
  label: string;
  icon: React.ElementType;
  permission?: string;
  feature?: string;
  isExternal?: boolean;
  externalPath?: string;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

// Grupo desplegable de Ventas
const salesGroup: SidebarGroup = {
  id: 'sales',
  label: 'Ventas',
  icon: ShoppingCart,
  items: [
    {
      id: 'standardInvoicing',
      label: 'Facturación',
      icon: FileText,
    },
    {
      id: 'paymentReceipts',
      label: 'Pagos Recibidos',
      icon: Wallet,
    },
    {
      id: 'pos',
      label: 'POS',
      icon: Monitor,
      isExternal: true,
      externalPath: '/pos',
    },
    {
      id: 'cash',
      label: 'Caja',
      icon: DollarSign,
      permission: 'view_cash',
    },
  ],
};

// Grupo desplegable de Gastos
const expensesGroup: SidebarGroup = {
  id: 'expensesGroup',
  label: 'Gastos',
  icon: CreditCard,
  items: [
    {
      id: 'expenses',
      label: 'Gastos',
      icon: Receipt,
      permission: 'view_expenses',
    },
    {
      id: 'expensePayments',
      label: 'Pagos Realizados',
      icon: Wallet,
    },
  ],
};

// Dashboard item (first item)
const dashboardItem: SidebarItem = {
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
};

// Items individuales del menú (en orden solicitado)
const sidebarItems: SidebarItem[] = [
  {
    id: 'products',
    label: 'Productos',
    icon: Package,
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: Users,
  },
  {
    id: 'treasury',
    label: 'Tesorería',
    icon: Landmark,
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    permission: 'view_reports',
    feature: 'advancedReporting',
  },
  {
    id: 'subscriptions',
    label: 'Suscripciones',
    icon: Wallet,
  },
];

// Item de Ajustes (al final)
const settingsItem: SidebarItem = {
  id: 'settings',
  label: 'Ajustes',
  icon: Settings,
};

// Item de Administración (solo para admins)
const adminItem: SidebarItem = {
  id: 'admin' as any,
  label: 'Administración',
  icon: Shield,
  isExternal: true,
  externalPath: '/admin',
};

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
  user,
  enabledModules,
}) => {
  const navigate = useNavigate();
  const [isSalesOpen, setIsSalesOpen] = useState(
    activeSection === 'standardInvoicing' || activeSection === 'cash' || activeSection === 'paymentReceipts'
  );
  const [isExpensesOpen, setIsExpensesOpen] = useState(
    activeSection === 'expenses' || activeSection === 'expensePayments'
  );

  const isItemVisible = (item: SidebarItem): boolean => {
    if (item.permission && !hasPermission(user, item.permission as any)) {
      return false;
    }
    if (item.feature && !isFeatureEnabled(item.feature as any)) {
      return false;
    }
    if (enabledModules && enabledModules[item.id as keyof EnabledModules] === false) {
      return false;
    }
    return true;
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.isExternal && item.externalPath) {
      navigate(item.externalPath);
    } else {
      onSectionChange(item.id as SettingsSection);
    }
  };

  const visibleItems = sidebarItems.filter(isItemVisible);
  const visibleSalesItems = salesGroup.items.filter(isItemVisible);
  const visibleExpenseItems = expensesGroup.items.filter(isItemVisible);
  const isAdmin = user?.role === 'admin';

  const renderMenuItem = (item: SidebarItem, isNested = false) => {
    const Icon = item.icon;
    const isActive = !item.isExternal && activeSection === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
          isNested && 'pl-9',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-card border-r border-border overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-1">Kuppel App</h2>
        <p className="text-xs text-muted-foreground">Gestiona tu negocio</p>
      </div>

      <nav className="px-2 pb-4 space-y-1">
        {/* Dashboard (first item) */}
        {renderMenuItem(dashboardItem)}

        {/* Grupo Ventas (desplegable) */}
        {visibleSalesItems.length > 0 && (
          <Collapsible open={isSalesOpen} onOpenChange={setIsSalesOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  activeSection === 'standardInvoicing' || activeSection === 'cash' || activeSection === 'paymentReceipts'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <salesGroup.icon className="h-4 w-4" />
                  <span>{salesGroup.label}</span>
                </div>
                {isSalesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {visibleSalesItems.map((item) => renderMenuItem(item, true))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Items individuales */}
        {visibleItems.map((item) => renderMenuItem(item))}

        {/* Grupo Gastos (desplegable) */}
        {visibleExpenseItems.length > 0 && (
          <Collapsible open={isExpensesOpen} onOpenChange={setIsExpensesOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  activeSection === 'expenses' || activeSection === 'expensePayments'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <expensesGroup.icon className="h-4 w-4" />
                  <span>{expensesGroup.label}</span>
                </div>
                {isExpensesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {visibleExpenseItems.map((item) => renderMenuItem(item, true))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Separador */}
        <div className="my-3 border-t border-border" />

        {/* Ajustes al final */}
        {renderMenuItem(settingsItem)}

        {/* Administración (solo para admins) */}
        {isAdmin && (
          <>
            <div className="my-3 border-t border-border" />
            {renderMenuItem(adminItem)}
          </>
        )}
      </nav>
    </aside>
  );
};
