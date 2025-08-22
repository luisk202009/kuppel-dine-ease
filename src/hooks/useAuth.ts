import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { AuthRequest, AuthResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

export const useLogin = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: AuthRequest): Promise<AuthResponse> => {
      const response = await apiClient.login(credentials) as AuthResponse;
      if (response.success && response.token) {
        apiClient.setToken(response.token);
        // Store user data
        localStorage.setItem('kuppel_user', JSON.stringify(response.user));
        localStorage.setItem('kuppel_companies', JSON.stringify(response.companies));
        localStorage.setItem('kuppel_branches', JSON.stringify(response.branches));
        return response;
      }
      throw new Error('Login failed');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message || "Credenciales inválidas",
      });
    },
  });
};

export const useLogout = () => {
  return () => {
    apiClient.clearToken();
    localStorage.removeItem('kuppel_user');
    localStorage.removeItem('kuppel_companies');
    localStorage.removeItem('kuppel_branches');
    localStorage.removeItem('kuppel_selected_company');
    localStorage.removeItem('kuppel_selected_branch');
    window.location.reload();
  };
};

export const getStoredAuth = () => {
  try {
    const user = localStorage.getItem('kuppel_user');
    const companies = localStorage.getItem('kuppel_companies');
    const branches = localStorage.getItem('kuppel_branches');
    const selectedCompany = localStorage.getItem('kuppel_selected_company');
    const selectedBranch = localStorage.getItem('kuppel_selected_branch');

    return {
      user: user ? JSON.parse(user) : null,
      companies: companies ? JSON.parse(companies) : [],
      branches: branches ? JSON.parse(branches) : [],
      selectedCompany: selectedCompany ? JSON.parse(selectedCompany) : null,
      selectedBranch: selectedBranch ? JSON.parse(selectedBranch) : null,
    };
  } catch {
    return {
      user: null,
      companies: [],
      branches: [],
      selectedCompany: null,
      selectedBranch: null,
    };
  }
};