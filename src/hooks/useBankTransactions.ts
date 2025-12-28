import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'fee' | 'adjustment';
export type SourceModule = 'POS_CLOSURE' | 'INVOICE' | 'EXPENSE' | 'MANUAL';

export interface BankTransaction {
  id: string;
  company_id: string;
  bank_account_id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  source_module: SourceModule | null;
  source_id: string | null;
  reference_number: string | null;
  created_at: string;
  created_by: string | null;
  bank_account?: {
    name: string;
    bank_name: string | null;
  };
}

export interface CreateBankTransactionData {
  companyId: string;
  bankAccountId: string;
  type: TransactionType;
  amount: number;
  date?: string;
  description?: string;
  sourceModule?: SourceModule;
  sourceId?: string;
  referenceNumber?: string;
}

export interface BankTransactionFilters {
  bankAccountId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  sourceModule?: SourceModule;
}

export const useBankTransactions = (companyId?: string, filters?: BankTransactionFilters) => {
  return useQuery({
    queryKey: ['bank-transactions', companyId, filters],
    queryFn: async (): Promise<BankTransaction[]> => {
      let query = supabase
        .from('bank_transactions')
        .select(`
          *,
          bank_account:bank_accounts(name, bank_name)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (filters?.bankAccountId) {
        query = query.eq('bank_account_id', filters.bankAccountId);
      }

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate.toISOString().split('T')[0]);
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate.toISOString().split('T')[0]);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.sourceModule) {
        query = query.eq('source_module', filters.sourceModule);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return (data || []) as BankTransaction[];
    },
    enabled: !!companyId,
  });
};

export const useCreateBankTransaction = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankTransactionData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: transaction, error } = await supabase
        .from('bank_transactions')
        .insert({
          company_id: data.companyId,
          bank_account_id: data.bankAccountId,
          type: data.type,
          amount: data.amount,
          date: data.date || new Date().toISOString().split('T')[0],
          description: data.description || null,
          source_module: data.sourceModule || 'MANUAL',
          source_id: data.sourceId || null,
          reference_number: data.referenceNumber || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account', variables.bankAccountId] });
      
      // Solo mostrar toast si es transacción manual
      if (!variables.sourceModule || variables.sourceModule === 'MANUAL') {
        toast({
          title: "Transacción registrada",
          description: "El movimiento bancario se ha registrado exitosamente",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al registrar transacción",
        description: error.message || "No se pudo registrar el movimiento bancario",
      });
    },
  });
};

export const useDeleteBankTransaction = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: "Transacción eliminada",
        description: "El movimiento bancario se ha eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar transacción",
        description: error.message || "No se pudo eliminar el movimiento bancario",
      });
    },
  });
};

// Helper para crear transacción desde cierre de caja
export const createBankTransactionForCashClosure = async (
  companyId: string,
  branchId: string,
  cashClosureId: string,
  amount: number,
  date: string
): Promise<{ success: boolean; bankAccountId?: string; error?: string }> => {
  try {
    // Buscar regla de uso configurada
    const { data: rule, error: ruleError } = await supabase
      .from('bank_usage_rules')
      .select('bank_account_id')
      .eq('company_id', companyId)
      .eq('usage_type', 'CASH_CLOSURE')
      .eq('is_default', true)
      .or(`branch_id.eq.${branchId},branch_id.is.null`)
      .order('branch_id', { nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (ruleError) throw ruleError;

    if (!rule) {
      return { success: false, error: 'No hay cuenta bancaria configurada para cierres de caja' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Crear transacción bancaria
    const { error: txError } = await supabase
      .from('bank_transactions')
      .insert({
        company_id: companyId,
        bank_account_id: rule.bank_account_id,
        type: 'deposit',
        amount,
        date,
        description: `Depósito cierre de caja #${cashClosureId.slice(0, 8)}`,
        source_module: 'POS_CLOSURE',
        source_id: cashClosureId,
        created_by: user?.id || null,
      });

    if (txError) throw txError;

    return { success: true, bankAccountId: rule.bank_account_id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Helper para crear transacción desde cobro de factura
export const createBankTransactionForInvoice = async (
  companyId: string,
  branchId: string,
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  date: string
): Promise<{ success: boolean; bankAccountId?: string; error?: string }> => {
  try {
    // Buscar regla de uso configurada
    const { data: rule, error: ruleError } = await supabase
      .from('bank_usage_rules')
      .select('bank_account_id')
      .eq('company_id', companyId)
      .eq('usage_type', 'INVOICE_COLLECTION')
      .eq('is_default', true)
      .or(`branch_id.eq.${branchId},branch_id.is.null`)
      .order('branch_id', { nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (ruleError) throw ruleError;

    if (!rule) {
      return { success: false, error: 'No hay cuenta bancaria configurada para cobros de facturas' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Crear transacción bancaria
    const { error: txError } = await supabase
      .from('bank_transactions')
      .insert({
        company_id: companyId,
        bank_account_id: rule.bank_account_id,
        type: 'deposit',
        amount,
        date,
        description: `Cobro factura #${invoiceNumber}`,
        source_module: 'INVOICE',
        source_id: invoiceId,
        created_by: user?.id || null,
      });

    if (txError) throw txError;

    return { success: true, bankAccountId: rule.bank_account_id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Helper para crear transacción desde pago de gasto
export const createBankTransactionForExpense = async (
  companyId: string,
  branchId: string,
  expenseId: string,
  amount: number,
  date: string,
  description: string
): Promise<{ success: boolean; bankAccountId?: string; error?: string }> => {
  try {
    // Buscar regla de uso configurada
    const { data: rule, error: ruleError } = await supabase
      .from('bank_usage_rules')
      .select('bank_account_id')
      .eq('company_id', companyId)
      .eq('usage_type', 'EXPENSE_PAYMENT')
      .eq('is_default', true)
      .or(`branch_id.eq.${branchId},branch_id.is.null`)
      .order('branch_id', { nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (ruleError) throw ruleError;

    if (!rule) {
      return { success: false, error: 'No hay cuenta bancaria configurada para pagos de gastos' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Crear transacción bancaria
    const { error: txError } = await supabase
      .from('bank_transactions')
      .insert({
        company_id: companyId,
        bank_account_id: rule.bank_account_id,
        type: 'withdrawal',
        amount,
        date,
        description: `Pago gasto: ${description}`,
        source_module: 'EXPENSE',
        source_id: expenseId,
        created_by: user?.id || null,
      });

    if (txError) throw txError;

    return { success: true, bankAccountId: rule.bank_account_id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
