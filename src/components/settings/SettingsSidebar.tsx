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
  Landmark,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled } from '@/config/environment';
import { User, EnabledModules } from '@/types/pos';
import { SettingsSection } from '@/pages/Settings';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Logo } from '@/components/ui/logo';

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
    id: 'treasury',
    label: 'Tesorería',
    icon: Landmark,
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: Users,
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    permission: 'view_reports',
    feature: 'advancedReporting',
  },
  {
    id: 'onlineStore',
    label: 'Tienda Online',
    icon: Store,
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
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
          isNested && 'pl-9',
          isActive
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
        )}
      >
        <Icon className={cn("h-4 w-4", isActive && "text-[#4AB7C6]")} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* 1. Dashboard */}
        {renderMenuItem(dashboardItem)}

        {/* 2. Grupo Ventas (desplegable) */}
        {visibleSalesItems.length > 0 && (
          <Collapsible open={isSalesOpen} onOpenChange={setIsSalesOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  activeSection === 'standardInvoicing' || activeSection === 'cash' || activeSection === 'paymentReceipts'
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <div className="flex items-center gap-3">
                  <salesGroup.icon className="h-4 w-4" />
                  <span>{salesGroup.label}</span>
                </div>
                {isSalesOpen ? (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {visibleSalesItems.map((item) => renderMenuItem(item, true))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* 3. Grupo Gastos (desplegable) */}
        {visibleExpenseItems.length > 0 && (
          <Collapsible open={isExpensesOpen} onOpenChange={setIsExpensesOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  activeSection === 'expenses' || activeSection === 'expensePayments'
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <div className="flex items-center gap-3">
                  <expensesGroup.icon className="h-4 w-4" />
                  <span>{expensesGroup.label}</span>
                </div>
                {isExpensesOpen ? (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {visibleExpenseItems.map((item) => renderMenuItem(item, true))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* 4-8. Items individuales (Productos, Tesorería, Clientes, Reportes, Tienda Online) */}
        {visibleItems.map((item) => renderMenuItem(item))}

        {/* Separador */}
        <div className="my-4 border-t border-zinc-200 dark:border-zinc-700" />

        {/* 9. Ajustes */}
        {renderMenuItem(settingsItem)}

        {/* 10. Administración (solo para admins) */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-zinc-200 dark:border-zinc-700" />
            {renderMenuItem(adminItem)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-400">
          Gestiona tu negocio
        </p>
      </div>
    </aside>
  );
};
