import React from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useTransactionsReport } from '@/hooks/useReportsData';
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
import { cn } from '@/lib/utils';

interface TransactionLogsTabProps {
  dateRange: DateRange | undefined;
}

export const TransactionLogsTab: React.FC<TransactionLogsTabProps> = ({ dateRange }) => {
  const { data, isLoading } = useTransactionsReport(dateRange);

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

  if (!data || data.transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <ReportKPICard title="Flujo Neto" value={0} isCurrency />
          <ReportKPICard title="Total Entradas" value={0} isCurrency />
          <ReportKPICard title="Total Salidas" value={0} isCurrency />
        </div>
        <EmptyState message="No hay transacciones en este periodo" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-6">
        <ReportKPICard 
          title="Flujo Neto" 
          value={data.netFlow} 
          isCurrency 
          className={data.netFlow >= 0 ? '' : 'border-red-200'}
        />
        <ReportKPICard title="Total Entradas" value={data.totalIncome} isCurrency />
        <ReportKPICard title="Total Salidas" value={data.totalExpenses} isCurrency />
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Fecha</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Tipo</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Concepto</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.transactions.map((transaction) => (
              <TableRow key={transaction.id} className="h-12 hover:bg-zinc-50 border-b border-zinc-100">
                <TableCell className="text-zinc-500">
                  {format(new Date(transaction.date), 'dd MMM yyyy, HH:mm', { locale: es })}
                </TableCell>
                <TableCell>
                  {transaction.type === 'income' ? (
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 gap-1">
                      <ArrowDownLeft className="h-3 w-3" />
                      Entrada
                    </Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-0 gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      Salida
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                  {transaction.concept}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-medium",
                  transaction.type === 'income' ? "text-emerald-600" : "text-red-600"
                )}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('es-MX')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
