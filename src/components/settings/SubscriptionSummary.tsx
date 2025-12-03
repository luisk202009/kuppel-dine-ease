import React from 'react';
import { CreditCard, Calendar, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSubscriptions, SubscriptionWithPlan } from '@/hooks/useSubscriptions';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const formatPrice = (price: number | null, currency: string = 'COP') => {
  if (price === null) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { 
      label: 'Activo', 
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
    },
    trialing: { 
      label: 'Periodo de prueba', 
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
    },
    past_due: { 
      label: 'Pago pendiente', 
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
    },
    canceled: { 
      label: 'Cancelado', 
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
    },
    expired: { 
      label: 'Expirado', 
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' 
    },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

const getPaymentStatusBadge = (status: string) => {
  if (status === 'active') {
    return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Aprobado</Badge>;
  }
  if (status === 'past_due') {
    return <Badge variant="destructive">Rechazado</Badge>;
  }
  return <Badge variant="secondary">Pendiente</Badge>;
};

interface SubscriptionCardProps {
  subscription: SubscriptionWithPlan;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
  const plan = subscription.plans;
  const planName = plan?.name || 'Sin plan';
  const price = subscription.billing_period === 'yearly' 
    ? plan?.price_yearly 
    : plan?.price_monthly;
  const currency = plan?.currency || 'COP';
  
  const nextBillingDate = parseISO(subscription.current_period_end);
  const daysUntilRenewal = differenceInDays(nextBillingDate, new Date());
  const isExpiringSoon = daysUntilRenewal <= 7 && daysUntilRenewal >= 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">{planName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm">
              Actualizar mi plan
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Ver historial de pagos</DropdownMenuItem>
                <DropdownMenuItem>Descargar factura</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Cancelar suscripción
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Estado</span>
            <div className="flex items-center gap-2">
              {getStatusBadge(subscription.status)}
              <span className="text-sm text-muted-foreground">en plan {planName}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-semibold text-foreground">
              {formatPrice(price, currency)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Frecuencia de pago</span>
            <span className="text-foreground">
              {subscription.billing_period === 'monthly' ? 'Mensual' : 'Anual'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Estado de pago</span>
            {getPaymentStatusBadge(subscription.status)}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Próximo cobro</span>
            <span className={`flex items-center gap-2 ${isExpiringSoon ? 'text-destructive' : 'text-foreground'}`}>
              <Calendar className="h-4 w-4" />
              {format(nextBillingDate, "d 'de' MMMM, yyyy", { locale: es })}
              {isExpiringSoon && (
                <AlertCircle className="h-4 w-4" />
              )}
            </span>
          </div>

          {subscription.trial_end_at && subscription.status === 'trialing' && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fin del periodo de prueba</span>
              <span className="text-foreground">
                {format(parseISO(subscription.trial_end_at), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Warning banner for expiring soon */}
        {isExpiringSoon && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Tu suscripción vence en {daysUntilRenewal} {daysUntilRenewal === 1 ? 'día' : 'días'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const SubscriptionSummary: React.FC = () => {
  const { subscriptions, isLoading, error } = useSubscriptions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Error al cargar las suscripciones</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Resumen</h3>
        <p className="text-sm text-muted-foreground">
          Visualiza tu información de pagos, suscripciones y planes activos
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Sin suscripciones activas
            </h3>
            <p className="text-muted-foreground mb-4">
              Aún no tienes ninguna suscripción asociada a tu cuenta
            </p>
            <Button>Explorar planes</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.id} subscription={subscription} />
          ))}
        </div>
      )}
    </div>
  );
};
