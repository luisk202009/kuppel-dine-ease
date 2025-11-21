import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export const Admin: React.FC = () => {
  const { authState } = usePOS();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!authState.isAuthenticated || !authState.user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Get user profile to check role
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', authState.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [authState.isAuthenticated, authState.user]);

  if (isLoading || authState.isLoading) {
    return <LoadingScreen message="Verificando permisos..." />;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>
              No tienes permisos para acceder al panel de administración.
              Solo los administradores de la plataforma pueden acceder a esta sección.
            </AlertDescription>
          </Alert>
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return <AdminLayout />;
};
