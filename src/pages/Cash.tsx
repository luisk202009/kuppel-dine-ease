import { DollarSign } from 'lucide-react';
import { CashManager } from '@/components/pos/CashManager';

export default function Cash() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Gestión de Caja
        </h1>
        <p className="text-muted-foreground mt-2">
          Controla la apertura, cierre y movimientos de caja
        </p>
      </div>
      <CashManager />
    </div>
  );
}
