import { Home, Settings, Users, Receipt, BarChart3, CreditCard, DollarSign, LogOut } from 'lucide-react';
import { usePOS } from '@/contexts/POSContext';
import { hasPermission } from '@/utils/permissions';
import { isFeatureEnabled } from '@/config/environment';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  const { state: sidebarState } = useSidebar();
  const { authState, logout } = usePOS();
  const collapsed = sidebarState === 'collapsed';

  const mainItems = [
    { id: 'dashboard', title: 'Inicio', icon: Home, permission: null },
    { id: 'settings', title: 'Ajustes', icon: Settings, permission: null },
  ];

  const managementItems = [
    { id: 'customers', title: 'Clientes', icon: Users, permission: null },
    { id: 'orders', title: 'Órdenes', icon: Receipt, permission: null, feature: 'orderHistory' as const },
    { id: 'reports', title: 'Reportes', icon: BarChart3, permission: 'view_reports' as const, feature: 'advancedReporting' as const },
  ];

  const financeItems = [
    { id: 'expenses', title: 'Gastos', icon: CreditCard, permission: 'view_expenses' as const },
    { id: 'cash', title: 'Cajas', icon: DollarSign, permission: 'view_cash' as const },
  ];

  const shouldShowItem = (item: { permission: any; feature?: 'orderHistory' | 'advancedReporting' }) => {
    if (item.feature && !isFeatureEnabled(item.feature)) return false;
    if (item.permission && !hasPermission(authState.user, item.permission)) return false;
    return true;
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">K</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm">Kuppel POS</span>
                <span className="text-xs text-muted-foreground">{authState.user?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onViewChange(item.id)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Management Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Gestión</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.filter(shouldShowItem).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onViewChange(item.id)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Section */}
        {financeItems.some(shouldShowItem) && (
          <>
            <Separator />
            <SidebarGroup>
              {!collapsed && <SidebarGroupLabel>Finanzas</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {financeItems.filter(shouldShowItem).map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={currentView === item.id}
                        onClick={() => onViewChange(item.id)}
                        tooltip={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip={collapsed ? 'Cerrar Sesión' : undefined}>
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
