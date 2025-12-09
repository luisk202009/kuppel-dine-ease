import React from 'react';
import { Settings, Users, Receipt, BarChart3, CreditCard, DollarSign, Package, Wallet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled } from '@/config/environment';
import { User, EnabledModules } from '@/types/pos';
import { SettingsSection } from '@/pages/Settings';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  user: User | null;
  enabledModules?: EnabledModules | null;
}

interface SidebarItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  permission?: string;
  feature?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'settings',
    label: 'Ajustes',
    icon: Settings,
  },
  {
    id: 'subscriptions',
    label: 'Suscripciones',
    icon: Wallet,
  },
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
    id: 'orders',
    label: 'Órdenes',
    icon: Receipt,
    feature: 'orderHistory',
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    permission: 'view_reports',
    feature: 'advancedReporting',
  },
  {
    id: 'expenses',
    label: 'Gastos',
    icon: CreditCard,
    permission: 'view_expenses',
  },
  {
    id: 'cash',
    label: 'Caja',
    icon: DollarSign,
    permission: 'view_cash',
  },
  {
    id: 'standardInvoicing',
    label: 'Facturación',
    icon: FileText,
  },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
  user,
  enabledModules,
}) => {
  const isItemVisible = (item: SidebarItem): boolean => {
    // Check permission
    if (item.permission && !hasPermission(user, item.permission as any)) {
      return false;
    }
    // Check feature flag
    if (item.feature && !isFeatureEnabled(item.feature as any)) {
      return false;
    }
    // Check if module is enabled for this company
    if (enabledModules && enabledModules[item.id] === false) {
      return false;
    }
    return true;
  };

  const visibleItems = sidebarItems.filter(isItemVisible);

  return (
    <aside className="w-64 bg-card border-r border-border overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-1">Configuración</h2>
        <p className="text-xs text-muted-foreground">Gestiona tu sistema POS</p>
      </div>

      <nav className="px-2 pb-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
