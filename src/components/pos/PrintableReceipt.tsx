import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';
import { CartItem, Customer } from '@/types/pos';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePOS } from '@/contexts/POSContext';

interface PrintableReceiptProps {
  invoice: any;
  cartItems: CartItem[];
  subtotal: number;
  taxes: number;
  tipAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  change: number;
  customer?: Customer | null;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  invoice,
  cartItems,
  subtotal,
  taxes,
  tipAmount,
  total,
  paymentMethod,
  change,
  customer,
  onClose
}) => {
  const { posState, authState } = usePOS();
  const { settings } = posState;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto print:shadow-none print:border-none print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Recibo de Venta
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <div className="print:p-4 receipt-content">
          {/* Business Header */}
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-xl font-bold print:text-lg">{settings.businessName}</h1>
            <p className="text-sm text-muted-foreground">{settings.businessAddress}</p>
            <p className="text-sm text-muted-foreground">{settings.businessPhone}</p>
          </div>

          <Separator className="my-4 print:my-2" />

          {/* Invoice Details */}
          <div className="space-y-2 mb-4 print:mb-2">
            <div className="flex justify-between text-sm">
              <span>Factura:</span>
              <span className="font-mono">{invoice.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Fecha:</span>
              <span>{formatDate(invoice.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cajero:</span>
              <span>{authState.user?.name}</span>
            </div>
            {posState.selectedTable && (
              <div className="flex justify-between text-sm">
                <span>Mesa:</span>
                <span>{posState.selectedTable.name}</span>
              </div>
            )}
          </div>

          {/* Customer Details */}
          {customer && (
            <>
              <Separator className="my-4 print:my-2" />
              <div className="space-y-2 mb-4 print:mb-2">
                <h4 className="font-semibold text-sm">Cliente</h4>
                <div className="text-sm">
                  <p className="font-medium">{customer.name} {customer.lastName}</p>
                  {customer.identification && (
                    <p className="text-muted-foreground">ID: {customer.identification}</p>
                  )}
                  {customer.phone && (
                    <p className="text-muted-foreground">Tel: {customer.phone}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="my-4 print:my-2" />

          {/* Items */}
          <div className="space-y-2 mb-4 print:mb-2">
            <h3 className="font-semibold text-sm">Productos</h3>
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.price)}
                  </div>
                </div>
                <div className="font-mono">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4 print:my-2" />

          {/* Totals */}
          <div className="space-y-2 mb-4 print:mb-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Impuestos (19%):</span>
              <span className="font-mono">{formatCurrency(taxes)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Propina:</span>
                <span className="font-mono">{formatCurrency(tipAmount)}</span>
              </div>
            )}
            <Separator className="my-2 print:my-1" />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>

          <Separator className="my-4 print:my-2" />

          {/* Payment Info */}
          <div className="space-y-2 mb-4 print:mb-2">
            <div className="flex justify-between text-sm">
              <span>Método de pago:</span>
              <span className="capitalize">{paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
            </div>
            {paymentMethod === 'cash' && change > 0 && (
              <div className="flex justify-between text-sm">
                <span>Cambio:</span>
                <span className="font-mono">{formatCurrency(change)}</span>
              </div>
            )}
          </div>

          <Separator className="my-4 print:my-2" />

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>{settings.receiptFooter}</p>
            <p className="mt-2">¡Vuelve pronto!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 print:hidden">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
        </div>
      </DialogContent>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            
            .receipt-content {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              color: black;
            }
            
            .receipt-content h1 {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            
            .receipt-content h3 {
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            body * {
              visibility: hidden;
            }
            
            .receipt-content,
            .receipt-content * {
              visibility: visible;
            }
            
            .receipt-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `
      }} />
    </Dialog>
  );
};