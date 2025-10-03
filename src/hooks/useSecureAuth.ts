import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { secureStorage } from '@/lib/secureStorage';
import { useToast } from '@/hooks/use-toast';

interface SecureAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<SecureAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Store session securely (async operations deferred)
          setTimeout(async () => {
            try {
              await secureStorage.setToken(session.access_token);
              await secureStorage.setUserData('user_profile', {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email,
              });
            } catch (error) {
              console.error('Failed to store session securely');
            }
          }, 0);
          
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: session.user,
          });
        } else {
          // Clear secure storage on logout
          secureStorage.clearAll();
          
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          await secureStorage.setToken(session.access_token);
          await secureStorage.setUserData('user_profile', {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email,
          });
        } catch (error) {
          console.error('Failed to store session securely');
        }
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: session.user,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Clear all client-side data first
      secureStorage.clearAll();
      localStorage.removeItem('kuppel_selected_company');
      localStorage.removeItem('kuppel_selected_branch');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Update auth state immediately
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      
      // Redirect to login without full page reload
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Error al cerrar sesión.",
        variant: "destructive"
      });
    }
  };

  return {
    ...authState,
    logout,
  };
};