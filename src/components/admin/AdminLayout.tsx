import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building2, Users, Package, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { AdminCompaniesTab } from './AdminCompaniesTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminPlansTab } from './AdminPlansTab';
import { AdminSubscriptionsTab } from './AdminSubscriptionsTab';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'companies', label: 'Empresas', icon: Building2 },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'plans', label: 'Planes', icon: Package },
  { id: 'subscriptions', label: 'Suscripciones', icon: CreditCard },
] as const;

type TabId = typeof tabs[number]['id'];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('companies');

  const getTabTitle = () => {
    switch (activeTab) {
      case 'companies': return 'Empresas';
      case 'users': return 'Usuarios';
      case 'plans': return 'Planes';
      case 'subscriptions': return 'Suscripciones';
      default: return 'Administración';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800">
          <Logo width={100} height={32} />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-[#C0D860]/15 to-[#4AB7C6]/15 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-[#4AB7C6]")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {getTabTitle()}
          </h1>
          <ThemeToggle />
        </header>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'companies' && <AdminCompaniesTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'plans' && <AdminPlansTab />}
          {activeTab === 'subscriptions' && <AdminSubscriptionsTab />}
        </div>
      </main>
    </div>
  );
};
