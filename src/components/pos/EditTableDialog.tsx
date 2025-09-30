import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Table } from '@/types/pos';

interface EditTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  areas: { id: string; name: string }[];
  onTableUpdated: () => void;
}

export const EditTableDialog: React.FC<EditTableDialogProps> = ({
  isOpen,
  onClose,
  table,
  areas,
  onTableUpdated
}) => {
  const [tableName, setTableName] = useState(table.name);
  const [capacity, setCapacity] = useState(table.capacity);
  const [selectedAreaId, setSelectedAreaId] = useState(table.area || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setTableName(table.name);
    setCapacity(table.capacity);
    setSelectedAreaId(table.area || '');
  }, [table]);

  const handleUpdate = async () => {
    if (!tableName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la mesa es requerido",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('tables')
        .update({
          name: tableName.trim(),
          capacity: capacity,
          area_id: selectedAreaId || null,
        })
        .eq('id', table.id);

      if (error) throw error;

      toast({
        title: "Mesa actualizada",
        description: `Mesa "${tableName}" actualizada exitosamente`,
      });

      onTableUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating table:', error);
      toast({
        title: "Error al actualizar mesa",
        description: "No se pudo actualizar la mesa. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Mesa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-table-name">Nombre de la Mesa</Label>
            <Input
              id="edit-table-name"
              placeholder="Ej: Mesa 1, A1, Terraza 5"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div>
            <Label htmlFor="edit-capacity">Capacidad (personas)</Label>
            <Input
              id="edit-capacity"
              type="number"
              min="1"
              max="20"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 4)}
            />
          </div>

          <div>
            <Label htmlFor="edit-area">Área</Label>
            <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
              <SelectTrigger id="edit-area">
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};