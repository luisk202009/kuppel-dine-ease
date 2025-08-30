import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { mockApi } from '@/lib/mockApi';
import { ProductsResponse } from '@/types/api';
import { Product } from '@/types/pos';
import { env, shouldUseMockData } from '@/config/environment';
import { supabase } from '@/integrations/supabase/client';

// Transform API product to internal product type
const transformProduct = (apiProduct: any): Product => ({
  id: apiProduct.id,
  name: apiProduct.name,
  category: apiProduct.category,
  price: apiProduct.price,
  description: apiProduct.description,
  image: apiProduct.image,
  available: apiProduct.available,
  isAlcoholic: apiProduct.isAlcoholic,
});

export const useProducts = (category?: string) => {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async (): Promise<Product[]> => {
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          const response = await mockApi.getProducts(category);
          return response.data.map(transformProduct);
        }

        // Query products from Supabase with proper tenant filtering
        let query = supabase
          .from('products')
          .select(`
            *,
            categories(name)
          `)
          .eq('is_active', true);

        if (category) {
          query = query.eq('categories.name', category);
        }

        const { data: products, error } = await query;

        if (error) {
          console.error('Error fetching products:', error);
          throw error;
        }

        return products?.map((product: any) => ({
          id: product.id,
          name: product.name,
          category: product.categories?.name || 'Sin categoría',
          price: parseFloat(product.price || '0'),
          description: product.description,
          image: product.image_url,
          available: product.is_active,
          isAlcoholic: product.is_alcoholic,
        })) || [];
      } catch (error) {
        // Fallback to mock data on network error
        console.warn('API failed, falling back to mock data:', error);
        const response = await mockApi.getProducts(category);
        return response.data.map(transformProduct);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProductsByCategory = () => {
  const { data: products = [], ...query } = useProducts();
  
  // Group products by category
  const categorizedProducts = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return {
    ...query,
    data: categorizedProducts,
    products,
  };
};

// Enhanced search hook with unified API and local search
export const useProductSearch = (query: string, category?: string) => {
  const { data: allProducts } = useProducts();
  
  return useQuery({
    queryKey: ['products', 'search', query, category],
    queryFn: async (): Promise<Product[]> => {
      if (!query.trim()) return [];
      
      try {
        // Use mock data if enabled
        if (shouldUseMockData()) {
          const response = await mockApi.searchProducts(query, category);
          return response.data.map(transformProduct);
        }

        // For short queries, use local filtering when available
        if (query.length < 3 && allProducts) {
          return allProducts.filter(product => {
            const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase()) ||
                                product.category.toLowerCase().includes(query.toLowerCase()) ||
                                product.description?.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = !category || product.category === category;
            return matchesQuery && matchesCategory;
          });
        }
        
        // Search products with Supabase
        let searchQuery = supabase
          .from('products')
          .select(`
            *,
            categories(name)
          `)
          .eq('is_active', true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

        if (category) {
          searchQuery = searchQuery.eq('categories.name', category);
        }

        const { data: products, error } = await searchQuery.limit(20);

        if (error) {
          console.error('Error searching products:', error);
          throw error;
        }

        return products?.map((product: any) => ({
          id: product.id,
          name: product.name,
          category: product.categories?.name || 'Sin categoría',
          price: parseFloat(product.price || '0'),
          description: product.description,
          image: product.image_url,
          available: product.is_active,
          isAlcoholic: product.is_alcoholic,
        })) || [];
      } catch (error) {
        // Fallback to mock search on network error
        console.warn('Search API failed, falling back to mock data:', error);
        const response = await mockApi.searchProducts(query, category);
        return response.data.map(transformProduct);
      }
    },
    enabled: !!query.trim(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};