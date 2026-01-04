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
import { usePaymentReceipts, useDeletePaymentReceipt } from '@/hooks/usePaymentReceipts';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { usePOS } from '@/contexts/POSContext';
import { Banknote, Search, Trash2, Calendar, Filter } from 'lucide-react';

export const PaymentReceiptsList: React.FC = () => {
  const { authState } = usePOS();
  const companyId = authState.selectedCompany?.id || '';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bankAccountFilter, setBankAccountFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: receipts = [], isLoading } = usePaymentReceipts({
    companyId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    bankAccountId: bankAccountFilter !== 'all' ? bankAccountFilter : undefined,
  });

  const { data: bankAccounts = [] } = useBankAccounts(companyId);
  const deleteReceipt = useDeletePaymentReceipt();

  const filteredReceipts = receipts.filter((receipt) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      receipt.receiptNumber.toLowerCase().includes(query) ||
      receipt.invoice?.invoiceNumber.toLowerCase().includes(query) ||
      receipt.invoice?.customer?.name.toLowerCase().includes(query) ||
      receipt.reference?.toLowerCase().includes(query)
    );
  });

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReceipt.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (!companyId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Selecciona una empresa para ver los pagos recibidos
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Pagos Recibidos</h2>
        <p className="text-muted-foreground">
          Historial de cobros de facturas
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Total Recaudado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-muted-foreground">
            {filteredReceipts.length} recibos
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
                placeholder="Buscar por número, factura, cliente..."
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
          ) : filteredReceipts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron pagos recibidos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell>
                      {receipt.invoice?.invoiceNumber || '-'}
                    </TableCell>
                    <TableCell>
                      {receipt.invoice?.customer 
                        ? `${receipt.invoice.customer.name} ${receipt.invoice.customer.lastName || ''}`.trim()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {receipt.bankAccount?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(receipt.paymentDate), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(receipt.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receipt.reference || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(receipt.id)}
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
            <AlertDialogTitle>¿Eliminar recibo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el recibo y la transacción bancaria asociada.
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
