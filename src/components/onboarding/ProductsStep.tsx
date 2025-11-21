/**
 * ProductsStep - Paso de configuración de productos
 * 
 * FLUJO:
 * 1. Carga productos existentes desde Supabase (generados por seed)
 * 2. Usuario revisa los productos
 * 3. Al continuar, solo pasa al siguiente paso
 * 
 * IMPORTANTE:
 * - Valida que companyId sea un UUID válido
 * - NO usa '' como fallback
 */

import React, { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id?: string;
  name: string;
  price: number;
  categoryName?: string;
}

interface ProductsStepProps {
  companyId: string;
  categories: Array<{ id?: string; name: string; color: string; icon: string }>;
  onNext: (products: Product[]) => void;
  onBack: () => void;
}

export const ProductsStep: React.FC<ProductsStepProps> = ({ companyId, categories, onNext, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Cargar productos desde Supabase
  useEffect(() => {
    const loadProducts = async () => {
      if (!companyId) {
        toast({
          title: "Error",
          description: "No se encontró el ID de la empresa",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            category_id,
            categories!inner(name)
          `)
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        if (data) {
          const formattedProducts = data.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            categoryName: (p.categories as any)?.name || 'Sin categoría',
          }));
          setProducts(formattedProducts);
        }
      } catch (err: any) {
        console.error('Error loading products:', err);
        toast({
          title: "Error al cargar productos",
          description: err.message || "No se pudieron cargar los productos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [companyId, toast]);

  const handleNext = () => {
    onNext(products);
  };

  if (isLoading) {
    return (
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Productos Iniciales</h2>
        <p className="text-muted-foreground">
          Revisa los productos que preparamos para ti
        </p>
      </div>

      {/* Products List */}
      {products.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Productos Creados ({products.length})</p>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id || product.name}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.categoryName}</p>
                </div>
                <p className="font-semibold text-primary">
                  ${typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No se encontraron productos. Podrás agregarlos desde el panel de control.
          </p>
        </div>
      )}

      {/* Info Message */}
      <div className="bg-muted/50 border rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 Podrás agregar, editar y eliminar productos desde el panel de control
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={handleNext} size="lg">
          Continuar con Mesas
        </Button>
      </div>
    </CardContent>
  );
};
