import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Users, TrendingUp, ShoppingCart, ArrowUpIcon, ArrowDownIcon, CreditCard, AlertTriangle, Landmark, Eye, EyeOff, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { EditCompanySubscriptionModal } from './EditCompanySubscriptionModal';
import { CompanyModulesManager } from './CompanyModulesManager';
import { EnabledModules } from '@/types/pos';

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
  plan_id: string | null;
  subscription_status: string | null;
  billing_period: string | null;
  trial_end_at: string | null;
  enabled_modules?: EnabledModules | null;
}

interface Plan {
  id: string;
  name: string;
  code: string;
  limits: PlanLimits | null;
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
  branches_count: number;
  documents_this_month: number;
  last_order_at: string | null;
  days_since_last_order: number | null;
  activity_status: 'new' | 'active' | 'cooling' | 'at_risk' | 'churned';
}

interface PlanLimits {
  max_users?: number | null;
  max_branches?: number | null;
  max_documents_per_month?: number | null;
}

interface CompanyLimitsStatus {
  users: {
    used: number;
    limit: number | null;
    status: string;
    usage_pct: number | null;
  };
  branches: {
    used: number;
    limit: number | null;
    status: string;
    usage_pct: number | null;
  };
  documents: {
    used: number;
    limit: number | null;
    status: string;
    usage_pct: number | null;
  };
  overall_status: string;
}

interface MonthlySalesData {
  year_month: string;
  month_label: string;
  total_orders_month: number;
  total_sales_month: number;
}

interface ProductSalesData {
  product_id: string;
  product_name: string;
  total_quantity_sold: number;
  total_sales_amount: number;
  total_quantity_last_30d: number;
  total_sales_last_30d: number;
}

interface AdminCompanyDetailModalProps {
  company: Company | null;
  branches: Branch[];
  users: User[];
  usage: CompanyUsageStats | null;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const AdminCompanyDetailModal: React.FC<AdminCompanyDetailModalProps> = ({
  company,
  branches,
  users,
  usage,
  open,
  onClose,
  isLoading = false,
}) => {
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [topProducts, setTopProducts] = useState<ProductSalesData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false);
  const [limitsStatus, setLimitsStatus] = useState<CompanyLimitsStatus | null>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const [enabledModules, setEnabledModules] = useState<EnabledModules | null>(null);
  
  // Dataico configuration state
  const [dataicoAccountId, setDataicoAccountId] = useState('');
  const [dataicoAuthToken, setDataicoAuthToken] = useState('');
  const [dataicoStatus, setDataicoStatus] = useState<string>('pending');
  const [showDataicoToken, setShowDataicoToken] = useState(false);
  const [isSavingDataico, setIsSavingDataico] = useState(false);
  const { toast } = useToast();

  // Cargar datos mensuales y productos cuando se abre el modal
  useEffect(() => {
    if (open && company) {
      fetchMonthlySales();
      fetchTopProducts();
      fetchPlan();
      fetchLimitsStatus();
      fetchEnabledModules();
      fetchDataicoConfig();
    }
  }, [open, company]);

