import React, { useState } from 'react';
import { Users, Mail, UserPlus, MoreVertical, Crown, RefreshCw, X, UserMinus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { usePOS } from '@/contexts/POSContext';
import { InviteUserModal } from './InviteUserModal';
import { EditMemberModal } from './EditMemberModal';
import { getRoleLabel, TEAM_ROLES } from '@/utils/permissions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export const TeamManagement: React.FC = () => {
  const { authState } = usePOS();
  const {
    members,
    invitations,
    loadingMembers,
    loadingInvitations,
    cancelInvitation,
    resendInvitation,
    removeMember,
    deactivateMember,
    reactivateMember
  } = useTeamManagement();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'remove' | 'deactivate' | 'cancel';
    id: string;
    name: string;
  } | null>(null);

  const currentUserId = authState.user?.id;

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'company_owner':
        return 'default';
      case 'staff':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case 'remove':
        removeMember.mutate(confirmAction.id);
        break;
      case 'deactivate':
        deactivateMember.mutate(confirmAction.id);
        break;
      case 'cancel':
        cancelInvitation.mutate(confirmAction.id);
        break;
    }
    setConfirmAction(null);
  };

  if (loadingMembers || loadingInvitations) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Equipo</h2>
          <p className="text-muted-foreground">
            Administra los miembros de tu empresa y sus permisos
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar Usuario
        </Button>
      </div>

      {/* Miembros Activos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros ({members.length})
          </CardTitle>
          <CardDescription>
            Usuarios con acceso a esta empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay miembros en el equipo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const isCurrentUser = member.user_id === currentUserId;
                const isOwner = member.role === 'company_owner';

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      !member.is_active ? 'opacity-60 bg-muted/50' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.name, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.name || member.email}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">Tú</Badge>
                          )}
                          {isOwner && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          {!member.is_active && (
                            <Badge variant="destructive" className="text-xs">Inactivo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>

                      {!isCurrentUser && !isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingMember(member)}>
                              Cambiar rol
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {member.is_active ? (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setConfirmAction({
                                  type: 'deactivate',
                                  id: member.user_id,
                                  name: member.name || member.email
                                })}
                              >
                                Desactivar acceso
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => reactivateMember.mutate(member.user_id)}
                              >
                                Reactivar acceso
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setConfirmAction({
                                type: 'remove',
                                id: member.id,
                                name: member.name || member.email
                              })}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remover de empresa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitaciones Pendientes */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitaciones Pendientes ({invitations.length})
            </CardTitle>
            <CardDescription>
              Usuarios que aún no han aceptado la invitación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const expiresIn = formatDistanceToNow(new Date(invitation.expires_at), {
                  addSuffix: true,
                  locale: es
                });

                return (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Expira {expiresIn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {getRoleLabel(invitation.role)}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resendInvitation.mutate(invitation)}
                        disabled={resendInvitation.isPending}
                        title="Reenviar invitación"
                      >
                        <RefreshCw className={`h-4 w-4 ${resendInvitation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmAction({
                          type: 'cancel',
                          id: invitation.id,
                          name: invitation.email
                        })}
                        title="Cancelar invitación"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Info */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Disponibles</CardTitle>
          <CardDescription>
            Los roles determinan qué acciones pueden realizar los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(TEAM_ROLES).map(([key, role]) => (
              <div key={key} className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{role.icon}</span>
                  <span className="font-medium">{role.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      {editingMember && (
        <EditMemberModal
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          member={editingMember}
        />
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'remove' && '¿Remover miembro?'}
              {confirmAction?.type === 'deactivate' && '¿Desactivar acceso?'}
              {confirmAction?.type === 'cancel' && '¿Cancelar invitación?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'remove' && (
                <>
                  <strong>{confirmAction.name}</strong> será removido de la empresa y perderá acceso inmediatamente.
                </>
              )}
              {confirmAction?.type === 'deactivate' && (
                <>
                  <strong>{confirmAction.name}</strong> no podrá acceder a la empresa hasta que reactives su cuenta.
                </>
              )}
              {confirmAction?.type === 'cancel' && (
                <>
                  La invitación para <strong>{confirmAction.name}</strong> será cancelada.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
