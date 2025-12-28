import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, X, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StandardInvoice, PrintFormat } from '@/types/invoicing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketReceiptProps {
  invoice: StandardInvoice;
  isOpen: boolean;
  onClose: () => void;
  printFormat?: PrintFormat;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyTaxId?: string;
}

export const TicketReceipt: React.FC<TicketReceiptProps> = ({
  invoice,
  isOpen,
  onClose,
  printFormat = 'ticket_80mm',
  companyName = 'Mi Negocio',
  companyAddress,
  companyPhone,
  companyTaxId,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const width = printFormat === 'ticket_58mm' ? '58mm' : '80mm';
  const fontSize = printFormat === 'ticket_58mm' ? '10px' : '12px';

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: ${width} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${fontSize};
              margin: 0;
              padding: 4mm;
              width: ${width};
              box-sizing: border-box;
            }
            .header { text-align: center; margin-bottom: 3mm; }
            .company-name { font-size: 1.2em; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .row { display: flex; justify-content: space-between; }
            .item { margin: 1mm 0; }
            .item-name { font-weight: bold; }
            .item-detail { display: flex; justify-content: space-between; font-size: 0.9em; }
            .totals { margin-top: 2mm; }
            .total-row { display: flex; justify-content: space-between; }
            .grand-total { font-weight: bold; font-size: 1.2em; margin-top: 2mm; }
            .footer { text-align: center; margin-top: 3mm; font-size: 0.9em; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista previa del Ticket</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="bg-white text-black rounded-lg p-4 font-mono text-sm max-h-[60vh] overflow-y-auto">
          <div ref={receiptRef}>
            {/* Header */}
            <div className="text-center mb-4">
              <div className="text-lg font-bold">{companyName}</div>
              {companyTaxId && <div className="text-xs">NIT: {companyTaxId}</div>}
              {companyAddress && <div className="text-xs">{companyAddress}</div>}
              {companyPhone && <div className="text-xs">Tel: {companyPhone}</div>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Invoice Info */}
            <div className="text-xs mb-2">
              <div className="flex justify-between">
                <span>Ticket:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{format(invoice.issueDate, "dd/MM/yyyy HH:mm", { locale: es })}</span>
              </div>
              {invoice.customer && (
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span>{invoice.customer.name}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Items */}
            <div className="mb-2">
              {invoice.items?.map((item, index) => (
                <div key={index} className="mb-1">
                  <div className="font-semibold text-xs">{item.itemName}</div>
                  <div className="flex justify-between text-xs">
                    <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Totals */}
            <div className="text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA:</span>
                <span>{formatCurrency(invoice.totalTax)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(invoice.totalDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-400 my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {invoice.paymentMethod && (
              <>
                <div className="border-t border-dashed border-gray-400 my-2" />
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span>Forma de pago:</span>
                    <span className="uppercase">{invoice.paymentMethod}</span>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="text-center text-xs">
              <div>¡Gracias por su compra!</div>
              <div className="text-[10px] text-gray-600 mt-1">
                {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
