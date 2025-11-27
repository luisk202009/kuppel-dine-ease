import React, { useMemo, useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePOS } from '@/contexts/POSContext';
import { PaymentModal } from './PaymentModal';
import { CartItem, Table } from '@/types/pos';
import { useCompanyLimits } from '@/hooks/useCompanyLimits';
import { PlanLimitWarningModal } from '@/components/common/PlanLimitWarningModal';

interface ShoppingCartProps {
  selectedTable?: Table | null;
  onBackToTables?: () => void;
  onPaymentComplete?: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ selectedTable, onBackToTables, onPaymentComplete }) => {
  const { posState, authState, updateCartItem, removeFromCart, clearCart, savePendingOrder, clearPendingOrder } = usePOS();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { limitsStatus, refetch: refetchLimits, checkDimension } = useCompanyLimits(authState.selectedCompany?.id);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const calculations = useMemo(() => {
    const subtotal = posState.cart.reduce((sum, item) => sum + item.total, 0);
    const taxes = subtotal * posState.settings.taxRate;
    const total = subtotal + taxes;

    return {
      subtotal,
      taxes,
      total,
      itemCount: posState.cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [posState.cart, posState.settings.taxRate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartItem(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    // Verificar límite de documentos antes de continuar
    const documentsLimit = checkDimension('documents');
    if (documentsLimit && (documentsLimit.status === 'near_limit' || documentsLimit.status === 'over_limit')) {
      setShowLimitWarning(true);
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handleContinueWithWarning = () => {
    setShowLimitWarning(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = async () => {
    if (selectedTable) {
      clearPendingOrder(selectedTable.id);
    }
    clearCart();
    
    // Refrescar límites después de crear un documento
    await refetchLimits();
    
    // Llamar al handler de pago completo del Dashboard si existe
    if (onPaymentComplete) {
      onPaymentComplete();
    } else if (onBackToTables) {
      // Fallback por compatibilidad
      onBackToTables();
    }
    console.log('Order completed successfully');
  };

  const handleSavePendingOrder = async () => {
    if (!selectedTable) return;
    
    await savePendingOrder(selectedTable.id, cartItems);
    clearCart();
    if (onBackToTables) {
      onBackToTables();
    }
  };

  // Convert cart items to CartItem format for PaymentModal
  const cartItems: CartItem[] = posState.cart.map(item => ({
    id: item.id,
    name: item.product.name,
    price: item.unitPrice,
    quantity: item.quantity,
    notes: item.notes
  }));

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <span>Carrito</span>
            {calculations.itemCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {calculations.itemCount}
              </Badge>
            )}
          </div>
          {posState.cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
        
        {posState.selectedTable && (
          <div className="text-sm text-muted-foreground">
            Mesa: {posState.selectedTable.name}
          </div>
        )}
        {selectedTable && (
          <Badge variant="outline" className="text-xs">
            Mesa: {selectedTable.name}
          </Badge>
        )}
      </CardHeader>

      {/* Cart Items */}
      <div className="flex-1 overflow-hidden">
        {posState.cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">
              Carrito vacío
            </h3>
            <p className="text-sm text-muted-foreground">
              Selecciona productos para agregar al pedido
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full px-6">
            <div className="space-y-3">
              {posState.cart.map((item) => (
                <Card key={item.id} className="border-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight">
                          {item.product.name}
                        </h4>
                        {item.variantName && (
                          <p className="text-xs text-primary font-medium">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.unitPrice)} c/u
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium text-sm min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="font-semibold text-sm">
                        {formatPrice(item.total)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer - Summary and Checkout */}
      {posState.cart.length > 0 && (
        <div className="border-t border-border p-6 space-y-4">
          {/* Price Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatPrice(calculations.subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Impuestos ({(posState.settings.taxRate * 100).toFixed(0)}%):
              </span>
              <span>{formatPrice(calculations.taxes)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold text-base">
              <span>Total:</span>
              <span className="text-primary">{formatPrice(calculations.total)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button 
            onClick={handleCheckout}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {selectedTable ? 'Procesar Pago' : 'Procesar Pago (Mostrador)'}
          </Button>

          {/* Save Pending Order Button - Only show when table is selected */}
          {selectedTable && (
            <Button 
              onClick={handleSavePendingOrder}
              variant="outline"
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Dejar Cuenta Abierta
            </Button>
          )}

          {!selectedTable && !posState.selectedTable && (
            <p className="text-xs text-muted-foreground text-center">
              Se facturará sin mesa (Mostrador)
            </p>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={cartItems}
        subtotal={calculations.subtotal}
        taxes={calculations.taxes}
        total={calculations.total}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Plan Limit Warning Modal */}
      {limitsStatus && checkDimension('documents') && (
        <PlanLimitWarningModal
          open={showLimitWarning}
          onOpenChange={setShowLimitWarning}
          onContinue={handleContinueWithWarning}
          dimension="documents"
          status={checkDimension('documents')!.status as 'near_limit' | 'over_limit'}
          used={checkDimension('documents')!.used}
          limit={checkDimension('documents')!.limit}
          usagePct={checkDimension('documents')!.usage_pct}
        />
      )}
    </div>
  );
};

export default ShoppingCart;