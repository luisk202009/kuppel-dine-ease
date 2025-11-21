import React, { useState } from 'react';
import { Users, Clock, CheckCircle2, Plus, Pencil, Trash2, MoreVertical, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Area, Table } from '@/types/pos';
import { usePOS } from '@/contexts/POSContext';
import { supabase } from '@/integrations/supabase/client';
import { CreateTableDialog } from './CreateTableDialog';
import { EditTableDialog } from './EditTableDialog';
import { DeleteTableDialog } from './DeleteTableDialog';
import { toast } from '@/hooks/use-toast';

interface TableGridProps {
  area: Area;
  onTableClick?: (table: Table) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({ area, onTableClick }) => {
  const { selectTable, posState, authState } = usePOS();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [availableAreas, setAvailableAreas] = useState<{ id: string; name: string }[]>([]);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

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
    if (onTableClick) {
      onTableClick(table);
    }
  };

  const handleTableCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTableUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTableDeleted = () => {
    setRefreshKey(prev => prev + 1);
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

  const handleDragStart = (e: React.DragEvent, tableId: string) => {
    e.stopPropagation();
    setDraggedTableId(tableId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', tableId);
  };

  const handleDragOver = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTableId(tableId);
  };

  const handleDragLeave = () => {
    setDragOverTableId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTableId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedTableId || draggedTableId === targetTableId) {
      setDraggedTableId(null);
      setDragOverTableId(null);
      return;
    }

    const tables = [...area.tables];
    const draggedIndex = tables.findIndex(t => t.id === draggedTableId);
    const targetIndex = tables.findIndex(t => t.id === targetTableId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const [draggedTable] = tables.splice(draggedIndex, 1);
    tables.splice(targetIndex, 0, draggedTable);

    // Update display_order in database
    try {
      const updates = tables.map((table, index) => ({
        id: table.id,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('tables')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Visual feedback is sufficient, no toast needed
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating table order:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las mesas",
        variant: "destructive"
      });
    }

    setDraggedTableId(null);
    setDragOverTableId(null);
  };

  const handleDragEnd = () => {
    setDraggedTableId(null);
    setDragOverTableId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {area.tables.map((table) => (
        <Card
          key={table.id}
          draggable={isAdmin}
          onDragStart={(e) => isAdmin && handleDragStart(e, table.id)}
          onDragOver={(e) => isAdmin && handleDragOver(e, table.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => isAdmin && handleDrop(e, table.id)}
          onDragEnd={handleDragEnd}
          className={`pos-card-interactive transition-all ${getStatusColor(table.status)} ${
            posState.selectedTable?.id === table.id ? 'ring-2 ring-primary' : ''
          } ${draggedTableId === table.id ? 'opacity-50 scale-95' : ''} ${
            dragOverTableId === table.id ? 'ring-2 ring-primary/50 scale-105' : ''
          } ${isAdmin ? 'cursor-move' : ''}`}
          onClick={() => handleTableSelect(table)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                )}
                <h3 className="font-semibold text-lg">{table.name}</h3>
              </div>
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