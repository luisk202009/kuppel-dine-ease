import React from 'react';
import { usePublicStore } from '@/contexts/PublicStoreContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package } from 'lucide-react';

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

export const PublicStorePage: React.FC = () => {
  const { company } = usePublicStore();

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

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Sin categoría';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, PublicProduct[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Nuestros Productos</h2>
        <p className="text-muted-foreground">
          Explora nuestro catálogo de productos
        </p>
      </div>

      {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
        <div key={categoryName} className="mb-10">
          <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
            {categoryName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className={product.image_url ? 'pt-4' : 'pt-6'}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">{product.name}</h4>
                    {product.is_alcoholic && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        +18
                      </Badge>
                    )}
                  </div>
                  {(product.public_description || product.description) && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.public_description || product.description}
                    </p>
                  )}
                  <p className="text-xl font-bold text-primary">
                    ${product.price.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
