import React from 'react';
import { History } from 'lucide-react';
import { OrderHistory } from '@/components/pos/OrderHistory';

export const Orders: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
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
