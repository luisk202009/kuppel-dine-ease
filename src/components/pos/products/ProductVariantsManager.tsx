import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useProductVariants, useCreateProductVariant, useUpdateProductVariant, useDeleteProductVariant } from '@/hooks/useProductVariants';
import { useVariantTypes } from '@/hooks/useVariantTypes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ProductVariantsManagerProps {
  productId: string;
  companyId: string;
}

export const ProductVariantsManager: React.FC<ProductVariantsManagerProps> = ({ productId, companyId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [deleteVariant, setDeleteVariant] = useState<any>(null);
  const [formData, setFormData] = useState({
    variant_type_id: '',
    variant_value: '',
    price: '',
    cost: '',
    stock: '0',
    min_stock: '0',
    sku: '',
  });

  const { data: variants = [], isLoading } = useProductVariants(productId);
  const { data: variantTypes = [] } = useVariantTypes(companyId);
  const createMutation = useCreateProductVariant();
  const updateMutation = useUpdateProductVariant();
  const deleteMutation = useDeleteProductVariant();

  const resetForm = () => {
    setFormData({
      variant_type_id: '',
      variant_value: '',
      price: '',
      cost: '',
      stock: '0',
      min_stock: '0',
      sku: '',
    });
    setEditingVariant(null);
    setShowCreateModal(false);
  };

  const handleEdit = (variant: any) => {
    setEditingVariant(variant);
    setFormData({
      variant_type_id: variant.variant_type_id,
      variant_value: variant.variant_value,
      price: variant.price.toString(),
      cost: variant.cost?.toString() || '',
      stock: variant.stock.toString(),
      min_stock: variant.min_stock.toString(),
      sku: variant.sku || '',
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.variant_type_id || !formData.variant_value || !formData.price) {
      return;
    }

    try {
      const variantData = {
        product_id: productId,
        variant_type_id: formData.variant_type_id,
        variant_value: formData.variant_value,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
        sku: formData.sku || undefined,
        is_active: true,
      };

      if (editingVariant) {
        await updateMutation.mutateAsync({
          id: editingVariant.id,
          product_id: productId,
          ...variantData,
        });
      } else {
        await createMutation.mutateAsync(variantData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving variant:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteVariant) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteVariant.id, product_id: productId });
      setDeleteVariant(null);
    } catch (error) {
      console.error('Error deleting variant:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando variantes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Variantes del Producto
        </h4>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Variante
        </Button>
      </div>

      {variants.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>{variant.variant_types?.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{variant.variant_value}</Badge>
                </TableCell>
                <TableCell>{formatPrice(variant.price)}</TableCell>
                <TableCell>
                  <span className={variant.stock <= variant.min_stock ? 'text-destructive' : ''}>
                    {variant.stock}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {variant.sku || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(variant)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteVariant(variant)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            No hay variantes configuradas
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primera Variante
          </Button>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowCreateModal(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Variante *</Label>
              <Select
                value={formData.variant_type_id}
                onValueChange={(value) => setFormData({ ...formData, variant_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {variantTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="variant_value">Valor *</Label>
              <Input
                id="variant_value"
                placeholder="Ej: Grande, Rojo, Vainilla"
                value={formData.variant_value}
                onChange={(e) => setFormData({ ...formData, variant_value: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="Código único"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.variant_type_id || !formData.variant_value || !formData.price || createMutation.isPending || updateMutation.isPending}
            >
              {editingVariant ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteVariant} onOpenChange={() => setDeleteVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar variante?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará la variante "{deleteVariant?.variant_value}". Esta acción no se puede deshacer.
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
