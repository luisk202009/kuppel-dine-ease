import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, TrendingUp, ShoppingCart, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Cargar datos mensuales y productos cuando se abre el modal
  useEffect(() => {
    if (open && company) {
      fetchMonthlySales();
      fetchTopProducts();
    }
  }, [open, company]);

  const fetchMonthlySales = async () => {
    if (!company) return;

    try {
      setIsLoadingChart(true);
      const { data, error } = await supabase
        .from('company_monthly_sales_stats')
        .select('*')
        .eq('company_id', company.id)
        .order('year_month', { ascending: true });

      if (error) throw error;

      // Limitar a los últimos 6 meses
      const last6Months = (data || []).slice(-6);
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
        .from('company_product_sales_stats')
        .select('*')
        .eq('company_id', company.id);

      if (error) throw error;

      setTopProducts(data || []);
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
          {/* Usage Summary con comparación de períodos */}
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Uso</CardTitle>
              </CardHeader>
              <CardContent>
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
      </DialogContent>
    </Dialog>
  );
};
