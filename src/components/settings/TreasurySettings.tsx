import React, { useState } from 'react';
import { Building2, Plus, Landmark, Settings2, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePOS } from '@/contexts/POSContext';
import { BankAccountsList } from './BankAccountsList';
import { BankAccountForm } from './BankAccountForm';
import { BankUsageRulesForm } from './BankUsageRulesForm';
import { BankTransactionsList } from './BankTransactionsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const TreasurySettings: React.FC = () => {
  const { authState } = usePOS();
  const companyId = authState.selectedCompany?.id;
  const branchId = authState.selectedBranch?.id;
  
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>();

  const handleEditAccount = (accountId: string) => {
    setEditingAccountId(accountId);
    setIsAccountFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsAccountFormOpen(false);
    setEditingAccountId(undefined);
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona una empresa para configurar tesorería</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tesorería y Bancos</h2>
          <p className="text-muted-foreground">
            Gestiona cuentas bancarias y configura las reglas de tesorería
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="accounts" className="gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Cuentas</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Movimientos</span>
          </TabsTrigger>
        </TabsList>

        {/* Cuentas Bancarias */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cuentas Bancarias
                </CardTitle>
                <CardDescription>
                  Registra las cuentas bancarias de tu empresa
                </CardDescription>
              </div>
              <Button onClick={() => setIsAccountFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Cuenta
              </Button>
            </CardHeader>
            <CardContent>
              <BankAccountsList 
                companyId={companyId} 
                onEdit={handleEditAccount}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reglas de Uso */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Reglas de Tesorería
              </CardTitle>
              <CardDescription>
                Configura qué cuenta bancaria se utiliza para cada tipo de operación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BankUsageRulesForm 
                companyId={companyId}
                branchId={branchId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de Transacciones */}
        <TabsContent value="transactions" className="space-y-4">
          <BankTransactionsList companyId={companyId} />
        </TabsContent>
      </Tabs>

      {/* Modal de Formulario de Cuenta */}
      <Dialog open={isAccountFormOpen} onOpenChange={setIsAccountFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccountId ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            </DialogTitle>
          </DialogHeader>
          <BankAccountForm
            companyId={companyId}
            accountId={editingAccountId}
            onClose={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
