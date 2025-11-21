/**
 * CategoriesStep - Paso de configuración de categorías
 * 
 * FLUJO:
 * 1. Carga categorías existentes desde Supabase (si existen)
 * 2. Usuario puede agregar/editar/eliminar categorías
 * 3. Al continuar, NO guarda en Supabase (los datos ya fueron seed)
 * 4. Solo pasa la lista al siguiente paso para referencia
 * 
 * IMPORTANTE:
 * - Valida que companyId sea un UUID válido
 * - Carga datos del seed automático
 * - NO usa '' como fallback para company_id
 */

import React, { useState, useEffect } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id?: string;
  name: string;
  color: string;
  icon: string;
}

interface CategoriesStepProps {
  companyId: string;
  onNext: (categories: Category[]) => void;
}

export const CategoriesStep: React.FC<CategoriesStepProps> = ({ companyId, onNext }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Cargar categorías existentes desde Supabase
  useEffect(() => {
    const loadCategories = async () => {
      if (!companyId) {
        setError('No se encontró el ID de la empresa');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('id, name, color, icon')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('name');

        if (fetchError) {
          console.error('Error loading categories:', fetchError);
          throw fetchError;
        }

        if (data && data.length > 0) {
          setCategories(data);
        }
      } catch (err: any) {
        console.error('Error in loadCategories:', err);
        toast({
          title: "Error al cargar categorías",
          description: err.message || "No se pudieron cargar las categorías",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [companyId, toast]);

  const handleNext = () => {
    if (categories.length === 0) {
      toast({
        title: "Categorías requeridas",
        description: "Necesitas al menos una categoría para continuar",
        variant: "destructive",
      });
      return;
    }
    
    // Pasar categorías al siguiente paso
    onNext(categories);
  };

  if (isLoading) {
    return (
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando categorías...</p>
        </div>
      </CardContent>
    );
  }

  if (error) {
    return (
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-semibold">Error de Configuración</p>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Categorías de Productos</h2>
        <p className="text-muted-foreground">
          Revisa las categorías que preparamos para ti
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id || category.name}
            className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <Check className="h-5 w-5" style={{ color: category.color }} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{category.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Message */}
      <div className="bg-muted/50 border rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 Hemos creado {categories.length} categoría{categories.length !== 1 ? 's' : ''} para tu negocio. 
          Podrás agregar más desde el panel de control.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleNext} 
          disabled={categories.length === 0}
          size="lg"
        >
          Continuar con Productos
        </Button>
      </div>
    </CardContent>
  );
};
