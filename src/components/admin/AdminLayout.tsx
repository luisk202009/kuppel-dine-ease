import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building2, Users, Package, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { AdminCompaniesTab } from './AdminCompaniesTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminPlansTab } from './AdminPlansTab';
import { AdminSubscriptionsTab } from './AdminSubscriptionsTab';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'plans' | 'subscriptions'>('companies');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo width={120} height={40} />
            <div className="hidden md:block border-l border-border pl-4">
              <h1 className="text-lg font-bold text-foreground">
                Panel de Administración
              </h1>
              <p className="text-sm text-muted-foreground">
                Herramientas internas para gestionar empresas y usuarios de Kuppel POS
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Volver al POS
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'companies' | 'users' | 'plans' | 'subscriptions')}>
          <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
            <TabsTrigger value="companies" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Planes</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Suscripciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <AdminCompaniesTab />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="plans">
            <AdminPlansTab />
          </TabsContent>

          <TabsContent value="subscriptions">
            <AdminSubscriptionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
