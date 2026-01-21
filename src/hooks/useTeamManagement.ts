import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

export const useTeamManagement = () => {
  const { authState } = usePOS();
  const queryClient = useQueryClient();
  const companyId = authState.selectedCompany?.id;

  // Obtener miembros del equipo
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          id,
          user_id,
          created_at,
          users:user_id (
            id,
            email,
            name,
            role,
            is_active
          )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      return (data || []).map((uc: any) => ({
        id: uc.id,
        user_id: uc.user_id,
        email: uc.users?.email || '',
        name: uc.users?.name || '',
        role: uc.users?.role || 'staff',
        is_active: uc.users?.is_active ?? true,
        created_at: uc.created_at
      })) as TeamMember[];
    },
    enabled: !!companyId
  });

  // Obtener invitaciones pendientes
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['team-invitations', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!companyId
  });

  // Enviar invitación
  const inviteUser = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!companyId) throw new Error('No company selected');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verificar si el email ya está en la empresa
      const existingMember = members.find(m => m.email.toLowerCase() === email.toLowerCase());
      if (existingMember) {
        throw new Error('Este usuario ya es miembro de la empresa');
      }

      // Verificar si ya existe una invitación pendiente
      const existingInvitation = invitations.find(
        i => i.email.toLowerCase() === email.toLowerCase()
      );
      if (existingInvitation) {
        throw new Error('Ya existe una invitación pendiente para este email');
      }

      // Crear invitación
      const { data, error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: companyId,
          email: email.toLowerCase(),
          role: role as any,
          invited_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar email de invitación via edge function
      const { error: emailError } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          invitationId: data.id,
          email: email.toLowerCase(),
          companyName: authState.selectedCompany?.name || 'la empresa',
          role,
          inviterName: authState.user?.name || 'El administrador'
        }
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        // No lanzar error, la invitación ya fue creada
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', companyId] });
      toast.success('Invitación enviada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar la invitación');
    }
  });

  // Cancelar invitación
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', companyId] });
      toast.success('Invitación cancelada');
    },
    onError: () => {
      toast.error('Error al cancelar la invitación');
    }
  });

  // Reenviar invitación
  const resendInvitation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      // Actualizar fecha de expiración
      const { data, error } = await supabase
        .from('company_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: crypto.randomUUID()
        })
        .eq('id', invitation.id)
        .select()
        .single();

      if (error) throw error;

      // Reenviar email
      await supabase.functions.invoke('send-team-invitation', {
        body: {
          invitationId: data.id,
          email: invitation.email,
          companyName: authState.selectedCompany?.name || 'la empresa',
          role: invitation.role,
          inviterName: authState.user?.name || 'El administrador'
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', companyId] });
      toast.success('Invitación reenviada');
    },
    onError: () => {
      toast.error('Error al reenviar la invitación');
    }
  });

  // Actualizar rol de miembro
  const updateMemberRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole as any })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', companyId] });
      toast.success('Rol actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar el rol');
    }
  });

  // Desactivar miembro
  const deactivateMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', companyId] });
      toast.success('Miembro desactivado');
    },
    onError: () => {
      toast.error('Error al desactivar el miembro');
    }
  });

  // Reactivar miembro
  const reactivateMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', companyId] });
      toast.success('Miembro reactivado');
    },
    onError: () => {
      toast.error('Error al reactivar el miembro');
    }
  });

  // Remover miembro de la empresa
  const removeMember = useMutation({
    mutationFn: async (userCompanyId: string) => {
      const { error } = await supabase
        .from('user_companies')
        .delete()
        .eq('id', userCompanyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', companyId] });
      toast.success('Miembro removido de la empresa');
    },
    onError: () => {
      toast.error('Error al remover el miembro');
    }
  });

  return {
    members,
    invitations,
    loadingMembers,
    loadingInvitations,
    inviteUser,
    cancelInvitation,
    resendInvitation,
    updateMemberRole,
    deactivateMember,
    reactivateMember,
    removeMember
  };
};
