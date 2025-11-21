import { Receipt } from 'lucide-react';
import { OrderHistory } from '@/components/pos/OrderHistory';

export default function Orders() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Historial de Órdenes
        </h1>
        <p className="text-muted-foreground mt-2">
          Consulta y gestiona todas las órdenes procesadas
        </p>
      </div>
      <OrderHistory />
    </div>
  );
}
