import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesTab } from './products/CategoriesTab';
import { ProductsTab } from './products/ProductsTab';
import { VariantTypesTab } from './products/VariantTypesTab';
import { usePOS } from '@/contexts/POSContext';

interface ProductsManagerProps {
  companyId?: string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ companyId }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'variants'>('categories');
  const { authState } = usePOS();

  // Get companyId from props or POSContext
  const selectedCompanyId = companyId || authState.selectedCompany?.id || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Productos</h2>
        <p className="text-muted-foreground">
          Gestiona tus productos, categorías y variantes del catálogo POS
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'categories' | 'products' | 'variants')}>
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="variants">Tipos de Variantes</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="variants" className="mt-6">
          {selectedCompanyId && <VariantTypesTab companyId={selectedCompanyId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};
