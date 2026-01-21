import React, { useState } from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { useBankAccounts, BankAccount } from '@/hooks/useBankAccounts';
import { useCreateBankTransfer } from '@/hooks/useBankTransactions';

interface BankTransferModalProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  companyId,
  open,
  onOpenChange,
}) => {
  const { data: accounts } = useBankAccounts(companyId);
  const createTransfer = useCreateBankTransfer();

  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const activeAccounts = accounts?.filter(a => a.is_active) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) return;

    await createTransfer.mutateAsync({
      companyId,
      fromAccountId: formData.fromAccountId,
      toAccountId: formData.toAccountId,
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      date: formData.date,
    });

    onOpenChange(false);
    setFormData({
      fromAccountId: '',
      toAccountId: '',
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const fromAccount = activeAccounts.find(a => a.id === formData.fromAccountId);
  const toAccount = activeAccounts.find(a => a.id === formData.toAccountId);

  const isValid = 
    formData.fromAccountId && 
    formData.toAccountId && 
    formData.fromAccountId !== formData.toAccountId &&
    parseFloat(formData.amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferencia entre Cuentas
          </DialogTitle>
          <DialogDescription>
            Mueve fondos de una cuenta bancaria a otra
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cuenta origen *</Label>
            <Select
              value={formData.fromAccountId}
              onValueChange={(value) => setFormData({ ...formData, fromAccountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona cuenta origen" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts
                  .filter(a => a.id !== formData.toAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.bank_name && ` (${account.bank_name})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cuenta destino *</Label>
            <Select
              value={formData.toAccountId}
              onValueChange={(value) => setFormData({ ...formData, toAccountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona cuenta destino" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts
                  .filter(a => a.id !== formData.fromAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.bank_name && ` (${account.bank_name})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {formData.fromAccountId && formData.toAccountId && (
            <div className="flex items-center justify-center gap-3 py-2 px-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Desde</p>
                <p className="font-medium text-sm">{fromAccount?.name}</p>
              </div>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Hacia</p>
                <p className="font-medium text-sm">{toAccount?.name}</p>
              </div>
            </div>
          )}

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
              placeholder="Concepto de la transferencia"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createTransfer.isPending || !isValid}
            >
              {createTransfer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Transferir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
