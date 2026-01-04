import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentReceipt {
  id: string;
  companyId: string;
  branchId: string;
  receiptNumber: string;
  prefix: string;
  sequenceNumber: number;
  invoiceId: string;
  bankAccountId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  // Joined data
  invoice?: {
    invoiceNumber: string;
    total: number;
    customerId: string | null;
    customer?: {
      name: string;
      lastName: string | null;
    } | null;
  };
  bankAccount?: {
    name: string;
    bankName: string | null;
  };
}

export interface CreatePaymentReceiptData {
  companyId: string;
  branchId: string;
  invoiceId: string;
  bankAccountId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  prefix?: string;
}

interface PaymentReceiptFilters {
  companyId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  bankAccountId?: string;
}

export const usePaymentReceipts = (filters: PaymentReceiptFilters = {}) => {
  return useQuery({
    queryKey: ['payment-receipts', filters],
    queryFn: async (): Promise<PaymentReceipt[]> => {
      let query = supabase
        .from('payment_receipts')
        .select(`
          *,
          invoice:standard_invoices(
            invoice_number,
            total,
            customer_id,
            customer:customers(name, last_name)
          ),
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
        receiptNumber: row.receipt_number,
        prefix: row.prefix,
        sequenceNumber: row.sequence_number,
        invoiceId: row.invoice_id,
        bankAccountId: row.bank_account_id,
        amount: Number(row.amount),
        paymentDate: row.payment_date,
        paymentMethod: row.payment_method,
        reference: row.reference,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at,
        invoice: row.invoice ? {
          invoiceNumber: row.invoice.invoice_number,
          total: Number(row.invoice.total),
          customerId: row.invoice.customer_id,
          customer: row.invoice.customer,
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

export const usePaymentReceiptsByInvoice = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['payment-receipts', 'invoice', invoiceId],
    queryFn: async (): Promise<PaymentReceipt[]> => {
      if (!invoiceId) return [];

      const { data, error } = await supabase
        .from('payment_receipts')
        .select(`
          *,
          bank_account:bank_accounts(name, bank_name)
        `)
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        branchId: row.branch_id,
        receiptNumber: row.receipt_number,
        prefix: row.prefix,
        sequenceNumber: row.sequence_number,
        invoiceId: row.invoice_id,
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
    enabled: !!invoiceId,
  });
};

export const useCreatePaymentReceipt = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentReceiptData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Generate receipt number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_receipt_number', {
          p_company_id: data.companyId,
          p_prefix: data.prefix || 'RC'
        });

      if (numberError) throw numberError;
      if (!numberData || numberData.length === 0) throw new Error('Error generando número de recibo');

      const { receipt_number, sequence_number } = numberData[0];

      // Create payment receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('payment_receipts')
        .insert({
          company_id: data.companyId,
          branch_id: data.branchId,
          receipt_number,
          prefix: data.prefix || 'RC',
          sequence_number,
          invoice_id: data.invoiceId,
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

      if (receiptError) throw receiptError;

      // Create bank transaction
      const { error: transactionError } = await supabase
        .from('bank_transactions')
        .insert({
          company_id: data.companyId,
          bank_account_id: data.bankAccountId,
          type: 'deposit',
          amount: data.amount,
          date: data.paymentDate || new Date().toISOString().split('T')[0],
          description: `Recibo de cobro ${receipt_number}`,
          source_module: 'payment_receipt',
          source_id: receipt.id,
          reference_number: data.reference,
          created_by: user.id,
        });

      if (transactionError) throw transactionError;

      // Update invoice status to 'paid' if fully paid
      const { data: invoicePayments } = await supabase
        .from('payment_receipts')
        .select('amount')
        .eq('invoice_id', data.invoiceId);

      const totalPaid = (invoicePayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

      const { data: invoice } = await supabase
        .from('standard_invoices')
        .select('total')
        .eq('id', data.invoiceId)
        .single();

      if (invoice && totalPaid >= Number(invoice.total)) {
        await supabase
          .from('standard_invoices')
          .update({ status: 'paid' })
          .eq('id', data.invoiceId);
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: "Recibo registrado",
        description: "El cobro se ha registrado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al registrar cobro",
        description: error.message || "No se pudo registrar el cobro",
      });
    },
  });
};

export const useDeletePaymentReceipt = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptId: string) => {
      // First delete related bank transaction
      await supabase
        .from('bank_transactions')
        .delete()
        .eq('source_module', 'payment_receipt')
        .eq('source_id', receiptId);

      const { error } = await supabase
        .from('payment_receipts')
        .delete()
        .eq('id', receiptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['standard-invoices'] });
      toast({
        title: "Recibo eliminado",
        description: "El recibo ha sido eliminado",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar recibo",
        description: error.message || "No se pudo eliminar el recibo",
      });
    },
  });
};
