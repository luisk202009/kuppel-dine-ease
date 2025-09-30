import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';

interface ProductFormData {
  name: string;
  description: string;
  category_id: string;
  price: string;
  cost: string;
  stock: string;
  is_active: boolean;
  is_alcoholic: boolean;
}

export const ProductManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { authState } = usePOS();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost: '',
    stock: '0',
    is_active: true,
    is_alcoholic: false
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', authState.selectedCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', authState.selectedCompany?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!authState.selectedCompany?.id
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', authState.selectedCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('company_id', authState.selectedCompany?.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!authState.selectedCompany?.id
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData = {
        company_id: authState.selectedCompany?.id,
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        cost: parseFloat(data.cost),
        stock: parseInt(data.stock),
        is_active: data.is_active,
        is_alcoholic: data.is_alcoholic
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: editingProduct ? "Producto actualizado" : "Producto creado",
        description: `${formData.name} ha sido ${editingProduct ? 'actualizado' : 'creado'} exitosamente.`
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el producto",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Producto desactivado",
        description: "El producto ha sido desactivado exitosamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo desactivar el producto",
        variant: "destructive"
      });
    }
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
        price: product.price.toString(),
        cost: product.cost?.toString() || '0',
        stock: product.stock.toString(),
        is_active: product.is_active,
        is_alcoholic: product.is_alcoholic || false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category_id: categories[0]?.id || '',
        price: '',
        cost: '',
        stock: '0',
        is_active: true,
        is_alcoholic: false
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Productos</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando productos...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{product.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                <div className="space-y-1 text-sm">
                  <p><strong>Categoría:</strong> {product.categories?.name}</p>
                  <p><strong>Precio:</strong> ${product.price.toLocaleString()}</p>
                  <p><strong>Stock:</strong> {product.stock}</p>
                  <div className="flex gap-2 mt-2">
                    {product.is_active ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Activo</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactivo</span>
                    )}
                    {product.is_alcoholic && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Alcohólico</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Activo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_alcoholic">Producto alcohólico</Label>
              <Switch
                id="is_alcoholic"
                checked={formData.is_alcoholic}
                onCheckedChange={(checked) => setFormData({ ...formData, is_alcoholic: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
