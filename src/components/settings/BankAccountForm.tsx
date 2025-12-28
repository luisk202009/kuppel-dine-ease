import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useBankAccount, useCreateBankAccount, useUpdateBankAccount } from '@/hooks/useBankAccounts';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.enum(['checking', 'savings']),
  currency: z.string().default('COP'),
  initialBalance: z.number().min(0, 'El saldo debe ser mayor o igual a 0'),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface BankAccountFormProps {
  companyId: string;
  accountId?: string;
  onClose: () => void;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
  companyId,
  accountId,
  onClose,
}) => {
  const { data: account, isLoading: isLoadingAccount } = useBankAccount(accountId);
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();

  const isEditing = !!accountId;
  const isLoading = createAccount.isPending || updateAccount.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      bankName: '',
      accountNumber: '',
      accountType: 'checking',
      currency: 'COP',
      initialBalance: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (account && isEditing) {
      reset({
        name: account.name,
        bankName: account.bank_name || '',
        accountNumber: account.account_number || '',
        accountType: account.account_type as 'checking' | 'savings',
        currency: account.currency,
        initialBalance: account.initial_balance,
        isActive: account.is_active,
      });
    }
  }, [account, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && accountId) {
        await updateAccount.mutateAsync({
          id: accountId,
          name: data.name,
          bankName: data.bankName || undefined,
          accountNumber: data.accountNumber || undefined,
          accountType: data.accountType,
          currency: data.currency,
          isActive: data.isActive,
        });
      } else {
        await createAccount.mutateAsync({
          companyId,
          name: data.name,
          bankName: data.bankName || undefined,
          accountNumber: data.accountNumber || undefined,
          accountType: data.accountType,
          currency: data.currency,
          initialBalance: data.initialBalance,
        });
      }
      onClose();
    } catch (error) {
      // El error ya se maneja en los hooks
    }
  };

  const accountType = watch('accountType');
  const isActive = watch('isActive');

  if (isEditing && isLoadingAccount) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la cuenta *</Label>
        <Input
          id="name"
          placeholder="Ej: Cuenta Principal"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankName">Nombre del banco</Label>
        <Input
          id="bankName"
          placeholder="Ej: Bancolombia"
          {...register('bankName')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber">Número de cuenta</Label>
        <Input
          id="accountNumber"
          placeholder="Ej: 1234567890"
          {...register('accountNumber')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de cuenta</Label>
          <Select
            value={accountType}
            onValueChange={(value) => setValue('accountType', value as 'checking' | 'savings')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Corriente</SelectItem>
              <SelectItem value="savings">Ahorros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Moneda</Label>
          <Select
            value={watch('currency')}
            onValueChange={(value) => setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COP">COP (Peso Colombiano)</SelectItem>
              <SelectItem value="USD">USD (Dólar)</SelectItem>
              <SelectItem value="EUR">EUR (Euro)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="initialBalance">Saldo inicial</Label>
          <Input
            id="initialBalance"
            type="number"
            step="0.01"
            placeholder="0"
            {...register('initialBalance', { valueAsNumber: true })}
          />
          {errors.initialBalance && (
            <p className="text-sm text-destructive">{errors.initialBalance.message}</p>
          )}
        </div>
      )}

      {isEditing && (
        <div className="flex items-center justify-between py-2">
          <div>
            <Label htmlFor="isActive">Cuenta activa</Label>
            <p className="text-sm text-muted-foreground">
              Las cuentas inactivas no aparecen en las listas de selección
            </p>
          </div>
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setValue('isActive', checked)}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  );
};
