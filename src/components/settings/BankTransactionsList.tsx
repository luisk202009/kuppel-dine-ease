import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import Papa from 'papaparse';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  Filter,
  Landmark,
  Plus,
  Loader2,
  ArrowRightLeft,
  Download,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Wallet
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { 
  useBankTransactions, 
  useCreateBankTransaction, 
  useBankTransactionTotals,
  TransactionType, 
  SourceModule 
} from '@/hooks/useBankTransactions';

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
  TRANSFER: 'Transferencia',
  payment_receipt: 'Recibo de Cobro',
  expense_payment: 'Pago de Gasto',
};

const transactionTypeOptions: { value: TransactionType; label: string }[] = [
  { value: 'deposit', label: 'Depósitos' },
  { value: 'withdrawal', label: 'Retiros' },
  { value: 'transfer_in', label: 'Transferencias entrada' },
  { value: 'transfer_out', label: 'Transferencias salida' },
  { value: 'fee', label: 'Comisiones' },
  { value: 'adjustment', label: 'Ajustes' },
];

const sourceModuleOptions: { value: SourceModule | string; label: string }[] = [
  { value: 'POS_CLOSURE', label: 'Cierre de Caja' },
  { value: 'INVOICE', label: 'Facturas' },
  { value: 'EXPENSE', label: 'Gastos' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'TRANSFER', label: 'Transferencias' },
  { value: 'payment_receipt', label: 'Recibos de Cobro' },
  { value: 'expense_payment', label: 'Pagos de Gasto' },
];

export const BankTransactionsList: React.FC<BankTransactionsListProps> = ({
  companyId,
}) => {
  // Filter states
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: accounts } = useBankAccounts(companyId);
  const { data: transactions, isLoading } = useBankTransactions(companyId, {
    bankAccountId: selectedAccountId !== 'all' ? selectedAccountId : undefined,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    type: selectedType !== 'all' ? selectedType as TransactionType : undefined,
    sourceModule: selectedSource !== 'all' ? selectedSource as SourceModule : undefined,
  });
  const createTransaction = useCreateBankTransaction();

  // KPI totals
  const { totalEntries, totalExits, netBalance } = useBankTransactionTotals(transactions);

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

  const handleResetFilters = () => {
    setSelectedAccountId('all');
    setSelectedType('all');
    setSelectedSource('all');
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;

    const csvData = transactions.map(tx => ({
      Fecha: format(new Date(tx.date), 'dd/MM/yyyy', { locale: es }),
      Cuenta: tx.bank_account?.name || 'Desconocida',
      Tipo: transactionTypeLabels[tx.type],
      Descripción: tx.description || '-',
      Monto: isCredit(tx.type) ? tx.amount : -tx.amount,
      Origen: sourceModuleLabels[tx.source_module || 'MANUAL'] || tx.source_module,
    }));

    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ';',
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimientos-bancarios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isCredit = (type: TransactionType) => 
    type === 'deposit' || type === 'transfer_in';

  const hasActiveFilters = 
    selectedAccountId !== 'all' || 
    selectedType !== 'all' || 
    selectedSource !== 'all';

  return (
    <>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-center justify-between">
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
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!transactions?.length}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[160px] h-9">
                <Landmark className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Cuenta" />
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

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[160px] h-9">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {transactionTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                {sourceModuleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-auto"
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Entradas</span>
              </div>
              <p className="text-2xl font-mono font-bold text-primary">
                {formatCurrency(totalEntries)}
              </p>
            </div>
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Salidas</span>
              </div>
              <p className="text-2xl font-mono font-bold text-destructive">
                {formatCurrency(totalExits)}
              </p>
            </div>
            <div className={`border rounded-lg p-4 ${
              netBalance >= 0 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-destructive/5 border-destructive/20'
            }`}>
              <div className={`flex items-center gap-2 mb-1 ${
                netBalance >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Saldo Neto</span>
              </div>
              <p className={`text-2xl font-mono font-bold ${
                netBalance >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
              </p>
            </div>
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
                    <p className={`font-mono font-semibold ${
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
