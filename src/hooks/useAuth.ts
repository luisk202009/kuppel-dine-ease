import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { AuthRequest, AuthResponse } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { secureStorage } from '@/lib/secureStorage';
import { sanitizeString, validateUsername, validatePassword } from '@/lib/inputSanitizer';
import { logAuthEvent, logSecurityEvent } from '@/lib/monitoring';

export const useLogin = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: AuthRequest): Promise<AuthResponse> => {
      logAuthEvent('login_attempt', credentials.username);
      
      // Validate and sanitize inputs
      const usernameValidation = validateUsername(credentials.username);
      if (!usernameValidation.isValid) {
        logSecurityEvent('invalid_username_format', { username: credentials.username.substring(0, 3) + '***' });
        throw new Error(usernameValidation.error);
      }
      
      const passwordValidation = validatePassword(credentials.password);
      if (!passwordValidation.isValid) {
        logSecurityEvent('weak_password_attempt', { username: credentials.username.substring(0, 3) + '***' });
        throw new Error(passwordValidation.error);
      }
      
      // Sanitize credentials
      const sanitizedCredentials: AuthRequest = {
        username: sanitizeString(credentials.username),
        password: credentials.password // Don't sanitize password content, just validate
      };
      
      const response = await apiClient.login(sanitizedCredentials) as AuthResponse;
      if (response.success && response.token) {
        // Use secure storage instead of localStorage
        secureStorage.setToken(response.token);
        apiClient.setToken(response.token);
        
        // Store user data securely
        secureStorage.setUserData('user', response.user);
        secureStorage.setUserData('companies', response.companies);
        secureStorage.setUserData('branches', response.branches);
        
        logAuthEvent('login_success', credentials.username);
        return response;
      }
      
      logAuthEvent('login_failure', credentials.username);
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
    logAuthEvent('logout');
    
    apiClient.clearToken();
    secureStorage.clearAll();
    
    // Clear any remaining localStorage items
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
    // Try secure storage first
    let user = secureStorage.getUserData('user');
    let companies = secureStorage.getUserData('companies');
    let branches = secureStorage.getUserData('branches');
    
    // Fallback to localStorage for backwards compatibility
    if (!user) {
      const userLocal = localStorage.getItem('kuppel_user');
      user = userLocal ? JSON.parse(userLocal) : null;
    }
    
    if (!companies) {
      const companiesLocal = localStorage.getItem('kuppel_companies');
      companies = companiesLocal ? JSON.parse(companiesLocal) : [];
    }
    
    if (!branches) {
      const branchesLocal = localStorage.getItem('kuppel_branches');
      branches = branchesLocal ? JSON.parse(branchesLocal) : [];
    }
    
    // Selected company/branch still use localStorage for now
    const selectedCompany = localStorage.getItem('kuppel_selected_company');
    const selectedBranch = localStorage.getItem('kuppel_selected_branch');

    return {
      user: user || null,
      companies: companies || [],
      branches: branches || [],
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