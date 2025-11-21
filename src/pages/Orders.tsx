import React from 'react';
import { History, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OrderHistory } from '@/components/pos/OrderHistory';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';

export const Orders: React.FC = () => {
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
            <BreadcrumbPage>Órdenes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <History className="h-8 w-8" />
          Historial de Órdenes
        </h1>
        <p className="text-muted-foreground">
          Consulta y gestiona todas las órdenes procesadas
        </p>
      </div>
      <OrderHistory />
    </div>
  );
};

export default Orders;
