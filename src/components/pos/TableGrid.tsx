import React from 'react';
import { Users, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Area, Table } from '@/types/pos';
import { usePOS } from '@/contexts/POSContext';

interface TableGridProps {
  area: Area;
}

export const TableGrid: React.FC<TableGridProps> = ({ area }) => {
  const { selectTable, posState } = usePOS();

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'table-available';
      case 'occupied':
        return 'table-occupied';
      case 'pending':
        return 'table-pending';
      case 'reserved':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700/50 dark:text-blue-300';
      default:
        return 'table-available';
    }
  };

  const getStatusIcon = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'occupied':
        return <Users className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'reserved':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'pending':
        return 'Pendiente';
      case 'reserved':
        return 'Reservada';
      default:
        return 'Disponible';
    }
  };

  const handleTableSelect = (table: Table) => {
    selectTable(table);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {area.tables.map((table) => (
        <Card
          key={table.id}
          className={`pos-card-interactive ${getStatusColor(table.status)} ${
            posState.selectedTable?.id === table.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => handleTableSelect(table)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{table.name}</h3>
              {getStatusIcon(table.status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Capacidad:</span>
                <span className="font-medium">{table.capacity} personas</span>
              </div>
              
              {table.customers && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clientes:</span>
                  <span className="font-medium">{table.customers} personas</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant="outline" className="text-xs">
                  {getStatusText(table.status)}
                </Badge>
              </div>
              
              {table.waiter && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mesero:</span>
                  <span className="font-medium">{table.waiter}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {area.tables.length === 0 && (
        <div className="col-span-full">
          <Card className="pos-card">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay mesas en esta área
              </h3>
              <p className="text-muted-foreground">
                Contacta al administrador para agregar mesas en {area.name}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TableGrid;