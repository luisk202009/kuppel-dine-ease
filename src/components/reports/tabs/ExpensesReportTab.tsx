import React from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useExpensesReport } from '@/hooks/useReportsData';
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

interface ExpensesReportTabProps {
  dateRange: DateRange | undefined;
}

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    supplies: 'bg-blue-50 text-blue-700',
    salaries: 'bg-purple-50 text-purple-700',
    rent: 'bg-orange-50 text-orange-700',
    utilities: 'bg-cyan-50 text-cyan-700',
    marketing: 'bg-pink-50 text-pink-700',
    general: 'bg-zinc-100 text-zinc-700',
  };

  const labels: Record<string, string> = {
    supplies: 'Insumos',
    salaries: 'Salarios',
    rent: 'Renta',
    utilities: 'Servicios',
    marketing: 'Marketing',
    general: 'General',
  };

  return (
    <Badge className={`${colors[category] || colors.general} hover:${colors[category] || colors.general} border-0`}>
      {labels[category] || category}
    </Badge>
  );
};

export const ExpensesReportTab: React.FC<ExpensesReportTabProps> = ({ dateRange }) => {
  const { data, isLoading } = useExpensesReport(dateRange);

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

  if (!data || data.expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <ReportKPICard title="Total Gastos" value={0} isCurrency />
          <ReportKPICard title="Gasto Promedio" value={0} isCurrency />
          <ReportKPICard title="N° Gastos" value={0} />
        </div>
        <EmptyState message="No hay gastos en este periodo" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-6">
        <ReportKPICard title="Total Gastos" value={data.totalExpenses} isCurrency />
        <ReportKPICard title="Gasto Promedio" value={Math.round(data.avgExpense)} isCurrency />
        <ReportKPICard title="N° Gastos" value={data.expensesCount} />
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Fecha</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Descripción</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Categoría</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.expenses.map((expense) => (
              <TableRow key={expense.id} className="h-12 hover:bg-zinc-50 border-b border-zinc-100">
                <TableCell className="text-zinc-500">
                  {format(new Date(expense.created_at), 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell className="text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                  {expense.description || '-'}
                </TableCell>
                <TableCell>
                  {getCategoryBadge(expense.category)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-red-600">
                  -${expense.amount.toLocaleString('es-MX')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
