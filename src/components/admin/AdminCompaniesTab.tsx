import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Building2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdminCompanyDetailModal } from './AdminCompanyDetailModal';

interface Company {
  id: string;
  name: string;
  business_type: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  owner_id: string | null;
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface CompanyUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const AdminCompaniesTab: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyBranches, setCompanyBranches] = useState<Branch[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCompanies(
        companies.filter(
          (company) =>
            company.name.toLowerCase().includes(query) ||
            company.email?.toLowerCase().includes(query) ||
            company.tax_id?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, companies]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCompanies(data || []);
      setFilteredCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('No se pudieron cargar las empresas. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const getBusinessTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      restaurant: 'Restaurante',
      cafe: 'Cafetería',
      pizzeria: 'Pizzería',
      bar: 'Bar',
      retail: 'Retail',
      bakery: 'Panadería',
      other: 'Otro',
    };
    return types[type || 'other'] || 'Otro';
  };

  const fetchCompanyDetail = async (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
    setIsLoadingDetail(true);

    try {
      // Fetch branches
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('id, name, address, phone, is_active')
        .eq('company_id', company.id)
        .order('name');

      if (branchesError) throw branchesError;
      setCompanyBranches(branches || []);

      // Fetch users associated with this company
      const { data: userCompanies, error: usersError } = await supabase
        .from('user_companies')
        .select(`
          user_id,
          users (
            id,
            email,
            name,
            role
          )
        `)
        .eq('company_id', company.id);

      if (usersError) throw usersError;

      const users = userCompanies?.map((uc: any) => ({
        id: uc.users.id,
        email: uc.users.email,
        name: uc.users.name,
        role: uc.users.role,
      })) || [];

      setCompanyUsers(users);
    } catch (err) {
      console.error('Error fetching company detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
    setCompanyBranches([]);
    setCompanyUsers([]);
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Cargando empresas...</div>
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
            <Building2 className="h-5 w-5" />
            <span>Empresas Registradas</span>
          </CardTitle>
          <CardDescription>
            Total: {companies.length} empresas | Mostrando: {filteredCompanies.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o NIT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de Negocio</TableHead>
                  <TableHead>NIT/ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {searchQuery ? 'No se encontraron empresas con ese criterio' : 'No hay empresas registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{getBusinessTypeLabel(company.business_type)}</TableCell>
                      <TableCell className="text-muted-foreground">{company.tax_id || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{company.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={company.is_active ? 'default' : 'secondary'}>
                          {company.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(company.created_at), 'PP', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchCompanyDetail(company)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Company Detail Modal */}
      <AdminCompanyDetailModal
        company={selectedCompany}
        branches={companyBranches}
        users={companyUsers}
        open={isModalOpen}
        onClose={handleCloseModal}
        isLoading={isLoadingDetail}
      />
    </div>
  );
};
