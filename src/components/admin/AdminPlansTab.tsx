import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AdminPlanModal } from './AdminPlanModal';
import { Tables } from '@/integrations/supabase/types';

type Plan = Tables<'plans'>;

interface PlanLimits {
  max_users?: number | null;
  max_branches?: number | null;
  max_documents_per_month?: number | null;
}

export const AdminPlansTab: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error al cargar planes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatLimits = (limits: Plan['limits']) => {
    if (!limits || typeof limits !== 'object') return 'Sin límites definidos';
    
    const planLimits = limits as PlanLimits;
    const parts: string[] = [];
    if (planLimits.max_users) parts.push(`Usuarios: ${planLimits.max_users}`);
    if (planLimits.max_branches) parts.push(`Sucursales: ${planLimits.max_branches}`);
    if (planLimits.max_documents_per_month) parts.push(`Docs/mes: ${planLimits.max_documents_per_month}`);
    
    return parts.length > 0 ? parts.join(' · ') : 'Sin límites definidos';
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleModalClose = (shouldRefresh: boolean) => {
    setIsModalOpen(false);
    setSelectedPlan(null);
    if (shouldRefresh) {
      fetchPlans();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Planes</h2>
          <p className="text-muted-foreground">
            Gestiona los planes de suscripción disponibles para las empresas
          </p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Planes</CardTitle>
          <CardDescription>
            Filtra los planes por nombre o código
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Planes Registrados ({filteredPlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando planes...
            </div>
          ) : filteredPlans.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchTerm
                  ? 'No se encontraron planes con ese criterio de búsqueda.'
                  : 'No hay planes registrados. Crea el primer plan.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Precio Mensual</TableHead>
                    <TableHead>Precio Anual</TableHead>
                    <TableHead>Periodo por Defecto</TableHead>
                    <TableHead>Límites</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{plan.code}</code>
                      </TableCell>
                      <TableCell>{formatPrice(plan.price_monthly, plan.currency)}</TableCell>
                      <TableCell>{formatPrice(plan.price_yearly, plan.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={plan.billing_interval_default === 'monthly' ? 'default' : 'secondary'}>
                          {plan.billing_interval_default === 'monthly' ? 'Mensual' : 'Anual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLimits(plan.limits)}
                      </TableCell>
                      <TableCell>
                        {plan.is_active ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <AdminPlanModal
        plan={selectedPlan}
        open={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};
