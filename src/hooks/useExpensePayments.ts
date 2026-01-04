import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExpensePayment {
  id: string;
  companyId: string;
  branchId: string;
  paymentNumber: string;
  prefix: string;
  sequenceNumber: number;
  expenseId: string;
  bankAccountId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  // Joined data
  expense?: {
    description: string;
    amount: number;
    category: string | null;
  };
  bankAccount?: {
    name: string;
    bankName: string | null;
  };
}

export interface CreateExpensePaymentData {
  companyId: string;
  branchId: string;
  expenseId: string;
  bankAccountId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  prefix?: string;
}

interface ExpensePaymentFilters {
  companyId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  bankAccountId?: string;
}

export const useExpensePayments = (filters: ExpensePaymentFilters = {}) => {
  return useQuery({
    queryKey: ['expense-payments', filters],
    queryFn: async (): Promise<ExpensePayment[]> => {
      let query = supabase
        .from('expense_payments')
        .select(`
          *,
          expense:expenses(description, amount, category),
          bank_account:bank_accounts(name, bank_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.companyId) {
        query = query.eq('company_id', filters.companyId);
      }
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters.startDate) {
        query = query.gte('payment_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('payment_date', filters.endDate);
      }
      if (filters.bankAccountId) {
        query = query.eq('bank_account_id', filters.bankAccountId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        branchId: row.branch_id,
        paymentNumber: row.payment_number,
        prefix: row.prefix,
        sequenceNumber: row.sequence_number,
        expenseId: row.expense_id,
        bankAccountId: row.bank_account_id,
        amount: Number(row.amount),
        paymentDate: row.payment_date,
        paymentMethod: row.payment_method,
        reference: row.reference,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at,
        expense: row.expense ? {
          description: row.expense.description,
          amount: Number(row.expense.amount),
          category: row.expense.category,
        } : undefined,
        bankAccount: row.bank_account ? {
          name: row.bank_account.name,
          bankName: row.bank_account.bank_name,
        } : undefined,
      }));
    },
    enabled: !!filters.companyId,
  });
};

export const useExpensePaymentsByExpense = (expenseId: string | undefined) => {
  return useQuery({
    queryKey: ['expense-payments', 'expense', expenseId],
    queryFn: async (): Promise<ExpensePayment[]> => {
      if (!expenseId) return [];

      const { data, error } = await supabase
        .from('expense_payments')
        .select(`
          *,
          bank_account:bank_accounts(name, bank_name)
        `)
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        branchId: row.branch_id,
        paymentNumber: row.payment_number,
        prefix: row.prefix,
        sequenceNumber: row.sequence_number,
        expenseId: row.expense_id,
        bankAccountId: row.bank_account_id,
        amount: Number(row.amount),
        paymentDate: row.payment_date,
        paymentMethod: row.payment_method,
        reference: row.reference,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at,
        bankAccount: row.bank_account ? {
          name: row.bank_account.name,
          bankName: row.bank_account.bank_name,
        } : undefined,
      }));
    },
    enabled: !!expenseId,
  });
};

export const useCreateExpensePayment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpensePaymentData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Generate payment number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_expense_payment_number', {
          p_company_id: data.companyId,
          p_prefix: data.prefix || 'CE'
        });

      if (numberError) throw numberError;
      if (!numberData || numberData.length === 0) throw new Error('Error generando número de comprobante');

      const { payment_number, sequence_number } = numberData[0];

      // Create expense payment
      const { data: payment, error: paymentError } = await supabase
        .from('expense_payments')
        .insert({
          company_id: data.companyId,
          branch_id: data.branchId,
          payment_number,
          prefix: data.prefix || 'CE',
          sequence_number,
          expense_id: data.expenseId,
          bank_account_id: data.bankAccountId,
          amount: data.amount,
          payment_date: data.paymentDate || new Date().toISOString().split('T')[0],
          payment_method: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create bank transaction
      const { error: transactionError } = await supabase
        .from('bank_transactions')
        .insert({
          company_id: data.companyId,
          bank_account_id: data.bankAccountId,
          type: 'withdrawal',
          amount: data.amount,
          date: data.paymentDate || new Date().toISOString().split('T')[0],
          description: `Comprobante de egreso ${payment_number}`,
          source_module: 'expense_payment',
          source_id: payment.id,
          reference_number: data.reference,
          created_by: user.id,
        });

      if (transactionError) throw transactionError;

      // Update expense payment_status
      const { data: expensePayments } = await supabase
        .from('expense_payments')
        .select('amount')
        .eq('expense_id', data.expenseId);

      const totalPaid = (expensePayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

      const { data: expense } = await supabase
        .from('expenses')
        .select('amount')
        .eq('id', data.expenseId)
        .single();

      if (expense) {
        const newStatus = totalPaid >= Number(expense.amount) ? 'paid' : 'partial';
        await supabase
          .from('expenses')
          .update({ payment_status: newStatus })
          .eq('id', data.expenseId);
      }

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al registrar pago",
        description: error.message || "No se pudo registrar el pago",
      });
    },
  });
};

export const useDeleteExpensePayment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      // First delete related bank transaction
      await supabase
        .from('bank_transactions')
        .delete()
        .eq('source_module', 'expense_payment')
        .eq('source_id', paymentId);

      const { error } = await supabase
        .from('expense_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Pago eliminado",
        description: "El comprobante ha sido eliminado",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar pago",
        description: error.message || "No se pudo eliminar el pago",
      });
    },
  });
};
