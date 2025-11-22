import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

interface CreateTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  area: string;
  areaId?: string;
  onTableCreated: () => void;
}

export const CreateTableDialog: React.FC<CreateTableDialogProps> = ({
  isOpen,
  onClose,
  area,
  areaId,
  onTableCreated
}) => {
  const { authState } = usePOS();
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!tableName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la mesa es requerido",
        variant: "destructive"
      });
      return;
    }

    if (!areaId) {
      toast({
        title: "Error",
        description: "Debes crear al menos un área antes de agregar mesas",
        variant: "destructive"
      });
      return;
    }

    if (!authState.selectedBranch) {
      toast({
        title: "Error", 
        description: "No hay sucursal seleccionada",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Get the max display_order for this area to assign next order
      const { data: existingTables, error: countError } = await supabase
        .from('tables')
        .select('display_order')
        .eq('area_id', areaId)
        .order('display_order', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextOrder = existingTables && existingTables.length > 0 
        ? (existingTables[0].display_order || 0) + 1 
        : 0;

      const { data, error } = await supabase
        .from('tables')
        .insert({
          name: tableName.trim(),
          area: area,
          area_id: areaId || null,
          capacity: capacity,
          branch_id: authState.selectedBranch.id,
          status: 'available',
          display_order: nextOrder
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Mesa creada",
        description: `Mesa "${tableName}" creada exitosamente en ${area}`,
      });

      setTableName('');
      setCapacity(4);
      onTableCreated();
      onClose();
    } catch (error) {
      console.error('Error creating table:', error);
      toast({
        title: "Error al crear mesa",
        description: "No se pudo crear la mesa. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Mesa - {area}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="table-name">Nombre de la Mesa</Label>
            <Input
              id="table-name"
              placeholder="Ej: Mesa 1, A1, Terraza 5"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacidad (personas)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 4)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear Mesa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};