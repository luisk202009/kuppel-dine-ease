import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ProductsResponse } from '@/types/api';
import { Product } from '@/types/pos';

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