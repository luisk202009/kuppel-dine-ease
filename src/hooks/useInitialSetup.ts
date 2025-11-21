import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SetupData {
  categories: Array<{ name: string; color: string; icon: string }>;
  products: Array<{ name: string; price: number; categoryId: string }>;
  useTables: boolean;
  areas: Array<{ name: string; color: string }>;
  tables: Array<{ name: string; capacity: number; areaId: string }>;
}

export const useInitialSetup = (companyId: string, branchId: string, userId: string) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const completeSetup = async (setupData: SetupData) => {
    setIsCompleting(true);
    try {
      // 1. Create categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .insert(
          setupData.categories.map((cat) => ({
            name: cat.name,
            color: cat.color,
            icon: cat.icon,
            company_id: companyId,
          }))
        )
        .select();

      if (categoriesError) throw categoriesError;

      // Create map of category index to UUID
      const categoryIndexToId = new Map<string, string>();
      if (categoriesData) {
        categoriesData.forEach((cat, index) => {
          categoryIndexToId.set(index.toString(), cat.id);
        });
      }

      // 2. Create products if any
      if (setupData.products.length > 0 && categoriesData) {
        const productsToInsert = setupData.products
          .map((prod) => {
            const categoryId = categoryIndexToId.get(prod.categoryId);
            if (!categoryId) {
              console.error(`Category ID not found for product: ${prod.name}`);
              return null;
            }
            return {
              name: prod.name,
              price: prod.price,
              category_id: categoryId,
              company_id: companyId,
              stock: 100,
              is_active: true,
            };
          })
          .filter((p) => p !== null);

        if (productsToInsert.length > 0) {
          const { error: productsError } = await supabase
            .from('products')
            .insert(productsToInsert);

          if (productsError) throw productsError;
        }
      }

      // 3. Create areas if using tables
      if (setupData.useTables && setupData.areas.length > 0) {
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .insert(
            setupData.areas.map((area, index) => ({
              name: area.name,
              color: area.color,
              branch_id: branchId,
              display_order: index + 1,
            }))
          )
          .select();

        if (areasError) throw areasError;

        // Create map of area index to UUID
        const areaIndexToId = new Map<string, string>();
        if (areasData) {
          areasData.forEach((area, index) => {
            areaIndexToId.set(index.toString(), area.id);
          });
        }

        // 4. Create tables if any
        if (setupData.tables.length > 0 && areasData) {
          const tablesToInsert = setupData.tables
            .map((table) => {
              const areaId = areaIndexToId.get(table.areaId);
              if (!areaId) {
                console.error(`Area ID not found for table: ${table.name}`);
                return null;
              }
              return {
                name: table.name,
                capacity: table.capacity,
                area_id: areaId,
                branch_id: branchId,
                status: 'available' as const,
              };
            })
            .filter((t) => t !== null);

          if (tablesToInsert.length > 0) {
            const { error: tablesError } = await supabase
              .from('tables')
              .insert(tablesToInsert);

            if (tablesError) throw tablesError;
          }
        }
      }

      // 5. Mark setup as completed
      const { error: updateError } = await supabase
        .from('users')
        .update({ setup_completed: true })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: '¡Configuración completa!',
        description: 'Tu sistema está listo para usar.',
      });

      return true;
    } catch (error) {
      console.error('Error completing setup:', error);
      toast({
        title: 'Error en la configuración',
        description: 'Hubo un problema al completar la configuración. Intenta nuevamente.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCompleting(false);
    }
  };

  const skipSetup = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ setup_completed: true })
        .eq('id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error skipping setup:', error);
      return false;
    }
  };

  return {
    completeSetup,
    skipSetup,
    isCompleting,
  };
};
