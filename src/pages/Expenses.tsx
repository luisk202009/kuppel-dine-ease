import { CreditCard } from 'lucide-react';
import { ExpenseManager } from '@/components/pos/ExpenseManager';

export default function Expenses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Gestión de Gastos
        </h1>
        <p className="text-muted-foreground mt-2">
          Registra y administra los gastos del negocio
        </p>
      </div>
      <ExpenseManager />
    </div>
  );
}
