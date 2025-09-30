import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Table } from '@/types/pos';

interface DeleteTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  onTableDeleted: () => void;
}

export const DeleteTableDialog: React.FC<DeleteTableDialogProps> = ({
  isOpen,
  onClose,
  table,
  onTableDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (table.status === 'occupied' || table.currentOrder) {
      toast({
        title: "No se puede eliminar",
        description: "No puedes eliminar una mesa con órdenes activas",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', table.id);

      if (error) throw error;

      toast({
        title: "Mesa eliminada",
        description: `Mesa "${table.name}" eliminada exitosamente`,
      });

      onTableDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: "Error al eliminar mesa",
        description: "No se pudo eliminar la mesa. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar mesa?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar la mesa "{table.name}"? Esta acción no se puede deshacer.
            {(table.status === 'occupied' || table.currentOrder) && (
              <span className="block mt-2 text-destructive font-medium">
                ⚠️ Esta mesa tiene órdenes activas y no puede ser eliminada.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isDeleting || table.status === 'occupied' || !!table.currentOrder}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};