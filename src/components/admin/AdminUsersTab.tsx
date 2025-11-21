import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const AdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, email, name, role, is_active, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data || []);
      setFilteredUsers(data || []);
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'PP', { locale: es })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
