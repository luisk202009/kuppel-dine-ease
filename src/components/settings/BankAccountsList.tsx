import React from 'react';
import { Landmark, MoreVertical, Pencil, Trash2, Building2 } from 'lucide-react';
import { useAllBankAccounts, useDeleteBankAccount } from '@/hooks/useBankAccounts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface BankAccountsListProps {
  companyId: string;
  onEdit: (accountId: string) => void;
}

export const BankAccountsList: React.FC<BankAccountsListProps> = ({
  companyId,
  onEdit,
}) => {
  const { data: accounts, isLoading } = useAllBankAccounts(companyId);
  const deleteAccount = useDeleteBankAccount();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string = 'COP') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAccount.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No hay cuentas bancarias
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Agrega tu primera cuenta bancaria para empezar a registrar movimientos
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground truncate">
                  {account.name}
                </h4>
                {!account.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inactiva
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {account.bank_name || 'Sin banco especificado'}
                {account.account_number && ` • ${account.account_number}`}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-foreground">
                {formatCurrency(account.current_balance, account.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Saldo actual
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(account.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteId(account.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta bancaria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cuenta bancaria y todas sus transacciones asociadas.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
