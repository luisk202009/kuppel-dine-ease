import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Plus, Loader2 } from 'lucide-react';
import { usePOS } from '@/contexts/POSContext';
import { useProductsByCategory, useProductSearch } from '@/hooks/useProducts';
import { Product } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';

interface ProductCatalogProps {
  searchQuery?: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ searchQuery = '' }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { addToCart } = usePOS();
  const { data: categorizedProducts = {}, products = [], isLoading, error } = useProductsByCategory();
  
  // Use enhanced search hook for real-time API search
  const { data: searchResults = [], isLoading: isSearching } = useProductSearch(
    searchQuery,
    selectedCategory || undefined
  );

  // Remove local formatPrice since we're using the one from utils

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <p>Error al cargar productos. Por favor, intenta de nuevo.</p>
      </div>
    );
  }

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
            {formatCurrency(product.price)}
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

  // If there's a search query, show search results
  if (searchQuery.trim()) {
    if (isSearching) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Buscando productos...</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            Resultados para "{searchQuery}" ({searchResults.length})
          </h2>
        </div>

        {searchResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron productos
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {searchResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show products by category
  const categories = Object.keys(categorizedProducts);
  
  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay productos disponibles
      </div>
    );
  }

  return (
    <Tabs value={selectedCategory || categories[0]} onValueChange={setSelectedCategory}>
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((categoryName) => (
          <TabsTrigger
            key={categoryName}
            value={categoryName}
            className="text-xs md:text-sm"
          >
            {categoryName}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((categoryName) => (
        <TabsContent key={categoryName} value={categoryName} className="mt-4">
          {categorizedProducts[categoryName]?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay productos en esta categoría
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categorizedProducts[categoryName]?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ProductCatalog;