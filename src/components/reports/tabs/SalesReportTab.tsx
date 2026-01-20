import React from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, Banknote, ArrowRightLeft, Wallet } from 'lucide-react';
import { useSalesReport } from '@/hooks/useReportsData';
import { ReportKPICard } from '../ReportKPICard';
import { EmptyState } from '../EmptyState';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesReportTabProps {
  dateRange: DateRange | undefined;
}

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return <Banknote className="h-3.5 w-3.5" />;
    case 'card':
      return <CreditCard className="h-3.5 w-3.5" />;
    case 'transfer':
      return <ArrowRightLeft className="h-3.5 w-3.5" />;
    default:
      return <Wallet className="h-3.5 w-3.5" />;
  }
};

const getPaymentLabel = (method: string) => {
  switch (method) {
    case 'cash': return 'Efectivo';
    case 'card': return 'Tarjeta';
    case 'transfer': return 'Transferencia';
    case 'credit': return 'Crédito';
    default: return method;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0">Pagado</Badge>;
    case 'pending':
      return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-0">Pendiente</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-0">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const SalesReportTab: React.FC<SalesReportTabProps> = ({ dateRange }) => {
  const { data, isLoading } = useSalesReport(dateRange);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <ReportKPICard title="Total Ventas" value={0} isCurrency />
          <ReportKPICard title="Ticket Promedio" value={0} isCurrency />
          <ReportKPICard title="N° Pedidos" value={0} />
        </div>
        <EmptyState message="No hay ventas en este periodo" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-6">
        <ReportKPICard title="Total Ventas" value={data.totalSales} isCurrency />
        <ReportKPICard title="Ticket Promedio" value={Math.round(data.avgTicket)} isCurrency />
        <ReportKPICard title="N° Pedidos" value={data.ordersCount} />
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">ID</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Fecha</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Cliente</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Método</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Estado</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.orders.map((order) => (
              <TableRow key={order.id} className="h-12 hover:bg-zinc-50 border-b border-zinc-100">
                <TableCell className="font-mono text-sm text-zinc-600">
                  #{order.id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-zinc-500">
                  {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                </TableCell>
                <TableCell className="text-zinc-900 dark:text-zinc-100">
                  {order.customer_name || 'Cliente general'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    {getPaymentIcon(order.payment_method)}
                    <span className="text-sm">{getPaymentLabel(order.payment_method)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  ${order.total.toLocaleString('es-MX')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
