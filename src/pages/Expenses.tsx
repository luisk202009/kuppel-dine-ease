import React from 'react';
import { CreditCard, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExpenseManager } from '@/components/pos/ExpenseManager';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';

export const Expenses: React.FC = () => {
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
            <BreadcrumbPage>Gastos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          Gestión de Gastos
        </h1>
        <p className="text-muted-foreground">
          Registra y administra los gastos del negocio
        </p>
      </div>
      <ExpenseManager />
    </div>
  );
};

export default Expenses;
