import React from 'react';
import { DateRange } from 'react-day-picker';
import { useProductsReport } from '@/hooks/useReportsData';
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

interface ProductPerformanceTabProps {
  dateRange: DateRange | undefined;
}

export const ProductPerformanceTab: React.FC<ProductPerformanceTabProps> = ({ dateRange }) => {
  const { data, isLoading } = useProductsReport(dateRange);

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

  if (!data || data.products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <ReportKPICard title="Producto Top" value="-" />
          <ReportKPICard title="Ingreso Total" value={0} isCurrency />
          <ReportKPICard title="Unidades Vendidas" value={0} />
        </div>
        <EmptyState message="No hay ventas de productos en este periodo" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-6">
        <ReportKPICard 
          title="Producto Top" 
          value={data.topProduct} 
          subtitle="Más vendido"
        />
        <ReportKPICard title="Ingreso Total" value={data.totalRevenue} isCurrency />
        <ReportKPICard title="Unidades Vendidas" value={data.totalUnitsSold} />
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Producto</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium">Categoría</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium text-center">Unidades</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium text-center">Stock</TableHead>
              <TableHead className="text-xs uppercase text-zinc-500 font-medium text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.products.map((product) => (
              <TableRow key={product.id} className="h-12 hover:bg-zinc-50 border-b border-zinc-100">
                <TableCell className="text-zinc-900 dark:text-zinc-100 font-medium">
                  {product.name}
                </TableCell>
                <TableCell>
                  <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-0">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono text-zinc-600">
                  {product.units_sold}
                </TableCell>
                <TableCell className={cn(
                  "text-center font-mono",
                  product.stock < 10 ? "text-red-600 font-medium" : "text-zinc-600"
                )}>
                  {product.stock}
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-emerald-600">
                  ${product.total_revenue.toLocaleString('es-MX')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
