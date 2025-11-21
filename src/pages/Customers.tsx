import { Users } from 'lucide-react';
import { CustomerManager } from '@/components/pos/CustomerManager';

export default function Customers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Gestión de Clientes
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra la información de tus clientes y su historial
        </p>
      </div>
      <CustomerManager />
    </div>
  );
}
