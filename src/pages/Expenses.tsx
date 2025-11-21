import React from 'react';
import { CreditCard } from 'lucide-react';
import { ExpenseManager } from '@/components/pos/ExpenseManager';

export const Expenses: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
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
