import React, { useState } from 'react';
import { usePublicStore } from '@/contexts/PublicStoreContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Plus, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PublicProduct {
  id: string;
  name: string;
  price: number;
  public_description: string | null;
  description: string | null;
  image_url: string | null;
  is_alcoholic: boolean;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface CartItem {
  product: PublicProduct;
  quantity: number;
}

export const PublicStorePage: React.FC = () => {
  const { company } = usePublicStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          public_description,
          description,
          image_url,
          is_alcoholic,
          categories!inner (
            id,
            name,
            color
          )
        `)
        .eq('company_id', company.id)
        .eq('is_public', true)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return (data || []).map((product: any) => ({
        ...product,
        category: product.categories
      })) as PublicProduct[];
    },
    enabled: !!company?.id
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!company?.id
  });

  const addToCart = (product: PublicProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} agregado`, {
      duration: 1500,
      position: 'bottom-center'
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Filter categories that have products
  const categoriesWithProducts = categories.filter(cat =>
    products.some(p => p.category?.id === cat.id)
  );

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category?.id === selectedCategory)
    : products;

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryId = product.category?.id || 'uncategorized';
    const categoryName = product.category?.name || 'Sin categoría';
    if (!acc[categoryId]) {
      acc[categoryId] = { name: categoryName, products: [] };
    }
    acc[categoryId].products.push(product);
    return acc;
  }, {} as Record<string, { name: string; products: PublicProduct[] }>);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No hay productos disponibles</h2>
        <p className="text-muted-foreground">Esta tienda aún no tiene productos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Category Filter - Horizontal scroll */}
      {categoriesWithProducts.length > 1 && (
        <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="shrink-0"
              >
                Todos
              </Button>
              {categoriesWithProducts.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="shrink-0"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="container mx-auto px-4 py-4">
        {Object.entries(productsByCategory).map(([categoryId, { name, products: categoryProducts }]) => (
          <div key={categoryId} className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 px-1">
              {name}
            </h3>
            <div className="space-y-3">
              {categoryProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Button
            className="w-full h-14 text-base shadow-lg"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ver pedido ({getCartItemsCount()}) - ${getCartTotal().toLocaleString()}
          </Button>
        </div>
      )}
    </div>
  );
};

interface ProductCardProps {
  product: PublicProduct;
  onAdd: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const displayDescription = product.public_description || product.description;

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Image */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start gap-2">
              <h4 className="font-medium text-foreground text-sm sm:text-base line-clamp-1 flex-1">
                {product.name}
              </h4>
              {product.is_alcoholic && (
                <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0">
                  +18
                </Badge>
              )}
            </div>
            {displayDescription && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {displayDescription}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-primary text-sm sm:text-base">
              ${product.price.toLocaleString()}
            </span>
            <Button
              size="icon"
              variant="default"
              className="h-8 w-8 rounded-full"
              onClick={onAdd}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
