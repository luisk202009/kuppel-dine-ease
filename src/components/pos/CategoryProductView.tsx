import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, AlertTriangle, Package, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePOS } from '@/contexts/POSContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const CategoryProductView: React.FC = () => {
  const { toast } = useToast();
  const { authState, addToCart } = usePOS();
  const navigate = useNavigate();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('🔍 CategoryProductView - authState:', {
      selectedCompany: authState.selectedCompany,
      selectedCompanyId: authState.selectedCompany?.id,
      user: authState.user?.id
    });
  }, [authState]);

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', authState.selectedCompany?.id],
    queryFn: async () => {
      console.log('📦 Fetching categories for company:', authState.selectedCompany?.id);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', authState.selectedCompany?.id)
        .eq('is_active', true)
        .order('name');
      
      console.log('📦 Categories fetched:', { count: data?.length, error });
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!authState.selectedCompany?.id,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
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
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!authState.selectedCompany?.id
  });

  // Set first category as selected by default
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const handleAddToCart = (product: any) => {
    if (!product.is_active || product.stock <= 0) {
      toast({
        title: "Producto no disponible",
        description: "Este producto no está disponible para agregar al carrito",
        variant: "destructive"
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.categories?.name || '',
      description: product.description,
      available: product.is_active,
      isAlcoholic: product.is_alcoholic
    }, 1);

    // Visual feedback in cart is sufficient, no toast needed
  };

  // Filter products by selected category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = product.category_id === selectedCategoryId;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (categories.length === 0 && !isLoadingCategories) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {authState.selectedCompany 
            ? "Aún no tienes categorías configuradas."
            : "Selecciona una empresa para continuar"
          }
        </h3>
        <p className="text-muted-foreground mb-4">
          {authState.selectedCompany
            ? "Configura categorías y productos para comenzar a vender"
            : "Debes tener una empresa seleccionada para ver productos"
          }
        </p>
        {authState.selectedCompany && (
          <Button onClick={() => navigate('/settings?section=products')}>
            Ir a Configuración de productos
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Categorías</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Elige una categoría para ver sus productos.
        </p>
        <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = (() => {
                try {
                  const lucideIcons = require('lucide-react');
                  return lucideIcons[category.icon as keyof typeof lucideIcons];
                } catch {
                  return null;
                }
              })();
              
              return (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setSearchQuery(''); // Clear search when changing category
                  }}
                  className={cn(
                    "transition-all",
                    selectedCategoryId === category.id && "ring-2 ring-primary/50"
                  )}
                  style={
                    selectedCategoryId === category.id && category.color
                      ? { backgroundColor: category.color, borderColor: category.color }
                      : {}
                  }
                >
                  {Icon && typeof Icon === 'function' ? (
                    <Icon className="h-4 w-4 mr-2" />
                  ) : null}
                  {category.name}
                </Button>
              );
            })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos en esta categoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {categories.find(c => c.id === selectedCategoryId)?.name || 'Productos'}
          </h3>
          <Badge variant="secondary">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando productos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No se encontraron productos con ese criterio de búsqueda"
                : "No hay productos en esta categoría todavía"
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 laptop:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{product.categories?.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">${product.price.toLocaleString()}</span>
                    <div className="flex items-center gap-2 text-sm">
                      {product.stock <= 5 && product.stock > 0 ? (
                        <Badge variant="outline" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Stock bajo: {product.stock}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Stock: {product.stock}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3 flex-wrap">
                    {product.stock > 0 ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Disponible</Badge>
                    ) : (
                      <Badge variant="destructive">Sin stock</Badge>
                    )}
                    {product.is_alcoholic && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Alcohólico</Badge>
                    )}
                  </div>

                  {product.stock > 0 ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Agregar al carrito
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      disabled
                    >
                      No disponible
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
