import React from 'react';
import { DollarSign } from 'lucide-react';
import { CashManager } from '@/components/pos/CashManager';

export const Cash: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
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
