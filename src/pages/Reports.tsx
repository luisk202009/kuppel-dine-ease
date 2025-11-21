import React from 'react';
import { BarChart3, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SalesReports } from '@/components/pos/SalesReports';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';

export const Reports: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Inicio
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Reportes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
