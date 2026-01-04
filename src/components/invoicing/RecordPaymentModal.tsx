import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreatePaymentReceipt, usePaymentReceiptsByInvoice } from '@/hooks/usePaymentReceipts';
import { StandardInvoice } from '@/types/invoicing';
import { Loader2, Banknote } from 'lucide-react';
import { format } from 'date-fns';

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: StandardInvoice | null;
  companyId: string;
  branchId: string;
}

const PAYMENT_METHODS = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'check', label: 'Cheque' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' },
];

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  open,
  onOpenChange,
  invoice,
  companyId,
  branchId,
}) => {
  const { data: bankAccounts = [], isLoading: loadingAccounts } = useBankAccounts(companyId);
  const { data: existingPayments = [] } = usePaymentReceiptsByInvoice(invoice?.id);
  const createPayment = useCreatePaymentReceipt();

  const [bankAccountId, setBankAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate pending amount
  const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = invoice ? invoice.total - totalPaid : 0;

  useEffect(() => {
    if (open && pendingAmount > 0) {
      setAmount(pendingAmount.toString());
    }
  }, [open, pendingAmount]);

  useEffect(() => {
    if (bankAccounts.length > 0 && !bankAccountId) {
      setBankAccountId(bankAccounts[0].id);
    }
  }, [bankAccounts, bankAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !bankAccountId || !amount) return;

    await createPayment.mutateAsync({
      companyId,
      branchId,
      invoiceId: invoice.id,
      bankAccountId,
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod,
      reference: reference || undefined,
      notes: notes || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setBankAccountId('');
    setAmount('');
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('transfer');
    setReference('');
    setNotes('');
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Registrar Cobro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice info */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-1">
            <p className="text-sm font-medium">Factura: {invoice.invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(invoice.total)} | 
              Pendiente: {formatCurrency(pendingAmount)}
            </p>
            {invoice.customer && (
              <p className="text-sm text-muted-foreground">
                Cliente: {invoice.customer.name} {invoice.customer.lastName || ''}
              </p>
            )}
          </div>

          {/* Bank Account */}
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Cuenta Bancaria *</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} {account.bank_name ? `- ${account.bank_name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={pendingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Fecha de Pago *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Referencia</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Número de transferencia, cheque, etc."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createPayment.isPending || !bankAccountId || !amount || loadingAccounts}
            >
              {createPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Cobro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
