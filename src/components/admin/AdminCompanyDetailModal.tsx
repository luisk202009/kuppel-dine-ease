import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  business_type: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdminCompanyDetailModalProps {
  company: Company | null;
  branches: Branch[];
  users: User[];
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const AdminCompanyDetailModal: React.FC<AdminCompanyDetailModalProps> = ({
  company,
  branches,
  users,
  open,
  onClose,
  isLoading = false,
}) => {
  if (!company) return null;

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

  const getBusinessTypeLabel = (type: string | null) => {
    if (!type) return 'No especificado';
    const types: Record<string, string> = {
      restaurant: 'Restaurante',
      cafe: 'Café',
      pizzeria: 'Pizzería',
      bar: 'Bar',
      retail: 'Comercio',
      bakery: 'Panadería',
      other: 'Otro',
    };
    return types[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Detalle de Empresa</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono text-sm">{company.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Negocio</p>
                  <p className="font-medium">{getBusinessTypeLabel(company.business_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={company.is_active ? 'default' : 'secondary'}>
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                {company.tax_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">NIT/RUC</p>
                    <p className="font-medium">{company.tax_id}</p>
                  </div>
                )}
                {company.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{company.email}</p>
                  </div>
                )}
                {company.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{company.phone}</p>
                  </div>
                )}
                {company.address && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{company.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium">
                    {format(new Date(company.created_at), 'PP', { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Sucursales ({branches.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Cargando sucursales...</p>
              ) : branches.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay sucursales registradas</p>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="p-3 border rounded-lg flex justify-between items-start"
                    >
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        {branch.address && (
                          <p className="text-sm text-muted-foreground">{branch.address}</p>
                        )}
                        {branch.phone && (
                          <p className="text-sm text-muted-foreground">{branch.phone}</p>
                        )}
                      </div>
                      <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                        {branch.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usuarios Asociados ({users.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Cargando usuarios...</p>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay usuarios asociados</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
