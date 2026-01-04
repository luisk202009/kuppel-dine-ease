import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useExpensePayments, useDeleteExpensePayment } from '@/hooks/useExpensePayments';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { usePOS } from '@/contexts/POSContext';
import { Wallet, Search, Trash2, Calendar, Filter } from 'lucide-react';

export const ExpensePaymentsList: React.FC = () => {
  const { authState } = usePOS();
  const companyId = authState.selectedCompany?.id || '';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bankAccountFilter, setBankAccountFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: payments = [], isLoading } = useExpensePayments({
    companyId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    bankAccountId: bankAccountFilter !== 'all' ? bankAccountFilter : undefined,
  });

  const { data: bankAccounts = [] } = useBankAccounts(companyId);
  const deletePayment = useDeleteExpensePayment();

  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.paymentNumber.toLowerCase().includes(query) ||
      payment.expense?.description.toLowerCase().includes(query) ||
      payment.expense?.category?.toLowerCase().includes(query) ||
      payment.reference?.toLowerCase().includes(query)
    );
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePayment.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (!companyId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Selecciona una empresa para ver los pagos realizados
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Pagos Realizados</h2>
        <p className="text-muted-foreground">
          Historial de pagos de gastos
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-destructive" />
            Total Pagado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-muted-foreground">
            {filteredPayments.length} comprobantes
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, gasto, categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Select value={bankAccountFilter} onValueChange={setBankAccountFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron pagos realizados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Gasto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.expense?.description || '-'}
                    </TableCell>
                    <TableCell>
                      {payment.expense?.category ? (
                        <Badge variant="outline">{payment.expense.category}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.bankAccount?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(payment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comprobante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el comprobante de egreso y la transacción bancaria asociada.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
