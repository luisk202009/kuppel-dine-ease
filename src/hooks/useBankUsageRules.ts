import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UsageType = 'CASH_CLOSURE' | 'INVOICE_COLLECTION' | 'EXPENSE_PAYMENT';

export interface BankUsageRule {
  id: string;
  company_id: string;
  branch_id: string | null;
  usage_type: UsageType;
  bank_account_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  bank_account?: {
    id: string;
    name: string;
    bank_name: string | null;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface SetBankUsageRuleData {
  companyId: string;
  branchId?: string | null;
  usageType: UsageType;
  bankAccountId: string;
}

export const useBankUsageRules = (companyId?: string, branchId?: string) => {
  return useQuery({
    queryKey: ['bank-usage-rules', companyId, branchId],
    queryFn: async (): Promise<BankUsageRule[]> => {
      let query = supabase
        .from('bank_usage_rules')
        .select(`
          *,
          bank_account:bank_accounts(id, name, bank_name),
          branch:branches(id, name)
        `)
        .eq('is_default', true)
        .order('usage_type');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (branchId !== undefined) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as BankUsageRule[];
    },
    enabled: !!companyId,
  });
};

export const useBankUsageRuleForType = (companyId?: string, branchId?: string, usageType?: UsageType) => {
  return useQuery({
    queryKey: ['bank-usage-rule', companyId, branchId, usageType],
    queryFn: async (): Promise<BankUsageRule | null> => {
      if (!companyId || !usageType) return null;

      const { data, error } = await supabase
        .from('bank_usage_rules')
        .select(`
          *,
          bank_account:bank_accounts(id, name, bank_name)
        `)
        .eq('company_id', companyId)
        .eq('usage_type', usageType)
        .eq('is_default', true)
        .or(`branch_id.eq.${branchId},branch_id.is.null`)
        .order('branch_id', { nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BankUsageRule | null;
    },
    enabled: !!companyId && !!usageType,
  });
};

export const useSetBankUsageRule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SetBankUsageRuleData) => {
      // Primero, eliminar regla existente para este tipo/branch
      await supabase
        .from('bank_usage_rules')
        .delete()
        .eq('company_id', data.companyId)
        .eq('usage_type', data.usageType)
        .eq('is_default', true)
        .or(data.branchId ? `branch_id.eq.${data.branchId}` : 'branch_id.is.null');

      // Crear nueva regla
      const { data: rule, error } = await supabase
        .from('bank_usage_rules')
        .insert({
          company_id: data.companyId,
          branch_id: data.branchId || null,
          usage_type: data.usageType,
          bank_account_id: data.bankAccountId,
          is_default: true,
        })
        .select()
        .single();

      if (error) throw error;
      return rule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-usage-rules'] });
      queryClient.invalidateQueries({ queryKey: ['bank-usage-rule'] });
      toast({
        title: "Configuración guardada",
        description: "La regla de tesorería se ha actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al guardar configuración",
        description: error.message || "No se pudo actualizar la regla de tesorería",
      });
    },
  });
};

export const useDeleteBankUsageRule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('bank_usage_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-usage-rules'] });
      queryClient.invalidateQueries({ queryKey: ['bank-usage-rule'] });
      toast({
        title: "Regla eliminada",
        description: "La regla de tesorería se ha eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar regla",
        description: error.message || "No se pudo eliminar la regla de tesorería",
      });
    },
  });
};

// Obtener etiquetas amigables para los tipos de uso
export const getUsageTypeLabel = (type: UsageType): string => {
  const labels: Record<UsageType, string> = {
    CASH_CLOSURE: 'Cierres de Caja',
    INVOICE_COLLECTION: 'Cobro de Facturas',
    EXPENSE_PAYMENT: 'Pago de Gastos',
  };
  return labels[type];
};

export const getUsageTypeDescription = (type: UsageType): string => {
  const descriptions: Record<UsageType, string> = {
    CASH_CLOSURE: 'Cuenta donde se deposita el dinero al cerrar la caja',
    INVOICE_COLLECTION: 'Cuenta donde se acreditan los cobros de facturas por banco',
    EXPENSE_PAYMENT: 'Cuenta desde donde se pagan los gastos por banco',
  };
  return descriptions[type];
};

export const ALL_USAGE_TYPES: UsageType[] = ['CASH_CLOSURE', 'INVOICE_COLLECTION', 'EXPENSE_PAYMENT'];
