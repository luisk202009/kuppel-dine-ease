import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { shouldUseMockData } from '@/config/environment';
import type { User, Session } from '@supabase/supabase-js';

interface AuthRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: any;
    session: Session;
    companies: any[];
    branches: any[];
  };
  error?: string;
}

export const useLogin = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: AuthRequest): Promise<AuthResponse> => {
      // Validate inputs
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      try {
        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (authError) {
          throw new Error(getAuthErrorMessage(authError.message));
        }

        if (!authData.user || !authData.session) {
          throw new Error('Authentication failed');
        }

        // Get user profile and associated data
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        }

        // Get user companies and branches
        const { data: userCompanies, error: companiesError } = await supabase
          .from('user_companies')
          .select(`
            company:companies(*),
            branch:branches(*)
          `)
          .eq('user_id', authData.user.id);

        if (companiesError) {
          console.error('Error fetching user companies:', companiesError);
        }

        const companies = userCompanies?.map(uc => uc.company).filter(Boolean) || [];
        const branches = userCompanies?.map(uc => uc.branch).filter(Boolean) || [];

        return {
          success: true,
          data: {
            user: profile || { ...authData.user, role: 'demo' },
            session: authData.session,
            companies,
            branches
          }
        };
      } catch (error) {
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Error desconocido al iniciar sesión",
        variant: "destructive"
      });
    }
  });
};

export const useSignUp = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name }
        }
      });

      if (error) {
        throw new Error(getAuthErrorMessage(error.message));
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Cuenta creada",
        description: "Revisa tu email para confirmar tu cuenta.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error de registro",
        description: error instanceof Error ? error.message : "Error desconocido al crear la cuenta",
        variant: "destructive"
      });
    }
  });
};

export const useResetPassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(getAuthErrorMessage(error.message));
      }
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "Revisa tu email para restablecer tu contraseña.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar el email",
        variant: "destructive"
      });
    }
  });
};

export const useMagicLink = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw new Error(getAuthErrorMessage(error.message));
      }
    },
    onSuccess: () => {
      toast({
        title: "Magic Link enviado",
        description: "Revisa tu email para iniciar sesión con el enlace mágico.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar el magic link",
        variant: "destructive"
      });
    }
  });
};

export const useLogout = () => {
  return async () => {
    await supabase.auth.signOut();
    
    // Clear localStorage items
    localStorage.removeItem('kuppel_selected_company');
    localStorage.removeItem('kuppel_selected_branch');
    
    // Reload to reset app state
    window.location.reload();
  };
};

export const getStoredAuth = () => {
  // Get selected company and branch from localStorage
  const selectedCompany = localStorage.getItem('kuppel_selected_company') 
    ? JSON.parse(localStorage.getItem('kuppel_selected_company')!) 
    : null;
    
  const selectedBranch = localStorage.getItem('kuppel_selected_branch')
    ? JSON.parse(localStorage.getItem('kuppel_selected_branch')!)
    : null;

  return {
    user: null, // Will be handled by Supabase session
    companies: [],
    branches: [],
    selectedCompany,
    selectedBranch
  };
};

// Helper function to translate auth error messages to Spanish
function getAuthErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Credenciales inválidas',
    'Email not confirmed': 'Email no confirmado. Revisa tu bandeja de entrada.',
    'Too many requests': 'Demasiados intentos. Inténtalo más tarde.',
    'User already registered': 'Este email ya está registrado',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'Signup is disabled': 'El registro está deshabilitado',
  };

  return errorMap[errorMessage] || errorMessage;
}