import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanySubscriptionHistory } from '@/hooks/useAdminSubscriptions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: 'Activo', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    trialing: { label: 'Prueba', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    past_due: { label: 'Pago pendiente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    expired: { label: 'Expirado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  };
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

const formatPrice = (price: number | null, currency: string = 'COP') => {
  if (price === null) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const SubscriptionHistoryModal: React.FC<SubscriptionHistoryModalProps> = ({
  open,
  onOpenChange,
  companyId,
}) => {
  const { history, isLoading } = useCompanySubscriptionHistory(companyId);

  // Fetch company name
  const { data: company } = useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from('companies').select('name').eq('id', companyId).single();
      return data;
    },
    enabled: !!companyId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Historial de Suscripciones - {company?.name || 'Empresa'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay historial de suscripciones para esta empresa
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((sub, index) => (
                <TableRow key={sub.id} className={index === 0 ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium">
                    {index === 0 && <Badge className="mr-2">Actual</Badge>}
                    {history.length - index}
                  </TableCell>
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
                  <TableCell>
                    {formatPrice(
                      sub.billing_period === 'monthly' ? sub.plans?.price_monthly : sub.plans?.price_yearly,
                      sub.plans?.currency
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-32 truncate">
                    {sub.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
