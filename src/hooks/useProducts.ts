import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ProductsResponse } from '@/types/api';
import { Product } from '@/types/pos';
import { env, shouldUseMockData } from '@/config/environment';

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
      const response = await apiClient.getProducts(category) as ProductsResponse;
      if (response.success && response.data) {
        return response.data.map(transformProduct);
      }
      return [];
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
  return useQuery({
    queryKey: ['products', 'search', query, category],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      // If using mock data or query is very short, use local search
      if (shouldUseMockData() || query.length < 3) {
        const response = await apiClient.getProducts(category) as ProductsResponse;
        if (!response.success || !response.data) return [];
        
        return response.data.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase())
        ).map(transformProduct);
      }
      
      // Use API search for production
      const response = await apiClient.searchProducts(query, category) as ProductsResponse;
      if (!response.success || !response.data) return [];
      return response.data.map(transformProduct);
    },
    enabled: !!query.trim(),
    staleTime: 30000, // 30 seconds
  });
};