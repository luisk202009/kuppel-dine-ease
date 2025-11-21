import { BarChart3 } from 'lucide-react';
import { SalesReports } from '@/components/pos/SalesReports';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Reportes de Ventas
        </h1>
        <p className="text-muted-foreground mt-2">
          Analiza el rendimiento y estadísticas del negocio
        </p>
      </div>
      <SalesReports />
    </div>
  );
}
