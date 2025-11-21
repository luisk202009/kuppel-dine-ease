import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, ChevronLeft, AlertCircle } from 'lucide-react';
import { productSchema, checkDuplicateNames } from '@/lib/wizardValidation';
import { useToast } from '@/hooks/use-toast';

interface Product {
  name: string;
  price: number;
  categoryId: string;
}

interface ProductsStepProps {
  categories: Array<{ name: string; color: string; icon: string }>;
  onNext: (products: Product[]) => void;
  onBack: () => void;
}

export const ProductsStep: React.FC<ProductsStepProps> = ({ categories, onNext, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState('0');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const addProduct = () => {
    setError('');
    
    if (!productName.trim()) {
      setError('El nombre del producto no puede estar vacío');
      return;
    }
    
    if (!productPrice) {
      setError('El precio es requerido');
      return;
    }
    
    const price = parseFloat(productPrice);
    
    // Check for duplicates
    const duplicateCheck = checkDuplicateNames(products, productName, 'producto');
    if (duplicateCheck.isDuplicate) {
      setError(duplicateCheck.message!);
      toast({
        title: "Error de validación",
        description: duplicateCheck.message,
        variant: "destructive"
      });
      return;
    }
    
    // Validate the product
    const validation = productSchema.safeParse({
      name: productName.trim(),
      price,
      categoryId: selectedCategoryIndex
    });
    
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Error de validación';
      setError(errorMsg);
      toast({
        title: "Error de validación",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setProducts([...products, {
      name: productName.trim(),
      price,
      categoryId: selectedCategoryIndex
    }]);

    setProductName('');
    setProductPrice('');
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    onNext(products);
  };

  const getCategoryName = (categoryId: string) => {
    const index = parseInt(categoryId);
    return categories[index]?.name || '';
  };

  return (
    <CardContent className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Productos Iniciales</h2>
        <p className="text-muted-foreground">
          Agrega algunos productos para empezar. Podrás añadir más después
        </p>
      </div>

      {/* Add Product Form */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre del Producto</Label>
            <Input
              id="product-name"
              placeholder="Ej: Café Americano"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && addProduct()}
              maxLength={50}
              className={error ? 'border-destructive' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-price">Precio</Label>
            <Input
              id="product-price"
              type="number"
              placeholder="0.00"
              value={productPrice}
              onChange={(e) => {
                setProductPrice(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && addProduct()}
              min="0"
              step="0.01"
              className={error ? 'border-destructive' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-category">Categoría</Label>
            <Select value={selectedCategoryIndex} onValueChange={setSelectedCategoryIndex}>
              <SelectTrigger id="product-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={addProduct} 
          className="w-full"
          disabled={!productName.trim() || !productPrice}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      {/* Products List */}
      {products.length > 0 && (
        <div className="space-y-3">
          <Label>Productos Agregados ({products.length})</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {products.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-background rounded-lg border"
              >
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${product.price.toFixed(2)} • {getCategoryName(product.categoryId)}
                  </p>
                </div>
                <button
                  onClick={() => removeProduct(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            Agrega al menos un producto para continuar, o salta este paso
          </p>
        </div>
      )}

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
