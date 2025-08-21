import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePOS } from '@/contexts/POSContext';
import { Product } from '@/types/pos';

interface ProductCatalogProps {
  searchQuery?: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ searchQuery = '' }) => {
  const { posState, addToCart } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posState.categories;
    }

    return posState.categories.map(category => ({
      ...category,
      products: category.products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.products.length > 0);
  }, [posState.categories, searchQuery]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <Card className="pos-card-interactive group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1 line-clamp-2">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          {product.isAlcoholic && (
            <Badge variant="secondary" className="ml-2 text-xs">
              21+
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </div>
          
          <Button
            size="sm"
            onClick={() => handleAddToCart(product)}
            disabled={!product.available}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>

        {!product.available && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              No disponible
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (searchQuery.trim()) {
    // Search Results View
    const allProducts = filteredProducts.flatMap(cat => cat.products);
    
    return (
      <div>
        <div className="mb-4 flex items-center space-x-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {allProducts.length} resultado{allProducts.length !== 1 ? 's' : ''} para "{searchQuery}"
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {allProducts.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No se encontraron productos
            </h3>
            <p className="text-muted-foreground">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}
      </div>
    );
  }

  // Category View
  return (
    <Tabs 
      value={selectedCategory || filteredProducts[0]?.id || ''} 
      onValueChange={setSelectedCategory}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
        {filteredProducts.map((category) => (
          <TabsTrigger 
            key={category.id} 
            value={category.id}
            className="text-xs lg:text-sm"
          >
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {filteredProducts.map((category) => (
        <TabsContent key={category.id} value={category.id}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {category.name}
            </h3>
            <p className="text-muted-foreground">
              {category.products.length} producto{category.products.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>
      ))}
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay productos disponibles
          </h3>
          <p className="text-muted-foreground">
            Los productos aparecerán aquí cuando estén disponibles
          </p>
        </div>
      )}
    </Tabs>
  );
};

export default ProductCatalog;