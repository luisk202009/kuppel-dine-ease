import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getRoleLabel } from '@/utils/permissions';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  company: {
    id: string;
    name: string;
  };
}

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Token de invitación inválido');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('company_invitations')
          .select(`
            id,
            email,
            role,
            status,
            expires_at,
            companies:company_id (
              id,
              name
            )
          `)
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          setError('Invitación no encontrada');
          setLoading(false);
          return;
        }

        // Check status
        if (data.status === 'accepted') {
          setError('Esta invitación ya fue aceptada');
          setLoading(false);
          return;
        }

        if (data.status === 'cancelled') {
          setError('Esta invitación fue cancelada');
          setLoading(false);
          return;
        }

        // Check expiration
        if (new Date(data.expires_at) < new Date()) {
          setError('Esta invitación ha expirado');
          setLoading(false);
          return;
        }

        setInvitation({
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          expires_at: data.expires_at,
          company: data.companies as any
        });
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Error al cargar la invitación');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !currentUser) return;

    // Verify email matches
    if (currentUser.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      toast.error(`Debes iniciar sesión con el email ${invitation.email}`);
      return;
    }

    setAccepting(true);

    try {
      // Create user_companies relationship
      const { error: relationError } = await supabase
        .from('user_companies')
        .insert({
          user_id: currentUser.id,
          company_id: invitation.company.id
        });

      if (relationError) {
        // Check if already a member
        if (relationError.code === '23505') {
          toast.info('Ya eres miembro de esta empresa');
        } else {
          throw relationError;
        }
      }

      // Update user role
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: invitation.role as any })
        .eq('id', currentUser.id);

      if (roleError) {
        console.error('Error updating role:', roleError);
        // Continue anyway, user is added to company
      }

      // Mark invitation as accepted
      await supabase
        .from('company_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      toast.success(`¡Bienvenido a ${invitation.company.name}!`);
      navigate('/');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error('Error al aceptar la invitación');
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    // Store invitation token in sessionStorage to continue after login
    sessionStorage.setItem('pendingInvitation', token || '');
    navigate('/', { state: { redirectTo: `/invite/${token}` } });
  };

  const handleSignUp = () => {
    sessionStorage.setItem('pendingInvitation', token || '');
    navigate('/', { state: { redirectTo: `/invite/${token}`, signUp: true, email: invitation?.email } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo width={120} height={40} />
            </div>
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Invitación No Válida</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo width={120} height={40} />
          </div>
          <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle>Invitación a Kuppel</CardTitle>
          <CardDescription>
            Has sido invitado a unirte a
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Info */}
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <h3 className="text-xl font-semibold">{invitation.company.name}</h3>
            <p className="text-muted-foreground mt-1">
              como <span className="font-medium text-foreground">{getRoleLabel(invitation.role)}</span>
            </p>
          </div>

          {/* Invited Email */}
          <div className="text-center text-sm text-muted-foreground">
            Invitación enviada a: <span className="font-medium">{invitation.email}</span>
          </div>

          {/* Actions */}
          {currentUser ? (
            <div className="space-y-3">
              {currentUser.email?.toLowerCase() === invitation.email.toLowerCase() ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aceptando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aceptar Invitación
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center text-amber-600 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg">
                    Estás conectado como <strong>{currentUser.email}</strong>. 
                    Para aceptar esta invitación, inicia sesión con <strong>{invitation.email}</strong>.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setCurrentUser(null);
                    }}
                  >
                    Cambiar de Cuenta
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSignUp}
              >
                Crear Cuenta
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLogin}
              >
                Ya tengo cuenta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
