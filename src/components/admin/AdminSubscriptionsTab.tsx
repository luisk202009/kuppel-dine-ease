import React, { useState } from 'react';
import { CreditCard, Calendar, Eye, RefreshCw, XCircle, AlertCircle, CheckCircle, Clock, Ban, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSubscriptions, SubscriptionFilters } from '@/hooks/useAdminSubscriptions';
import { SubscriptionHistoryModal } from './SubscriptionHistoryModal';
import { CreateSubscriptionModal } from './CreateSubscriptionModal';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    active: { 
      label: 'Activo', 
      icon: <CheckCircle className="h-3 w-3" />,
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
    },
    trialing: { 
      label: 'Prueba', 
      icon: <Clock className="h-3 w-3" />,
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
    },
    past_due: { 
      label: 'Pago pendiente', 
      icon: <AlertCircle className="h-3 w-3" />,
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
    },
    canceled: { 
      label: 'Cancelado', 
      icon: <Ban className="h-3 w-3" />,
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
    },
    expired: { 
      label: 'Expirado', 
      icon: <XCircle className="h-3 w-3" />,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
    },
    superseded: { 
      label: 'Reemplazada', 
      icon: <RefreshCw className="h-3 w-3" />,
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400' 
    },
  };

  const config = statusConfig[status] || { label: status, icon: null, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

export const AdminSubscriptionsTab: React.FC = () => {
  const [filters, setFilters] = useState<SubscriptionFilters>({
    status: 'all',
    plan: 'all',
    expiration: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { subscriptions, stats, isLoading, refetch } = useAdminSubscriptions(filters);

  // Fetch plans for filter
  const { data: plans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await supabase.from('plans').select('id, name, code').eq('is_active', true);
      return data || [];
    },
  });

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchTerm) return true;
    const companyName = sub.companies?.name?.toLowerCase() || '';
    const planName = sub.plans?.name?.toLowerCase() || '';
    return companyName.includes(searchTerm.toLowerCase()) || planName.includes(searchTerm.toLowerCase());
  });

  const handleViewHistory = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setHistoryModalOpen(true);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    const { error } = await supabase
      .from('company_subscriptions')
      .update({ status: 'canceled', cancel_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo cancelar la suscripción', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Suscripción cancelada' });
      refetch();
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    const { error } = await supabase
      .from('company_subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la suscripción', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Suscripción eliminada permanentemente' });
      refetch();
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date());
    if (days < 0) return <span className="text-destructive font-medium">Vencido hace {Math.abs(days)} días</span>;
    if (days === 0) return <span className="text-destructive font-medium">Vence hoy</span>;
    if (days <= 7) return <span className="text-yellow-600 dark:text-yellow-400 font-medium">{days} días</span>;
    return <span className="text-muted-foreground">{days} días</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.trialing}</p>
                <p className="text-xs text-muted-foreground">Prueba</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pastDue}</p>
                <p className="text-xs text-muted-foreground">Pago pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">Expiradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
                <p className="text-xs text-muted-foreground">Vencen en 7d</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suscripciones
          </CardTitle>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva suscripción
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Input
              placeholder="Buscar por empresa o plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filters.status} onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="trialing">Prueba</SelectItem>
                <SelectItem value="past_due">Pago pendiente</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.plan} onValueChange={(value) => setFilters(f => ({ ...f, plan: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                {plans?.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.expiration} onValueChange={(value) => setFilters(f => ({ ...f, expiration: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Vencimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="7days">Próximos 7 días</SelectItem>
                <SelectItem value="30days">Próximos 30 días</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Días restantes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron suscripciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.companies?.name || 'N/A'}</TableCell>
                      <TableCell>{sub.plans?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sub.billing_period === 'monthly' ? 'Mensual' : 'Anual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(parseISO(sub.current_period_start), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(sub.current_period_end), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>{getDaysRemaining(sub.current_period_end)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewHistory(sub.company_id)}
                            title="Ver historial"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {sub.status !== 'canceled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelSubscription(sub.id)}
                              title="Cancelar"
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Eliminar permanentemente"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar suscripción?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente la suscripción de "{sub.companies?.name}".
                                  El cliente ya no verá esta suscripción. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSubscription(sub.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* History Modal */}
      <SubscriptionHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        companyId={selectedCompanyId}
      />

      {/* Create Modal */}
      <CreateSubscriptionModal
        open={createModalOpen}
        onClose={(refresh) => {
          setCreateModalOpen(false);
          if (refresh) refetch();
        }}
      />
    </div>
  );
};