  const fetchDataicoConfig = async () => {
    if (!company) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('dataico_account_id, dataico_auth_token, dataico_status')
        .eq('id', company.id)
        .single();
      
      if (error) throw error;
      setDataicoAccountId(data?.dataico_account_id || '');
      setDataicoAuthToken(data?.dataico_auth_token || '');
      setDataicoStatus(data?.dataico_status || 'pending');
    } catch (error) {
      console.error('Error fetching Dataico config:', error);
    }
  };

  const handleSaveDataicoConfig = async () => {
    if (!company) return;
    
    setIsSavingDataico(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          dataico_account_id: dataicoAccountId.trim() || null,
          dataico_auth_token: dataicoAuthToken.trim() || null,
          dataico_status: dataicoStatus,
        })
        .eq('id', company.id);
      
      if (error) throw error;
      
      toast({
        title: 'Configuración guardada',
        description: 'La configuración de Dataico se ha guardado correctamente.',
      });
    } catch (error: any) {
      console.error('Error saving Dataico config:', error);
      toast({
        title: 'Error al guardar',
        description: error.message || 'No se pudo guardar la configuración de Dataico.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDataico(false);
    }
  };

  const fetchEnabledModules = async () => {
    if (!company) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('enabled_modules')
        .eq('id', company.id)
        .single();
      
      if (error) throw error;
      setEnabledModules(data?.enabled_modules as unknown as EnabledModules | null);
    } catch (error) {
      console.error('Error fetching enabled modules:', error);
    }
  };

  const fetchLimitsStatus = async () => {
    if (!company) return;

    try {
      setIsLoadingLimits(true);
      const { data, error } = await supabase
        .rpc('check_company_limits', { p_company_id: company.id });

      if (error) throw error;
      setLimitsStatus(data as unknown as CompanyLimitsStatus);
    } catch (error) {
      console.error('Error fetching limits status:', error);
      setLimitsStatus(null);
    } finally {
      setIsLoadingLimits(false);
    }
  };

  const fetchPlan = async () => {
    if (!company || !company.plan_id) {
      setPlan(null);
      return;
    }

    try {
      setIsLoadingPlan(true);
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, code, limits')
        .eq('id', company.plan_id)
        .single();

      if (error) throw error;
      setPlan(data as Plan);
    } catch (error) {
      console.error('Error fetching plan:', error);
      setPlan(null);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const fetchMonthlySales = async () => {
    if (!company) return;

    try {
      setIsLoadingChart(true);
      const { data, error } = await supabase
        .rpc('get_company_monthly_sales_stats');

      if (error) throw error;

      // Filter by company and limit to last 6 months
      const companyData = (data || []).filter(d => d.company_id === company.id);
      const last6Months = companyData.slice(-6);
      setMonthlySales(last6Months);
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
      toast({
        title: 'Error al cargar tendencia',
        description: 'No se pudo cargar la tendencia de ventas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Calcular % de crecimiento
  const fetchTopProducts = async () => {
    if (!company) return;

    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .rpc('get_company_product_sales_stats');

      if (error) throw error;

      // Filter by company
      const companyProducts = (data || []).filter(d => d.company_id === company.id);
      setTopProducts(companyProducts);
    } catch (error) {
      console.error('Error fetching top products:', error);
      toast({
        title: 'Error al cargar productos',
        description: 'No se pudo cargar el ranking de productos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return { value: 0, isPositive: false, isNew: false };
      return { value: 100, isPositive: true, isNew: true };
    }
    const growth = ((current - previous) / previous) * 100;
    return { value: Math.abs(growth), isPositive: growth >= 0, isNew: false };
  };

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

  const getActivityStatusBadge = (status: 'new' | 'active' | 'cooling' | 'at_risk' | 'churned', daysAgo: number | null) => {
    let badgeElement;
    switch (status) {
      case 'new':
        badgeElement = <Badge variant="default" className="bg-blue-500">Nuevo</Badge>;
        break;
      case 'active':
        badgeElement = <Badge variant="default" className="bg-green-500">Activo</Badge>;
        break;
      case 'cooling':
        badgeElement = <Badge variant="default" className="bg-yellow-500">En enfriamiento</Badge>;
        break;
      case 'at_risk':
        badgeElement = <Badge variant="destructive">En riesgo</Badge>;
        break;
      case 'churned':
        badgeElement = <Badge variant="secondary">Inactivo</Badge>;
        break;
      default:
        badgeElement = <Badge variant="secondary">{status}</Badge>;
    }

    return (
      <div className="flex items-center space-x-2">
        {badgeElement}
        {daysAgo !== null && (
          <span className="text-sm text-muted-foreground">
            (última venta hace {daysAgo} días)
          </span>
        )}
      </div>
    );
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
          {/* Alertas de límites */}
          {!isLoadingLimits && limitsStatus && limitsStatus.overall_status !== 'ok' && limitsStatus.overall_status !== 'no_plan' && (
            <Alert variant={limitsStatus.overall_status === 'over_limit' ? 'destructive' : 'default'} 
                   className={limitsStatus.overall_status === 'near_limit' ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950' : ''}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {limitsStatus.overall_status === 'over_limit' && (
                  <div>
                    <strong>¡Límite superado!</strong> Esta empresa ha superado uno o más límites de su plan:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {limitsStatus.users.status === 'over_limit' && (
                        <li>Usuarios: {limitsStatus.users.used} / {limitsStatus.users.limit} ({limitsStatus.users.usage_pct}%)</li>
                      )}
                      {limitsStatus.branches.status === 'over_limit' && (
                        <li>Sucursales: {limitsStatus.branches.used} / {limitsStatus.branches.limit} ({limitsStatus.branches.usage_pct}%)</li>
                      )}
                      {limitsStatus.documents.status === 'over_limit' && (
                        <li>Documentos este mes: {limitsStatus.documents.used} / {limitsStatus.documents.limit} ({limitsStatus.documents.usage_pct}%)</li>
                      )}
                    </ul>
                  </div>
                )}
                {limitsStatus.overall_status === 'near_limit' && (
                  <div>
                    <strong>Cerca del límite</strong> - Esta empresa está alcanzando los límites de su plan:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {limitsStatus.users.status === 'near_limit' && (
                        <li>Usuarios: {limitsStatus.users.used} / {limitsStatus.users.limit} ({limitsStatus.users.usage_pct}%)</li>
                      )}
                      {limitsStatus.branches.status === 'near_limit' && (
                        <li>Sucursales: {limitsStatus.branches.used} / {limitsStatus.branches.limit} ({limitsStatus.branches.usage_pct}%)</li>
                      )}
                      {limitsStatus.documents.status === 'near_limit' && (
                        <li>Documentos este mes: {limitsStatus.documents.used} / {limitsStatus.documents.limit} ({limitsStatus.documents.usage_pct}%)</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Plan & Suscripción */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Plan y Suscripción</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditSubscriptionOpen(true)}
                >
                  Cambiar plan / estado
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPlan ? (
                <p className="text-muted-foreground text-sm">Cargando plan...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan actual</p>
                    {plan ? (
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">({plan.code})</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin plan asignado</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estado de suscripción</p>
                    {company.subscription_status ? (
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
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Periodo de facturación</p>
                    {company.billing_period ? (
                      <p className="font-medium">
                        {company.billing_period === 'monthly' ? 'Mensual' : 'Anual'}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fin de prueba</p>
                    {company.trial_end_at ? (
                      <p className="font-medium text-sm">
                        {format(new Date(company.trial_end_at), 'PP', { locale: es })}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uso vs límites del plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Uso vs Límites del Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!plan ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">Esta empresa no tiene un plan asignado actualmente.</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditSubscriptionOpen(true)}
                  >
                    Asignar plan
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Usuarios */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>Usuarios</span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">{usage?.users_count || 0}</span>
                        {plan.limits?.max_users ? (
                          <span className="text-sm text-muted-foreground">/ {plan.limits.max_users}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">/ ∞</span>
                        )}
                      </div>
                      {plan.limits?.max_users && (
                        <>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                ((usage?.users_count || 0) / plan.limits.max_users) * 100 >= 90
                                  ? 'bg-red-500'
                                  : ((usage?.users_count || 0) / plan.limits.max_users) * 100 >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(((usage?.users_count || 0) / plan.limits.max_users) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p className={`text-xs font-medium ${
                            ((usage?.users_count || 0) / plan.limits.max_users) * 100 >= 90
                              ? 'text-red-600'
                              : ((usage?.users_count || 0) / plan.limits.max_users) * 100 >= 70
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            Uso: {(((usage?.users_count || 0) / plan.limits.max_users) * 100).toFixed(0)}%
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sucursales */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>Sucursales</span>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">{usage?.branches_count || 0}</span>
                        {plan.limits?.max_branches ? (
                          <span className="text-sm text-muted-foreground">/ {plan.limits.max_branches}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">/ ∞</span>
                        )}
                      </div>
                      {plan.limits?.max_branches && (
                        <>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                ((usage?.branches_count || 0) / plan.limits.max_branches) * 100 >= 90
                                  ? 'bg-red-500'
                                  : ((usage?.branches_count || 0) / plan.limits.max_branches) * 100 >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(((usage?.branches_count || 0) / plan.limits.max_branches) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p className={`text-xs font-medium ${
                            ((usage?.branches_count || 0) / plan.limits.max_branches) * 100 >= 90
                              ? 'text-red-600'
                              : ((usage?.branches_count || 0) / plan.limits.max_branches) * 100 >= 70
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            Uso: {(((usage?.branches_count || 0) / plan.limits.max_branches) * 100).toFixed(0)}%
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documentos este mes */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>Documentos este mes</span>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">{usage?.documents_this_month || 0}</span>
                        {plan.limits?.max_documents_per_month ? (
                          <span className="text-sm text-muted-foreground">/ {plan.limits.max_documents_per_month}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">/ ∞</span>
                        )}
                      </div>
                      {plan.limits?.max_documents_per_month && (
                        <>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                ((usage?.documents_this_month || 0) / plan.limits.max_documents_per_month) * 100 >= 90
                                  ? 'bg-red-500'
                                  : ((usage?.documents_this_month || 0) / plan.limits.max_documents_per_month) * 100 >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(((usage?.documents_this_month || 0) / plan.limits.max_documents_per_month) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p className={`text-xs font-medium ${
                            ((usage?.documents_this_month || 0) / plan.limits.max_documents_per_month) * 100 >= 90
                              ? 'text-red-600'
                              : ((usage?.documents_this_month || 0) / plan.limits.max_documents_per_month) * 100 >= 70
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            Uso: {(((usage?.documents_this_month || 0) / plan.limits.max_documents_per_month) * 100).toFixed(0)}%
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Módulos Habilitados */}
          <CompanyModulesManager 
            companyId={company.id}
            initialModules={enabledModules}
            onSave={fetchEnabledModules}
          />

          {/* Configuración Fiscal (Dataico) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Landmark className="h-5 w-5" />
                <span>Configuración Fiscal (Dataico)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataicoAccountId">Account ID</Label>
                  <Input
                    id="dataicoAccountId"
                    placeholder="ID de cuenta en Dataico"
                    value={dataicoAccountId}
                    onChange={(e) => setDataicoAccountId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataicoStatus">Estado</Label>
                  <Select value={dataicoStatus} onValueChange={setDataicoStatus}>
                    <SelectTrigger id="dataicoStatus">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente de activación</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="error">Error de conexión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataicoAuthToken">Auth Token</Label>
                <div className="relative">
                  <Input
                    id="dataicoAuthToken"
                    type={showDataicoToken ? 'text' : 'password'}
                    placeholder="Token de autenticación"
                    value={dataicoAuthToken}
                    onChange={(e) => setDataicoAuthToken(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowDataicoToken(!showDataicoToken)}
                  >
                    {showDataicoToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este token se almacena de forma segura y no se muestra en la interfaz
                </p>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveDataicoConfig} 
                  disabled={isSavingDataico}
                  size="sm"
                >
                  {isSavingDataico && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar Configuración Fiscal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Summary con comparación de períodos */}
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Estado de actividad */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Estado de la empresa:</p>
                  {getActivityStatusBadge(usage.activity_status, usage.days_since_last_order)}
                  {!usage.last_order_at && usage.total_orders === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">Sin ventas registradas aún</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Órdenes Totales</span>
                    </div>
                    <p className="text-2xl font-bold">{usage.total_orders}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>Ventas Totales</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(usage.total_sales_amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Órdenes (30 días)</span>
                    </div>
                    <p className="text-2xl font-bold">{usage.total_orders_last_30d}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>Ventas (30 días)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold">{formatCurrency(usage.total_sales_last_30d)}</p>
                      {(() => {
                        const growth = calculateGrowth(usage.total_sales_last_30d, usage.total_sales_prev_30d);
                        if (growth.isNew) {
                          return <Badge variant="default" className="text-xs">Nuevo</Badge>;
                        }
                        if (growth.value === 0) return null;
                        return (
                          <div className={`flex items-center space-x-1 text-sm font-medium ${growth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {growth.isPositive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                            <span>{growth.value.toFixed(1)}%</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                {usage.last_order_at && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Última venta: {format(new Date(usage.last_order_at), 'PPp', { locale: es })}
                    </p>
                  </div>
                )}
                {!usage.last_order_at && usage.total_orders === 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Sin ventas registradas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gráfico de tendencia de ventas (últimos 6 meses) */}
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendencia de Ventas (Últimos 6 Meses)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingChart ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Cargando gráfico...</p>
                  </div>
                ) : monthlySales.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No hay datos de ventas mensuales disponibles</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month_label" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total_sales_month" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Ventas"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}

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

          {/* Top Productos por Cantidad */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Productos por Cantidad (Últimos 30 Días)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <p className="text-muted-foreground text-sm">Cargando top productos...</p>
              ) : topProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Todavía no hay ventas registradas para esta empresa.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Producto</th>
                        <th className="text-right py-2 font-medium">Cantidad (30d)</th>
                        <th className="text-right py-2 font-medium">Total Histórico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts
                        .sort((a, b) => b.total_quantity_last_30d - a.total_quantity_last_30d)
                        .slice(0, 10)
                        .map((product) => (
                          <tr key={product.product_id} className="border-b">
                            <td className="py-2">{product.product_name}</td>
                            <td className="text-right py-2 font-medium">{product.total_quantity_last_30d}</td>
                            <td className="text-right py-2 text-muted-foreground">{product.total_quantity_sold}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Productos por Facturación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Productos por Facturación (Últimos 30 Días)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <p className="text-muted-foreground text-sm">Cargando top productos...</p>
              ) : topProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Todavía no hay ventas registradas para esta empresa.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Producto</th>
                        <th className="text-right py-2 font-medium">Ventas (30d)</th>
                        <th className="text-right py-2 font-medium">Total Histórico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts
                        .sort((a, b) => b.total_sales_last_30d - a.total_sales_last_30d)
                        .slice(0, 10)
                        .map((product) => (
                          <tr key={product.product_id} className="border-b">
                            <td className="py-2">{product.product_name}</td>
                            <td className="text-right py-2 font-medium">{formatCurrency(product.total_sales_last_30d)}</td>
                            <td className="text-right py-2 text-muted-foreground">{formatCurrency(product.total_sales_amount)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de edición de suscripción */}
        <EditCompanySubscriptionModal
          company={company}
          plan={plan}
          open={isEditSubscriptionOpen}
          onClose={(refreshNeeded) => {
            setIsEditSubscriptionOpen(false);
            if (refreshNeeded) {
              fetchPlan();
              fetchLimitsStatus();
              onClose(); // Cerrar el modal principal para refrescar la lista
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
