import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesTab } from './products/CategoriesTab';
import { ProductsTab } from './products/ProductsTab';

export const ProductsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Productos</h2>
        <p className="text-muted-foreground">
          Gestiona tus productos y categorías del catálogo POS
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'categories' | 'products')}>
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
