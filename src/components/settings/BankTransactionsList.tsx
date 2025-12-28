import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  Filter,
  Landmark,
  Plus,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useBankTransactions, useCreateBankTransaction, TransactionType } from '@/hooks/useBankTransactions';

interface BankTransactionsListProps {
  companyId: string;
}

const transactionTypeLabels: Record<TransactionType, string> = {
  deposit: 'Depósito',
  withdrawal: 'Retiro',
  transfer_in: 'Transferencia entrada',
  transfer_out: 'Transferencia salida',
  fee: 'Comisión',
  adjustment: 'Ajuste',
};

const sourceModuleLabels: Record<string, string> = {
  POS_CLOSURE: 'Cierre de Caja',
  INVOICE: 'Factura',
  EXPENSE: 'Gasto',
  MANUAL: 'Manual',
};

export const BankTransactionsList: React.FC<BankTransactionsListProps> = ({
  companyId,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: accounts } = useBankAccounts(companyId);
  const { data: transactions, isLoading } = useBankTransactions(companyId, {
    bankAccountId: selectedAccountId !== 'all' ? selectedAccountId : undefined,
  });
  const createTransaction = useCreateBankTransaction();

  // Form state
  const [formData, setFormData] = useState({
    bankAccountId: '',
    type: 'deposit' as TransactionType,
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankAccountId || !formData.amount) return;

    await createTransaction.mutateAsync({
      companyId,
      bankAccountId: formData.bankAccountId,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      date: formData.date,
      sourceModule: 'MANUAL',
    });

    setIsFormOpen(false);
    setFormData({
      bankAccountId: '',
      type: 'deposit',
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const isCredit = (type: TransactionType) => 
    type === 'deposit' || type === 'transfer_in';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Movimientos Bancarios
            </CardTitle>
            <CardDescription>
              Historial de transacciones de todas las cuentas
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay movimientos
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Los movimientos aparecerán aquí cuando realices transacciones
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isCredit(tx.type) 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {isCredit(tx.type) ? (
                      <ArrowDownCircle className="h-5 w-5" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate">
                        {tx.description || transactionTypeLabels[tx.type]}
                      </h4>
                      {tx.source_module && (
                        <Badge variant="secondary" className="text-xs">
                          {sourceModuleLabels[tx.source_module] || tx.source_module}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.bank_account?.name || 'Cuenta desconocida'}
                      {' • '}
                      {format(new Date(tx.date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
                      isCredit(tx.type) ? 'text-primary' : 'text-destructive'
                    }`}>
                      {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transactionTypeLabels[tx.type]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nueva Transacción */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento Bancario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cuenta bancaria *</Label>
              <Select
                value={formData.bankAccountId}
                onValueChange={(value) => setFormData({ ...formData, bankAccountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.bank_name && ` (${account.bank_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de movimiento *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Depósito</SelectItem>
                  <SelectItem value="withdrawal">Retiro</SelectItem>
                  <SelectItem value="transfer_in">Transferencia entrada</SelectItem>
                  <SelectItem value="transfer_out">Transferencia salida</SelectItem>
                  <SelectItem value="fee">Comisión bancaria</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                placeholder="Descripción del movimiento"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTransaction.isPending || !formData.bankAccountId || !formData.amount}
              >
                {createTransaction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
