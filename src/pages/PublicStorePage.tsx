import React, { useState } from 'react';
import { usePublicStore } from '@/contexts/PublicStoreContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Loader2, Package, Plus, ShoppingCart, Minus, Trash2, MessageCircle, X } from 'lucide-react';
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
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const handleSendWhatsApp = () => {
    if (!company?.whatsapp_number || cart.length === 0) return;

    // Build product list
    const productList = cart
      .map(item => `• ${item.quantity}x ${item.product.name} ($${(item.product.price * item.quantity).toLocaleString()})`)
      .join('\n');

    const total = getCartTotal();
    const message = `Hola ${company.name}, quiero pedir:\n\n${productList}\n\n*Total: $${total.toLocaleString()}*`;

    // Clean WhatsApp number (remove spaces, dashes, etc.)
    const cleanNumber = company.whatsapp_number.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
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
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ver Pedido ({getCartItemsCount()}) - ${getCartTotal().toLocaleString()}
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Tu Pedido
              </DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tu carrito está vacío
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="w-14 h-14 shrink-0 bg-muted rounded-md overflow-hidden">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-primary font-semibold">
                        ${(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity === 1) {
                            removeFromCart(item.product.id);
                          } else {
                            updateQuantity(item.product.id, -1);
                          }
                        }}
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </Button>
                      <span className="w-8 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={clearCart}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vaciar carrito
                </Button>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <DrawerFooter className="border-t border-border bg-background">
              {/* Total */}
              <div className="flex items-center justify-between py-2">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  ${getCartTotal().toLocaleString()}
                </span>
              </div>

              {/* WhatsApp Button */}
              {company?.whatsapp_number ? (
                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={handleSendWhatsApp}
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar Pedido por WhatsApp
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Esta tienda no tiene WhatsApp configurado
                </p>
              )}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
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
