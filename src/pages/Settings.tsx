import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { CustomerManager } from '@/components/pos/CustomerManager';
import { OrderHistory } from '@/components/pos/OrderHistory';
import { SalesReports } from '@/components/pos/SalesReports';
import { ExpenseManager } from '@/components/pos/ExpenseManager';
import { CashManager } from '@/components/pos/CashManager';
import { ProductsManager } from '@/components/pos/ProductsManager';
import { SubscriptionsPage } from '@/components/settings/SubscriptionsPage';
import { InvoicingDashboard } from '@/components/invoicing';

export type SettingsSection = 'settings' | 'subscriptions' | 'products' | 'customers' | 'orders' | 'reports' | 'expenses' | 'cash' | 'standardInvoicing';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { authState } = usePOS();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active section from URL params or default to 'settings'
  const activeSection = (searchParams.get('section') as SettingsSection) || 'settings';
  
  const handleSectionChange = (section: SettingsSection) => {
    setSearchParams({ section });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'settings':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Ajustes del Sistema</h2>
              <p className="text-muted-foreground">
                Configura la apariencia y comportamiento del sistema POS
              </p>
            </div>
            <SettingsPanel />
          </div>
        );
      
      case 'subscriptions':
        return <SubscriptionsPage />;
      
      case 'products':
        return <ProductsManager />;
      
      case 'customers':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Clientes</h2>
              <p className="text-muted-foreground">
                Administra la información de tus clientes
              </p>
            </div>
            <CustomerManager />
          </div>
        );
      
      case 'orders':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Historial de Órdenes</h2>
              <p className="text-muted-foreground">
                Consulta y gestiona todas las órdenes procesadas
              </p>
            </div>
            <OrderHistory />
          </div>
        );
      
      case 'reports':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Reportes de Ventas</h2>
              <p className="text-muted-foreground">
                Analiza el rendimiento y estadísticas del negocio
              </p>
            </div>
            <SalesReports />
          </div>
        );
      
      case 'expenses':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Gastos</h2>
              <p className="text-muted-foreground">
                Registra y administra los gastos del negocio
              </p>
            </div>
            <ExpenseManager />
          </div>
        );
      
      case 'cash':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Gestión de Caja</h2>
              <p className="text-muted-foreground">
                Controla la apertura, cierre y movimientos de caja
              </p>
            </div>
            <CashManager />
          </div>
        );
      
      case 'standardInvoicing':
        return (
          <InvoicingDashboard branchId={authState.selectedBranch?.id || ''} />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Header */}
      <SettingsHeader />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar */}
        <SettingsSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          user={authState.user}
          enabledModules={authState.enabledModules}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
