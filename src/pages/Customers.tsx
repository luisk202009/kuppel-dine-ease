import React from 'react';
import { Users } from 'lucide-react';
import { CustomerManager } from '@/components/pos/CustomerManager';

export const Customers: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
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
