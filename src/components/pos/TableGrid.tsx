import React, { useState } from 'react';
import { Users, Clock, CheckCircle2, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Area, Table } from '@/types/pos';
import { usePOS } from '@/contexts/POSContext';
import { CreateTableDialog } from './CreateTableDialog';
import { EditTableDialog } from './EditTableDialog';
import { DeleteTableDialog } from './DeleteTableDialog';

interface TableGridProps {
  area: Area;
}

export const TableGrid: React.FC<TableGridProps> = ({ area }) => {
  const { selectTable, posState, authState } = usePOS();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [availableAreas, setAvailableAreas] = useState<{ id: string; name: string }[]>([]);

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

  const handleTableCreated = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  const handleTableUpdated = () => {
    window.location.reload();
  };

  const handleTableDeleted = () => {
    window.location.reload();
  };

  const openEditDialog = (table: Table, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTable(table);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (table: Table, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTable(table);
    setIsDeleteDialogOpen(true);
  };

  const isAdmin = authState.user?.role === 'admin';

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
              <div className="flex items-center gap-2">
                {getStatusIcon(table.status)}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => openEditDialog(table, e)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => openDeleteDialog(table, e)}
                        className="text-destructive"
                        disabled={table.status === 'occupied' || !!table.currentOrder}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
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
      
      {/* Botón persistente para agregar mesas (visible para admins) */}
      {isAdmin && area.tables.length > 0 && (
        <Card 
          className="pos-card-interactive border-dashed border-2 hover:border-primary hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[180px]">
            <div className="rounded-full bg-primary/10 p-4 mb-3">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-base mb-1">Agregar Mesa</h3>
            <p className="text-sm text-muted-foreground text-center">
              Crear nueva mesa en {area.name}
            </p>
          </CardContent>
        </Card>
      )}
      
      {area.tables.length === 0 && (
        <div className="col-span-full">
          <Card className="pos-card">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay mesas en esta área
              </h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin 
                  ? 'Puedes agregar mesas a esta área' 
                  : `Contacta al administrador para agregar mesas en ${area.name}`
                }
              </p>
              {isAdmin && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Mesa
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      <CreateTableDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        area={area.name}
        areaId={area.id}
        onTableCreated={handleTableCreated}
      />

      {selectedTable && (
        <>
          <EditTableDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            table={selectedTable}
            areas={[{ id: area.id, name: area.name }]}
            onTableUpdated={handleTableUpdated}
          />

          <DeleteTableDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            table={selectedTable}
            onTableDeleted={handleTableDeleted}
          />
        </>
      )}
    </div>
  );
};

export default TableGrid;