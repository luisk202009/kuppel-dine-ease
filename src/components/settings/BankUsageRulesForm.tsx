import React from 'react';
import { Loader2, DollarSign, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useBankUsageRules, useSetBankUsageRule, ALL_USAGE_TYPES, getUsageTypeLabel, getUsageTypeDescription, UsageType } from '@/hooks/useBankUsageRules';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BankUsageRulesFormProps {
  companyId: string;
  branchId?: string;
}

const usageTypeIcons: Record<UsageType, React.ElementType> = {
  CASH_CLOSURE: DollarSign,
  INVOICE_COLLECTION: FileText,
  EXPENSE_PAYMENT: CreditCard,
};

export const BankUsageRulesForm: React.FC<BankUsageRulesFormProps> = ({
  companyId,
  branchId,
}) => {
  const { data: accounts, isLoading: isLoadingAccounts } = useBankAccounts(companyId);
  const { data: rules, isLoading: isLoadingRules } = useBankUsageRules(companyId, branchId);
  const setRule = useSetBankUsageRule();

  const getRuleForType = (usageType: UsageType) => {
    return rules?.find(r => r.usage_type === usageType);
  };

  const handleChange = async (usageType: UsageType, bankAccountId: string) => {
    if (bankAccountId === 'none') {
      // Por ahora solo permitimos cambiar, no eliminar
      return;
    }
    
    await setRule.mutateAsync({
      companyId,
      branchId: branchId || null,
      usageType,
      bankAccountId,
    });
  };

  const isLoading = isLoadingAccounts || isLoadingRules;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Primero debes crear al menos una cuenta bancaria para configurar las reglas de tesorería.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Selecciona la cuenta bancaria que se utilizará para cada tipo de operación.
        Estas configuraciones aplican a {branchId ? 'esta sucursal' : 'toda la empresa'}.
      </p>

      <div className="space-y-6">
        {ALL_USAGE_TYPES.map((usageType) => {
          const Icon = usageTypeIcons[usageType];
          const currentRule = getRuleForType(usageType);
          
          return (
            <div key={usageType} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="text-base">{getUsageTypeLabel(usageType)}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getUsageTypeDescription(usageType)}
                  </p>
                </div>
              </div>
              
              <Select
                value={currentRule?.bank_account_id || 'none'}
                onValueChange={(value) => handleChange(usageType, value)}
                disabled={setRule.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin cuenta asignada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Sin cuenta asignada
                  </SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.bank_name && ` (${account.bank_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota:</strong> Si no configuras una cuenta para un tipo de operación, 
          no se crearán movimientos bancarios automáticos para ese tipo.
        </AlertDescription>
      </Alert>
    </div>
  );
};
