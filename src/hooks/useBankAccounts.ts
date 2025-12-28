import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BankAccount {
  id: string;
  company_id: string;
  name: string;
  bank_name: string | null;
  account_number: string | null;
  account_type: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  companyId: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  currency?: string;
  initialBalance?: number;
}

export interface UpdateBankAccountData {
  id: string;
  name?: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  currency?: string;
  isActive?: boolean;
}

export const useBankAccounts = (companyId?: string) => {
  return useQuery({
    queryKey: ['bank-accounts', companyId],
    queryFn: async (): Promise<BankAccount[]> => {
      let query = supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as BankAccount[];
    },
    enabled: !!companyId,
  });
};

export const useAllBankAccounts = (companyId?: string) => {
  return useQuery({
    queryKey: ['bank-accounts', 'all', companyId],
    queryFn: async (): Promise<BankAccount[]> => {
      let query = supabase
        .from('bank_accounts')
        .select('*')
        .order('name');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as BankAccount[];
    },
    enabled: !!companyId,
  });
};

export const useBankAccount = (accountId: string | undefined) => {
  return useQuery({
    queryKey: ['bank-account', accountId],
    queryFn: async (): Promise<BankAccount | null> => {
      if (!accountId) return null;

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', accountId)
        .maybeSingle();

      if (error) throw error;
      return data as BankAccount | null;
    },
    enabled: !!accountId,
  });
};

export const useCreateBankAccount = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankAccountData) => {
      const { data: account, error } = await supabase
        .from('bank_accounts')
        .insert({
          company_id: data.companyId,
          name: data.name,
          bank_name: data.bankName || null,
          account_number: data.accountNumber || null,
          account_type: data.accountType || 'checking',
          currency: data.currency || 'COP',
          initial_balance: data.initialBalance || 0,
          current_balance: data.initialBalance || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: "Cuenta creada",
        description: "La cuenta bancaria se ha creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al crear cuenta",
        description: error.message || "No se pudo crear la cuenta bancaria",
      });
    },
  });
};

export const useUpdateBankAccount = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBankAccountData) => {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.bankName !== undefined) updateData.bank_name = data.bankName;
      if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber;
      if (data.accountType !== undefined) updateData.account_type = data.accountType;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { data: account, error } = await supabase
        .from('bank_accounts')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      toast({
        title: "Cuenta actualizada",
        description: "La cuenta bancaria se ha actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar cuenta",
        description: error.message || "No se pudo actualizar la cuenta bancaria",
      });
    },
  });
};

export const useDeleteBankAccount = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: "Cuenta eliminada",
        description: "La cuenta bancaria se ha eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar cuenta",
        description: error.message || "No se pudo eliminar la cuenta bancaria",
      });
    },
  });
};
