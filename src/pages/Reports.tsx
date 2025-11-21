import React from 'react';
import { BarChart3 } from 'lucide-react';
import { SalesReports } from '@/components/pos/SalesReports';

export const Reports: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Reportes de Ventas
        </h1>
        <p className="text-muted-foreground">
          Analiza el rendimiento y estadísticas del negocio
        </p>
      </div>
      <SalesReports />
    </div>
  );
};

export default Reports;
