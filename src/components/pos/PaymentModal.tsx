import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Calculator } from 'lucide-react';
import { CartItem } from '@/types/pos';
import { toast } from '@/hooks/use-toast';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { usePOSContext } from '@/contexts/POSContext';
import { formatCurrency } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  taxes: number;
  total: number;
  onPaymentComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  taxes,
  total,
  onPaymentComplete
}) => {
  const { posState, authState } = usePOSContext();
  const createInvoice = useCreateInvoice();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountReceived, setAmountReceived] = useState<string>(total.toString());
  const [cardNumber, setCardNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const change = paymentMethod === 'cash' ? Math.max(0, parseFloat(amountReceived) - total) : 0;
  
  // Card number validation
  const isValidCardNumber = (number: string) => {
    return number.replace(/\s/g, '').length >= 15; // Accept 15+ digits
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const invoiceData = {
        tableId: posState.selectedTable?.id,
        branchId: authState.selectedBranch?.id || '',
        items: posState.cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes
        })),
        subtotal,
        taxes,
        discount: 0,
        total,
        paymentMethod: paymentMethod as 'cash' | 'card',
        receivedAmount: paymentMethod === 'cash' ? parseFloat(amountReceived) : undefined
      };

      await createInvoice.mutateAsync(invoiceData);

      toast({
        title: "Factura generada exitosamente",
        description: `Método: ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'} - Total: ${formatCurrency(total)}`,
      });

      onPaymentComplete();
      onClose();
    } catch (error) {
      toast({
        title: "Error al procesar pago",
        description: "No se pudo generar la factura. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculatorButtons = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'];

  const handleCalculatorClick = (value: string) => {
    if (value === 'C') {
      setAmountReceived('0');
    } else if (value === '.') {
      if (!amountReceived.includes('.')) {
        setAmountReceived(amountReceived + '.');
      }
    } else {
      if (amountReceived === '0') {
        setAmountReceived(value);
      } else {
        setAmountReceived(amountReceived + value);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Procesar Pago
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resumen del Pedido</h3>
            
            <div className="bg-secondary/20 rounded-lg p-4 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div>
                   <span className="font-medium">{item.name}</span>
                   <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                 </div>
                 <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <Separator />
            
             <div className="space-y-2">
               <div className="flex justify-between">
                 <span>Subtotal:</span>
                 <span>{formatCurrency(subtotal)}</span>
               </div>
               <div className="flex justify-between">
                 <span>Impuestos (19%):</span>
                 <span>{formatCurrency(taxes)}</span>
               </div>
               <Separator />
               <div className="flex justify-between text-lg font-bold">
                 <span>Total:</span>
                 <span>{formatCurrency(total)}</span>
               </div>
             </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Método de Pago</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="h-16"
              >
                <div className="text-center">
                  <Banknote className="h-6 w-6 mx-auto mb-1" />
                  <span>Efectivo</span>
                </div>
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="h-16"
              >
                <div className="text-center">
                  <CreditCard className="h-6 w-6 mx-auto mb-1" />
                  <span>Tarjeta</span>
                </div>
              </Button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount-received">Monto Recibido</Label>
                  <Input
                    id="amount-received"
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="text-xl font-bold text-center"
                  />
                </div>
                
                 {parseFloat(amountReceived) >= total && (
                   <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                     <div className="flex justify-between items-center">
                       <span className="text-success font-medium">Cambio:</span>
                       <span className="text-success font-bold text-xl">{formatCurrency(change)}</span>
                     </div>
                   </div>
                 )}

                {/* Calculator */}
                <div className="bg-secondary/10 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Calculadora
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {calculatorButtons.map((btn) => (
                      <Button
                        key={btn}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalculatorClick(btn)}
                        className="h-12 text-lg font-bold"
                      >
                        {btn}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                 <div>
                   <Label htmlFor="card-number">Número de Tarjeta</Label>
                   <Input
                     id="card-number"
                     placeholder="**** **** **** ****"
                     value={formatCardNumber(cardNumber)}
                     onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                     className={`text-center tracking-widest ${!isValidCardNumber(cardNumber) && cardNumber ? 'border-destructive' : ''}`}
                     maxLength={19} // 16 digits + 3 spaces
                   />
                   {cardNumber && !isValidCardNumber(cardNumber) && (
                     <p className="text-sm text-destructive mt-1">Número de tarjeta inválido</p>
                   )}
                 </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-primary font-medium">
                    Terminal de pago activado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esperando tarjeta del cliente...
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4">
               <Button 
                 onClick={handlePayment} 
                 className="w-full h-14 text-lg font-bold"
                 disabled={
                   isProcessing || 
                   (paymentMethod === 'cash' && parseFloat(amountReceived) < total) ||
                   (paymentMethod === 'card' && !isValidCardNumber(cardNumber))
                 }
               >
                 {isProcessing ? 'Procesando...' : `Procesar Pago - ${formatCurrency(total)}`}
               </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};