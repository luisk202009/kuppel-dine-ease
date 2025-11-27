import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertCircle } from 'lucide-react';
import { ProductVariant } from '@/hooks/useProductVariants';

interface VariantSelectionModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  open,
  onClose,
  productName,
  variants,
  onSelect,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelect = () => {
    if (selectedVariant) {
      onSelect(selectedVariant);
      setSelectedVariant(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedVariant(null);
    onClose();
  };

  // Group variants by type
  const groupedVariants = variants.reduce((acc, variant) => {
    const typeName = variant.variant_types?.name || 'Otros';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Seleccionar Variante - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(groupedVariants).map(([typeName, typeVariants]) => (
            <div key={typeName} className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">{typeName}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {typeVariants.map((variant) => (
                  <Card
                    key={variant.id}
                    className={`cursor-pointer transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'hover:border-primary/50'
                    } ${variant.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (variant.stock > 0) {
                        setSelectedVariant(variant);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <span className="font-medium">{variant.variant_value}</span>
                          {variant.stock <= 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Agotado
                            </Badge>
                          )}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(variant.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stock: {variant.stock}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {variants.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay variantes disponibles</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSelect}
            disabled={!selectedVariant || selectedVariant.stock <= 0}
          >
            Agregar al Carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
