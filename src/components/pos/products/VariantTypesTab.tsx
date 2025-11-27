import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { useVariantTypes, useCreateVariantType, useUpdateVariantType, useDeleteVariantType } from '@/hooks/useVariantTypes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface VariantTypesTabProps {
  companyId: string;
}

export const VariantTypesTab: React.FC<VariantTypesTabProps> = ({ companyId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const { data: variantTypes = [], isLoading } = useVariantTypes(companyId);
  const createMutation = useCreateVariantType();
  const updateMutation = useUpdateVariantType();
  const deleteMutation = useDeleteVariantType();

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingType(null);
    setShowCreateModal(false);
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      if (editingType) {
        await updateMutation.mutateAsync({
          id: editingType.id,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync({
          company_id: companyId,
          name: formData.name,
          description: formData.description,
          display_order: variantTypes.length,
          is_active: true,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving variant type:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteType) return;
    try {
      await deleteMutation.mutateAsync(deleteType.id);
      setDeleteType(null);
    } catch (error) {
      console.error('Error deleting variant type:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando tipos de variante...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Variantes</h3>
          <p className="text-sm text-muted-foreground">
            Define los tipos de variantes disponibles (Tamaño, Color, Sabor, etc.)
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variantTypes.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">{type.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteType(type)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {type.description && (
                <CardDescription className="text-sm">{type.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {variantTypes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No hay tipos de variantes configurados
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Tipo
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateModal} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowCreateModal(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Editar Tipo de Variante' : 'Nuevo Tipo de Variante'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Tamaño, Color, Sabor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción opcional del tipo de variante"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {editingType ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteType} onOpenChange={() => setDeleteType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de variante?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará "{deleteType?.name}". Los productos con variantes de este tipo no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
