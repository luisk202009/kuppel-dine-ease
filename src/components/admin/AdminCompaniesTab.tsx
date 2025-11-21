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
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  plan_id: string | null;
  subscription_status: string | null;
  billing_period: string | null;
  trial_end_at: string | null;
}

interface Plan {
  id: string;
  name: string;
  code: string;
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

interface CompanyUsageStats {
  company_id: string;
  company_name: string;
  business_type: string | null;
  company_is_active: boolean;
  company_created_at: string;
  total_orders: number;
  total_sales_amount: number;
  total_orders_last_30d: number;
  total_sales_last_30d: number;
  total_orders_prev_30d: number;
  total_sales_prev_30d: number;
  products_count: number;
  categories_count: number;
  users_count: number;
  last_order_at: string | null;
  days_since_last_order: number | null;
  activity_status: 'new' | 'active' | 'cooling' | 'at_risk' | 'churned';
}

type SortOption = 'name' | 'sales_30d' | 'products' | 'last_order';
type FilterOption = 'all' | 'with_sales' | 'no_sales';
type ActivityFilterOption = 'all' | 'active' | 'at_risk' | 'inactive' | 'new';

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
  const [usageStats, setUsageStats] = useState<Map<string, CompanyUsageStats>>(new Map());
  const [selectedCompanyUsage, setSelectedCompanyUsage] = useState<CompanyUsageStats | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilterOption>('all');
  const [plans, setPlans] = useState<Map<string, Plan>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Aplicar filtros y ordenación
  useEffect(() => {
    let filtered = [...companies];

    // 1. Aplicar búsqueda por texto
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.email?.toLowerCase().includes(query) ||
          company.tax_id?.toLowerCase().includes(query)
      );
    }

    // 2. Aplicar filtro de ventas
    if (filterOption === 'with_sales') {
      filtered = filtered.filter((company) => {
        const stats = usageStats.get(company.id);
        return stats && stats.total_orders_last_30d > 0;
      });
    } else if (filterOption === 'no_sales') {
      filtered = filtered.filter((company) => {
        const stats = usageStats.get(company.id);
        return !stats || stats.total_orders === 0;
      });
    }

    // 3. Aplicar filtro por estado de actividad
    if (activityFilter !== 'all') {
      filtered = filtered.filter((company) => {
        const stats = usageStats.get(company.id);
        if (!stats) return false;

        if (activityFilter === 'active') {
          return stats.activity_status === 'active';
        }
        if (activityFilter === 'at_risk') {
          return stats.activity_status === 'at_risk' || stats.activity_status === 'cooling';
        }
        if (activityFilter === 'inactive') {
          return stats.activity_status === 'churned';
        }
        if (activityFilter === 'new') {
          return stats.activity_status === 'new';
        }
        return true;
      });
    }

    // 4. Aplicar ordenación
    filtered.sort((a, b) => {
      const statsA = usageStats.get(a.id);
      const statsB = usageStats.get(b.id);

      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sales_30d':
          return (statsB?.total_sales_last_30d || 0) - (statsA?.total_sales_last_30d || 0);
        case 'products':
          return (statsB?.products_count || 0) - (statsA?.products_count || 0);
        case 'last_order':
          const dateA = statsA?.last_order_at ? new Date(statsA.last_order_at).getTime() : 0;
          const dateB = statsB?.last_order_at ? new Date(statsB.last_order_at).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

    setFilteredCompanies(filtered);
  }, [searchQuery, companies, usageStats, sortOption, filterOption, activityFilter]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch companies
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCompanies(data || []);
      setFilteredCompanies(data || []);

      // Fetch plans
      try {
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('id, name, code');

        if (plansError) throw plansError;

        const plansMap = new Map<string, Plan>();
        plansData?.forEach((plan) => {
          plansMap.set(plan.id, plan);
        });
        setPlans(plansMap);
      } catch (plansErr) {
        console.error('Error fetching plans:', plansErr);
      }

      // Fetch usage stats
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('company_usage_stats')
          .select('*');

        if (statsError) throw statsError;

        const statsMap = new Map<string, CompanyUsageStats>();
        statsData?.forEach((stat) => {
          statsMap.set(stat.company_id, stat as CompanyUsageStats);
        });
        setUsageStats(statsMap);
      } catch (statsErr) {
        console.error('Error fetching usage stats:', statsErr);
        toast({
          title: 'Error al cargar métricas',
          description: 'No se pudieron cargar las métricas de uso. Intenta de nuevo más tarde.',
          variant: 'destructive',
        });
      }
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
    setSelectedCompanyUsage(usageStats.get(company.id) || null);
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
    setSelectedCompanyUsage(null);
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

