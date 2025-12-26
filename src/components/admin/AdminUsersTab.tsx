import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Users, ShieldCheck, Edit, RotateCcw, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier' | 'company_owner' | 'demo' | 'platform_admin' | 'staff' | 'viewer';
  is_active: boolean;
  created_at: string;
  setup_completed: boolean;
  companies_count: number;
}

export const AdminUsersTab: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState<{ 
    role: 'admin' | 'cashier' | 'company_owner' | 'demo' | 'platform_admin' | 'staff' | 'viewer'; 
    is_active: boolean;
  }>({ role: 'cashier', is_active: true });
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.name.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(result);
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get users with setup_completed field
      const { data: usersData, error: fetchError } = await supabase
        .from('users')
        .select('id, email, name, role, is_active, created_at, setup_completed')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get company counts for all users
      const { data: companyCounts, error: countError } = await supabase
        .from('user_companies')
        .select('user_id');

      if (countError) {
        console.error('Error fetching company counts:', countError);
      }

      // Count companies per user
      const countMap: Record<string, number> = {};
      companyCounts?.forEach((uc) => {
        countMap[uc.user_id] = (countMap[uc.user_id] || 0) + 1;
      });

      // Merge users with company counts
      const usersWithCounts: UserProfile[] = (usersData || []).map((user) => ({
        ...user,
        setup_completed: user.setup_completed ?? false,
        companies_count: countMap[user.id] || 0,
      }));

      setUsers(usersWithCounts);
      setFilteredUsers(usersWithCounts);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('No se pudieron cargar los usuarios. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      cashier: 'Cajero',
      staff: 'Personal',
      viewer: 'Visualizador',
      company_owner: 'Dueño de Empresa',
      platform_admin: 'Admin Plataforma',
      demo: 'Demo',
    };
    return roles[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin' || role === 'platform_admin') return 'destructive';
    if (role === 'company_owner') return 'default';
    return 'secondary';
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditFormData({
      role: user.role,
      is_active: user.is_active,
    });
  };

  const handleResetSetup = async (user: UserProfile) => {
    if (resettingUserId) return; // Prevent double clicks
    
    const confirmed = window.confirm(
      `¿Estás seguro de reiniciar el setup de ${user.email}?\n\nEsto:\n- Eliminará sus asociaciones de empresa\n- Forzará el wizard de configuración en su próximo inicio de sesión`
    );
    
    if (!confirmed) return;
    
    setResettingUserId(user.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await supabase.functions.invoke('admin-reset-user-setup', {
        body: { target_user_id: user.id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al resetear setup');
      }

      toast({
        title: 'Setup reiniciado',
        description: `El usuario ${user.email} verá el wizard de configuración en su próximo inicio de sesión.`,
      });

      // Refresh the user list
      await fetchUsers();
    } catch (err: any) {
      console.error('Error resetting user setup:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo reiniciar el setup del usuario.',
        variant: 'destructive',
      });
    } finally {
      setResettingUserId(null);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    // Validate: prevent admin from removing their own admin role
    if (editingUser.id === currentUserId && editingUser.role === 'admin' && editFormData.role !== 'admin') {
      toast({
        title: 'Error',
        description: 'No puedes quitarte a ti mismo el rol de administrador.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          role: editFormData.role,
          is_active: editFormData.is_active,
        })
        .eq('id', editingUser.id)
        .select();

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error('No se pudo actualizar el usuario. Verifica los permisos.');
      }

      toast({
        title: 'Usuario actualizado',
        description: 'Los cambios se guardaron correctamente.',
      });

      // Refresh users list
      await fetchUsers();
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudieron guardar los cambios del usuario. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Cargando usuarios...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Usuarios Registrados</span>
          </CardTitle>
          <CardDescription>
            Total: {users.length} usuarios | Mostrando: {filteredUsers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="company_owner">Dueño de Empresa</SelectItem>
                <SelectItem value="cashier">Cajero</SelectItem>
                <SelectItem value="staff">Personal</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Setup
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Empresas
                    </div>
                  </TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {searchQuery || roleFilter !== 'all'
                        ? 'No se encontraron usuarios con ese criterio'
                        : 'No hay usuarios registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          {user.role === 'admin' && (
                            <ShieldCheck className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.setup_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-amber-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.companies_count > 0 ? 'default' : 'destructive'}>
                          {user.companies_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'PP', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetSetup(user)}
                            disabled={resettingUserId === user.id}
                            className="text-amber-600 hover:text-amber-700 border-amber-300 hover:border-amber-400"
                          >
                            <RotateCcw className={`h-4 w-4 mr-1 ${resettingUserId === user.id ? 'animate-spin' : ''}`} />
                            {resettingUserId === user.id ? 'Reiniciando...' : 'Forzar Wizard'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica el rol y estado del usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editingUser?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ 
                  ...editFormData, 
                  role: value as 'admin' | 'cashier' | 'company_owner' | 'demo' | 'platform_admin' | 'staff' | 'viewer'
                })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="company_owner">Dueño de Empresa</SelectItem>
                  <SelectItem value="cashier">Cajero</SelectItem>
                  <SelectItem value="staff">Personal</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
              {editingUser?.id === currentUserId && editingUser?.role === 'admin' && (
                <p className="text-sm text-muted-foreground">
                  No puedes quitarte a ti mismo el rol de administrador
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_active: checked })}
              />
              <Label htmlFor="is_active">Usuario activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
