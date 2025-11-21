import React from 'react';
import { Users, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerManager } from '@/components/pos/CustomerManager';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';

export const Customers: React.FC = () => {
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
            <BreadcrumbPage>Clientes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Users className="h-8 w-8" />
          Gestión de Clientes
        </h1>
        <p className="text-muted-foreground">
          Administra la información de tus clientes
        </p>
      </div>
      <CustomerManager />
    </div>
  );
};

export default Customers;
