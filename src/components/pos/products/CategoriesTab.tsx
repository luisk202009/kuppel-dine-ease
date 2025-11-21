import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  company_id: string;
  is_active: boolean;
  productCount?: number;
}

export const CategoriesTab: React.FC = () => {
  const { toast } = useToast();
  const { authState } = usePOS();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: ''
  });

  // Fetch categories with product count
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', authState.selectedCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .eq('company_id', authState.selectedCompany?.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(cat => ({
        ...cat,
        productCount: cat.products?.[0]?.count || 0
      }));
    },
    enabled: !!authState.selectedCompany?.id
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          color: data.color,
          icon: data.icon || null,
          company_id: authState.selectedCompany?.id,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoría creada",
        description: "La categoría se creó correctamente"
      });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive"
      });
      console.error('Error creating category:', error);
    }
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          color: data.color,
          icon: data.icon || null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoría actualizada",
        description: "Los cambios se guardaron correctamente"
      });
      setEditingCategory(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive"
      });
      console.error('Error updating category:', error);
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if has products
      const { count, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error(`Esta categoría tiene ${count} producto(s) asociado(s). Mueve o elimina los productos primero.`);
      }
      
      // Soft delete
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría se eliminó correctamente"
      });
      setDeleteCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: "No se puede eliminar",
        description: error.message,
        variant: "destructive"
      });
      setDeleteCategory(null);
    }
  });

  const resetForm = () => {
    setFormData({ name: '', color: '#3b82f6', icon: '' });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color || '#3b82f6',
      icon: category.icon || ''
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando categorías...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Categorías de Productos</h3>
          <p className="text-sm text-muted-foreground">
            {categories.length} categoría{categories.length !== 1 ? 's' : ''} configurada{categories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay categorías</h3>
          <p className="text-muted-foreground mb-4">Crea tu primera categoría para organizar tus productos</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Categoría
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color || '#3b82f6' }}
                  />
                  <h4 className="font-semibold">{category.name}</h4>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteCategory(category)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <Badge variant="secondary">
                {category.productCount} producto{category.productCount !== 1 ? 's' : ''}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setEditingCategory(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría para tus productos'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Bebidas, Comidas, Postres"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">Icono (opcional)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ej: Coffee, Pizza, IceCream"
              />
              <p className="text-xs text-muted-foreground">Nombre del icono de Lucide React</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setEditingCategory(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategory?.productCount && deleteCategory.productCount > 0 ? (
                <>Esta categoría tiene {deleteCategory.productCount} producto(s) asociado(s). No puedes eliminarla hasta que muevas o elimines esos productos.</>
              ) : (
                <>Esta acción no se puede deshacer. La categoría "{deleteCategory?.name}" será eliminada permanentemente.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {(!deleteCategory?.productCount || deleteCategory.productCount === 0) && (
              <AlertDialogAction
                onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
