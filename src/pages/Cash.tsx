import React from 'react';
import { DollarSign, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CashManager } from '@/components/pos/CashManager';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';

export const Cash: React.FC = () => {
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
            <BreadcrumbPage>Caja</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <DollarSign className="h-8 w-8" />
          Gestión de Caja
        </h1>
        <p className="text-muted-foreground">
          Controla la apertura, cierre y movimientos de caja
        </p>
      </div>
      <CashManager />
    </div>
  );
};

export default Cash;
