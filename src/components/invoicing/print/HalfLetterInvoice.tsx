import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, X, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StandardInvoice, PrintFormat } from '@/types/invoicing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HalfLetterInvoiceProps {
  invoice: StandardInvoice;
  isOpen: boolean;
  onClose: () => void;
  printFormat?: PrintFormat;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
  overdue: 'Vencida',
};

export const HalfLetterInvoice: React.FC<HalfLetterInvoiceProps> = ({
  invoice,
  isOpen,
  onClose,
  printFormat = 'half_letter',
  companyName = 'Mi Negocio',
  companyAddress,
  companyPhone,
  companyEmail,
  companyTaxId,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const isLetter = printFormat === 'letter';

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: ${isLetter ? 'letter' : '5.5in 8.5in'};
              margin: 15mm;
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              font-size: 11px;
              color: #333;
              line-height: 1.4;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #2563eb;
            }
            .company-info h1 { font-size: 20px; margin: 0 0 5px; color: #2563eb; }
            .company-info p { margin: 2px 0; font-size: 10px; color: #666; }
            .invoice-info { text-align: right; }
            .invoice-number { font-size: 16px; font-weight: bold; color: #2563eb; }
            .invoice-date { font-size: 10px; color: #666; }
            .status-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              margin-top: 5px;
            }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-issued { background: #fef9c3; color: #854d0e; }
            .status-draft { background: #f3f4f6; color: #374151; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            
            .customer-section {
              background: #f8fafc;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .customer-section h3 { margin: 0 0 8px; font-size: 11px; color: #64748b; text-transform: uppercase; }
            .customer-section p { margin: 2px 0; }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background: #2563eb;
              color: white;
              padding: 8px;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
            }
            .items-table td {
              padding: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            .items-table tr:last-child td { border-bottom: none; }
            .text-right { text-align: right; }
            
            .totals-section {
              display: flex;
              justify-content: flex-end;
            }
            .totals-table {
              width: 200px;
            }
            .totals-table tr td {
              padding: 4px 0;
            }
            .totals-table .total-row {
              font-size: 14px;
              font-weight: bold;
              border-top: 2px solid #2563eb;
              padding-top: 8px;
            }
            
            .notes-section {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #666;
            }
            
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 9px;
              color: #999;
            }
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

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      paid: 'status-paid',
      issued: 'status-issued',
      draft: 'status-draft',
      overdue: 'status-overdue',
      cancelled: 'status-cancelled',
    };
    return classes[status] || 'status-draft';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista previa de Factura</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="bg-white text-gray-900 rounded-lg p-6 text-sm">
          <div ref={invoiceRef}>
            {/* Header */}
            <div className="flex justify-between mb-6 pb-4 border-b-2 border-primary">
              <div>
                <h1 className="text-xl font-bold text-primary mb-1">{companyName}</h1>
                {companyTaxId && <p className="text-xs text-gray-500">NIT: {companyTaxId}</p>}
                {companyAddress && <p className="text-xs text-gray-500">{companyAddress}</p>}
                {companyPhone && <p className="text-xs text-gray-500">Tel: {companyPhone}</p>}
                {companyEmail && <p className="text-xs text-gray-500">{companyEmail}</p>}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{invoice.invoiceNumber}</div>
                <div className="text-xs text-gray-500">
                  Fecha: {format(invoice.issueDate, "dd 'de' MMMM, yyyy", { locale: es })}
                </div>
                {invoice.dueDate && (
                  <div className="text-xs text-gray-500">
                    Vence: {format(invoice.dueDate, "dd 'de' MMMM, yyyy", { locale: es })}
                  </div>
                )}
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-2 ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'issued' ? 'bg-yellow-100 text-yellow-800' :
                  invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {statusLabels[invoice.status] || invoice.status}
                </span>
              </div>
            </div>

            {/* Customer */}
            {invoice.customer && (
              <div className="bg-gray-50 p-3 rounded-md mb-6">
                <h3 className="text-xs text-gray-500 uppercase mb-2 font-semibold">Facturar a:</h3>
                <p className="font-medium">
                  {invoice.customer.name} {invoice.customer.lastName}
                </p>
                {invoice.customer.identification && (
                  <p className="text-xs text-gray-600">ID: {invoice.customer.identification}</p>
                )}
                {invoice.customer.address && (
                  <p className="text-xs text-gray-600">{invoice.customer.address}</p>
                )}
                {invoice.customer.city && (
                  <p className="text-xs text-gray-600">{invoice.customer.city}</p>
                )}
                {invoice.customer.email && (
                  <p className="text-xs text-gray-600">{invoice.customer.email}</p>
                )}
              </div>
            )}

            {/* Items Table */}
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="py-2 px-3 text-left text-xs uppercase">Descripción</th>
                  <th className="py-2 px-3 text-right text-xs uppercase">Cant.</th>
                  <th className="py-2 px-3 text-right text-xs uppercase">Precio</th>
                  <th className="py-2 px-3 text-right text-xs uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 px-3">
                      <div className="font-medium">{item.itemName}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500">{item.description}</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">{item.quantity}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">IVA:</span>
                  <span>{formatCurrency(invoice.totalTax)}</span>
                </div>
                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between py-1 text-green-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(invoice.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-primary mt-2 font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(invoice.notes || invoice.termsConditions) && (
              <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
                {invoice.notes && (
                  <div className="mb-2">
                    <span className="font-semibold">Notas: </span>
                    {invoice.notes}
                  </div>
                )}
                {invoice.termsConditions && (
                  <div>
                    <span className="font-semibold">Condiciones: </span>
                    {invoice.termsConditions}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-400">
              Documento generado el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          {invoice.customer?.email && (
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Enviar por Email
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