  // Calcular % de crecimiento de ventas
  const calculateGrowthPercentage = (current: number, previous: number): { value: number; label: string; isNew: boolean } => {
    if (previous === 0) {
      if (current === 0) {
        return { value: 0, label: '–', isNew: false };
      }
      return { value: 100, label: 'Nuevo', isNew: true };
    }
    const growth = ((current - previous) / previous) * 100;
    return { value: growth, label: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`, isNew: false };
  };

  const getActivityStatusBadge = (status: 'new' | 'active' | 'cooling' | 'at_risk' | 'churned', daysAgo: number | null) => {
    let badgeElement;
    let badgeText;

    switch (status) {
      case 'new':
        badgeElement = <Badge variant="default" className="bg-blue-500">Nuevo</Badge>;
        badgeText = 'Sin ventas aún';
        break;
      case 'active':
        badgeElement = <Badge variant="default" className="bg-green-500">Activo</Badge>;
        badgeText = daysAgo !== null ? `Hace ${daysAgo}d` : '';
        break;
      case 'cooling':
        badgeElement = <Badge variant="default" className="bg-yellow-500">Enfriando</Badge>;
        badgeText = daysAgo !== null ? `Hace ${daysAgo}d` : '';
        break;
      case 'at_risk':
        badgeElement = <Badge variant="destructive">En riesgo</Badge>;
        badgeText = daysAgo !== null ? `Hace ${daysAgo}d` : '';
        break;
      case 'churned':
        badgeElement = <Badge variant="secondary">Inactivo</Badge>;
        badgeText = daysAgo !== null ? `Hace ${daysAgo}d` : '';
        break;
      default:
        badgeElement = <Badge variant="secondary">{status}</Badge>;
        badgeText = '';
    }

    return (
      <div className="flex flex-col space-y-1">
        {badgeElement}
        {badgeText && <span className="text-xs text-muted-foreground">{badgeText}</span>}
      </div>
    );
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
          {/* Filtros y búsqueda */}
          <div className="mb-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o NIT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro */}
              <select
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value as FilterOption)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Todas las empresas</option>
                <option value="with_sales">Con ventas últimos 30 días</option>
                <option value="no_sales">Sin ventas aún</option>
              </select>

              {/* Filtro de estado de actividad */}
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value as ActivityFilterOption)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="at_risk">En riesgo</option>
                <option value="inactive">Inactivos</option>
                <option value="new">Nuevos</option>
              </select>

              {/* Ordenación */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="name">Ordenar por nombre (A-Z)</option>
                <option value="sales_30d">Ordenar por ventas 30 días</option>
                <option value="products">Ordenar por productos</option>
                <option value="last_order">Ordenar por actividad reciente</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de Negocio</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Suscripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ventas 30d</TableHead>
                  <TableHead>Órdenes 30d</TableHead>
                  <TableHead>Crec. 30d</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      {searchQuery ? 'No se encontraron empresas con ese criterio' : 'No hay empresas registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => {
                    const stats = usageStats.get(company.id);
                    const growth = stats 
                      ? calculateGrowthPercentage(stats.total_sales_last_30d, stats.total_sales_prev_30d)
                      : null;
                    const plan = company.plan_id ? plans.get(company.plan_id) : null;
                    
                    return (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{getBusinessTypeLabel(company.business_type)}</TableCell>
                        <TableCell>
                          {plan ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{plan.name}</span>
                              <span className="text-xs text-muted-foreground">{plan.code}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin plan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.subscription_status ? (
                            <div className="flex flex-col space-y-1">
                              <Badge 
                                variant={
                                  company.subscription_status === 'active' ? 'default' :
                                  company.subscription_status === 'trialing' ? 'secondary' :
                                  company.subscription_status === 'past_due' ? 'destructive' :
                                  'secondary'
                                }
                                className={
                                  company.subscription_status === 'trialing' ? 'bg-purple-500' :
                                  company.subscription_status === 'paused' ? 'bg-yellow-500' :
                                  company.subscription_status === 'canceled' ? 'bg-red-500' :
                                  ''
                                }
                              >
                                {company.subscription_status === 'trialing' ? 'En prueba' :
                                 company.subscription_status === 'active' ? 'Activa' :
                                 company.subscription_status === 'past_due' ? 'Pago pendiente' :
                                 company.subscription_status === 'paused' ? 'Pausada' :
                                 company.subscription_status === 'canceled' ? 'Cancelada' :
                                 company.subscription_status}
                              </Badge>
                              {company.billing_period && (
                                <span className="text-xs text-muted-foreground">
                                  {company.billing_period === 'monthly' ? 'Mensual' : 'Anual'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats ? getActivityStatusBadge(stats.activity_status, stats.days_since_last_order) : '–'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {stats ? formatCurrency(stats.total_sales_last_30d) : '–'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {stats?.total_orders_last_30d ?? '–'}
                        </TableCell>
                        <TableCell>
                          {growth && (
                            <Badge 
                              variant={growth.isNew ? 'default' : growth.value > 0 ? 'default' : growth.value < 0 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {growth.label}
                            </Badge>
                          )}
                          {!growth && '–'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {stats?.products_count ?? '–'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {stats?.users_count ?? '–'}
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
                    );
                  })
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
        usage={selectedCompanyUsage}
        open={isModalOpen}
        onClose={handleCloseModal}
        isLoading={isLoadingDetail}
      />
    </div>
  );
};
