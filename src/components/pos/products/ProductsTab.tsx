import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertCircle, Search, Power, PowerOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductImportModal } from './ProductImportModal';
import { ProductVariantsManager } from './ProductVariantsManager';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  stock: number;
  min_stock: number;
  category_id: string;
  company_id: string;
  is_active: boolean;
  is_alcoholic: boolean;
  has_variants?: boolean;
  categories?: {
    id: string;
    name: string;
    color: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export const ProductsTab: React.FC = () => {
  const { toast } = useToast();
  const { authState } = usePOS();
  const queryClient = useQueryClient();
  const selectedCompanyId = authState.selectedCompany?.id || '';
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: 0,
    cost: 0,
    stock: 0,
    min_stock: 0,
    is_alcoholic: false,
    has_variants: false,
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', authState.selectedCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', authState.selectedCompany?.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!authState.selectedCompany?.id
  });

  // Fetch products with variants
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', authState.selectedCompany?.id, selectedCategoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name, color),
          product_variants(
            id,
            variant_value,
            price,
            stock,
            is_active
          )
        `)
        .eq('company_id', authState.selectedCompany?.id)
        .order('name');
      
      if (selectedCategoryFilter !== 'all') {
        query = query.eq('category_id', selectedCategoryFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Calculate total stock and price range for products with variants
      return (data || []).map(product => ({
        ...product,
        variants: product.product_variants?.filter((v: any) => v.is_active) || [],
        totalStock: product.has_variants && product.product_variants?.length > 0
          ? product.product_variants.filter((v: any) => v.is_active).reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
          : product.stock
      }));
    },
    enabled: !!authState.selectedCompany?.id
  });

  // Filter by search
  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return product.name.toLowerCase().includes(query) ||
           product.description?.toLowerCase().includes(query);
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description || null,
          category_id: data.category_id,
          price: data.price,
          cost: data.cost || null,
          stock: data.stock,
          min_stock: data.min_stock,
          is_alcoholic: data.is_alcoholic,
          has_variants: data.has_variants,
          company_id: authState.selectedCompany?.id,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return newProduct;
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Producto creado",
        description: newProduct.has_variants 
          ? "Ahora puedes agregar las variantes"
          : "El producto se creó correctamente"
      });
      
      // Si tiene variantes, abrir modo edición automáticamente
      if (newProduct.has_variants) {
        setShowCreateModal(false);
        setTimeout(() => {
          setEditingProduct(newProduct);
          setFormData({
            name: newProduct.name,
            description: newProduct.description || '',
            category_id: newProduct.category_id,
            price: newProduct.price,
            cost: newProduct.cost || 0,
            stock: newProduct.stock,
            min_stock: newProduct.min_stock,
            is_alcoholic: newProduct.is_alcoholic,
            has_variants: newProduct.has_variants || false,
          });
          setShowCreateModal(true);
        }, 100);
      } else {
        setShowCreateModal(false);
        resetForm();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive"
      });
      console.error('Error creating product:', error);
    }
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description || null,
          category_id: data.category_id,
          price: data.price,
          cost: data.cost || null,
          stock: data.stock,
          min_stock: data.min_stock,
          is_alcoholic: data.is_alcoholic,
          has_variants: data.has_variants
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Producto actualizado",
        description: "Los cambios se guardaron correctamente"
      });
      setEditingProduct(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive"
      });
      console.error('Error updating product:', error);
    }
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: variables.isActive ? "Producto desactivado" : "Producto activado",
        description: variables.isActive 
          ? "El producto ya no aparecerá en el POS"
          : "El producto ahora está visible en el POS"
      });
    }
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Check if used in order_items
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error('Este producto ya está usado en órdenes o facturas. En lugar de eliminarlo, puedes marcarlo como inactivo.');
      }
      
      // Soft delete
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó correctamente"
      });
      setDeleteProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "No se puede eliminar",
        description: error.message,
        variant: "destructive"
      });
      setDeleteProduct(null);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      price: 0,
      cost: 0,
      stock: 0,
      min_stock: 0,
      is_alcoholic: false,
      has_variants: false,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      price: product.price,
      cost: product.cost || 0,
      stock: product.stock,
      min_stock: product.min_stock,
      is_alcoholic: product.is_alcoholic,
      has_variants: product.has_variants || false
    });
    setShowCreateModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre del producto es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category_id) {
      toast({
        title: "Campo requerido",
        description: "Debes seleccionar una categoría",
        variant: "destructive"
      });
      return;
    }

    // Only validate price if product doesn't have variants
    if (!formData.has_variants && formData.price <= 0) {
      toast({
        title: "Precio inválido",
        description: "El precio debe ser mayor a 0",
        variant: "destructive"
      });
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando productos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Productos del Catálogo</h3>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} 
            {selectedCategoryFilter !== 'all' && ' en esta categoría'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar productos
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No se encontraron productos con ese criterio de búsqueda' : 'Crea tu primer producto para comenzar a vender'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Producto
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: product.categories?.color ? `${product.categories.color}20` : undefined,
                        borderColor: product.categories?.color || undefined
                      }}
                    >
                      {product.categories?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.has_variants && product.variants?.length > 0 ? (
                      (() => {
                        const prices = product.variants.map((v: any) => v.price);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max ? `$${min.toLocaleString()}` : `$${min.toLocaleString()} - $${max.toLocaleString()}`;
                      })()
                    ) : (
                      `$${product.price.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const totalStock = (product as any).totalStock ?? product.stock;
                      return (
                        <div className="flex items-center gap-2">
                          <span className={totalStock <= product.min_stock ? 'text-destructive font-semibold' : ''}>
                            {totalStock}
                          </span>
                          {product.has_variants && product.variants?.length > 0 && (
                            <Badge variant="outline" className="text-xs">Σ variantes</Badge>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActiveMutation.mutate({ id: product.id, isActive: product.is_active })}
                        title={product.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {product.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Modifica los datos del producto' : 'Crea un nuevo producto para tu catálogo'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Café Americano"
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional del producto"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio *
                  {formData.has_variants && <span className="text-xs text-muted-foreground ml-2">(definido por variantes)</span>}
                </Label>
                <Input
                  id="price"
                  type="number"
                  disabled={formData.has_variants}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost">
                  Costo
                  {formData.has_variants && <span className="text-xs text-muted-foreground ml-2">(definido por variantes)</span>}
                </Label>
                <Input
                  id="cost"
                  type="number"
                  disabled={formData.has_variants}
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">
                  Stock
                  {formData.has_variants && <span className="text-xs text-muted-foreground ml-2">(definido por variantes)</span>}
                </Label>
                <Input
                  id="stock"
                  type="number"
                  disabled={formData.has_variants}
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stock Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="has_variants"
                  checked={formData.has_variants}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_variants: checked as boolean })}
                />
                <Label htmlFor="has_variants" className="cursor-pointer">
                  Este producto tiene variantes (tallas, colores, sabores)
                </Label>
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="is_alcoholic"
                  checked={formData.is_alcoholic}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_alcoholic: checked as boolean })}
                />
                <Label htmlFor="is_alcoholic" className="cursor-pointer">
                  Producto alcohólico (requiere verificación de edad)
                </Label>
              </div>

              {/* Mensaje informativo para productos con variantes */}
              {!editingProduct && formData.has_variants && (
                <div className="col-span-2 p-4 bg-muted rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Al crear el producto, se abrirá automáticamente 
                    el editor para que agregues las variantes (tallas, colores, etc.)
                  </p>
                </div>
              )}

              {editingProduct && formData.has_variants && (
                <div className="col-span-2 mt-4">
                  <ProductVariantsManager 
                    productId={editingProduct.id} 
                    companyId={selectedCompanyId}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setEditingProduct(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto "{deleteProduct?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      <ProductImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          toast({
            title: "Importación completada",
            description: "Los productos se importaron correctamente"
          });
        }}
      />
    </div>
  );
};
