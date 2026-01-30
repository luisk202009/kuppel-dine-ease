import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { StandardInvoiceItemFormData, calculateInvoiceTotals } from '@/types/invoicing';
import { escapeHtml } from '@/lib/htmlEscape';
interface Customer {
  id: string;
  name: string;
  lastName?: string | null;
  identification?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

interface Branch {
  name: string;
  address?: string | null;
  phone?: string | null;
  company: {
    name: string;
    taxId?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

interface InvoicePreviewData {
  invoiceNumber?: string;
  issueDate: Date;
  dueDate?: Date;
  currency: string;
  paymentMethod?: string;
  notes?: string;
  termsConditions?: string;
  customer?: Customer | null;
  items: StandardInvoiceItemFormData[];
  branch?: Branch;
  status?: string;
}

interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: InvoicePreviewData;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
  overdue: 'Vencida',
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  credit: 'Crédito',
};

const calculateItemTotals = (item: StandardInvoiceItemFormData) => {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = subtotal * (item.discountRate / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (item.taxRate / 100);
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
};

export const InvoicePreviewModal = ({ 
  open, 
  onOpenChange, 
  data 
}: InvoicePreviewModalProps) => {
  const totals = calculateInvoiceTotals(data.items);
  const status = data.status || 'draft';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateHTML = () => {
    const itemsRows = data.items.map((item, index) => {
      const itemTotals = calculateItemTotals(item);
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${escapeHtml(item.itemName)}</strong>
            ${item.description ? `<br><span style="color: #6b7280; font-size: 12px;">${escapeHtml(item.description)}</span>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice, data.currency)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.taxRate}%</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.discountRate}%</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(itemTotals.total, data.currency)}</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${data.invoiceNumber || 'Nueva'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info h1 { font-size: 24px; color: #111827; margin-bottom: 8px; }
    .company-info p { color: #6b7280; font-size: 14px; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 28px; font-weight: 700; color: #3b82f6; }
    .invoice-status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 8px; }
    .status-draft { background: #e5e7eb; color: #4b5563; }
    .status-issued { background: #dbeafe; color: #1d4ed8; }
    .status-paid { background: #d1fae5; color: #059669; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .status-overdue { background: #fee2e2; color: #dc2626; }
    .parties { display: flex; gap: 40px; margin-bottom: 40px; }
    .party { flex: 1; }
    .party h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
    .party p { font-size: 14px; }
    .dates { display: flex; gap: 40px; margin-bottom: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .date-item label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .date-item p { font-size: 16px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    th:nth-child(3), th:nth-child(4), th:nth-child(5), th:nth-child(6), th:nth-child(7) { text-align: center; }
    th:last-child { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .total-row.final { border-bottom: none; border-top: 2px solid #1f2937; padding-top: 16px; margin-top: 8px; font-size: 20px; font-weight: 700; }
    .notes { padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px; }
    .notes h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .notes p { font-size: 14px; color: #4b5563; }
    .footer { text-align: center; padding-top: 40px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>${escapeHtml(data.branch?.company?.name || 'Mi Empresa')}</h1>
        ${data.branch?.company?.taxId ? `<p>NIT: ${escapeHtml(data.branch.company.taxId)}</p>` : ''}
        ${data.branch?.company?.address ? `<p>${escapeHtml(data.branch.company.address)}</p>` : ''}
        ${data.branch?.company?.phone ? `<p>Tel: ${escapeHtml(data.branch.company.phone)}</p>` : ''}
        ${data.branch?.company?.email ? `<p>${escapeHtml(data.branch.company.email)}</p>` : ''}
      </div>
      <div class="invoice-info">
        <div class="invoice-number">${escapeHtml(data.invoiceNumber || 'NUEVA')}</div>
        <div class="invoice-status status-${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Facturado a</h3>
        ${data.customer ? `
          <p><strong>${escapeHtml(data.customer.name)} ${escapeHtml(data.customer.lastName || '')}</strong></p>
          ${data.customer.identification ? `<p>ID: ${escapeHtml(data.customer.identification)}</p>` : ''}
          ${data.customer.address ? `<p>${escapeHtml(data.customer.address)}</p>` : ''}
          ${data.customer.city ? `<p>${escapeHtml(data.customer.city)}</p>` : ''}
          ${data.customer.phone ? `<p>Tel: ${escapeHtml(data.customer.phone)}</p>` : ''}
          ${data.customer.email ? `<p>${escapeHtml(data.customer.email)}</p>` : ''}
        ` : '<p style="color: #9ca3af;">Cliente general</p>'}
      </div>
      <div class="party">
        <h3>Sucursal</h3>
        <p><strong>${escapeHtml(data.branch?.name || 'Sucursal Principal')}</strong></p>
        ${data.branch?.address ? `<p>${escapeHtml(data.branch.address)}</p>` : ''}
        ${data.branch?.phone ? `<p>Tel: ${escapeHtml(data.branch.phone)}</p>` : ''}
      </div>
    </div>

    <div class="dates">
      <div class="date-item">
        <label>Fecha de emisión</label>
        <p>${formatDate(data.issueDate)}</p>
      </div>
      ${data.dueDate ? `
        <div class="date-item">
          <label>Fecha de vencimiento</label>
          <p>${formatDate(data.dueDate)}</p>
        </div>
      ` : ''}
      ${data.paymentMethod ? `
        <div class="date-item">
          <label>Método de pago</label>
          <p>${paymentMethodLabels[data.paymentMethod] || data.paymentMethod}</p>
        </div>
      ` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Descripción</th>
          <th style="width: 80px;">Cant.</th>
          <th style="width: 120px;">Precio Unit.</th>
          <th style="width: 80px;">IVA</th>
          <th style="width: 80px;">Desc.</th>
          <th style="width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(totals.subtotal, data.currency)}</span>
        </div>
        <div class="total-row">
          <span>Descuentos</span>
          <span style="color: #dc2626;">-${formatCurrency(totals.totalDiscount, data.currency)}</span>
        </div>
        <div class="total-row">
          <span>IVA</span>
          <span>${formatCurrency(totals.totalTax, data.currency)}</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span>${formatCurrency(totals.total, data.currency)}</span>
        </div>
      </div>
    </div>

    ${data.notes ? `
      <div class="notes">
        <h3>Notas</h3>
        <p>${escapeHtml(data.notes)}</p>
      </div>
    ` : ''}

    ${data.termsConditions ? `
      <div class="notes">
        <h3>Términos y Condiciones</h3>
        <p>${escapeHtml(data.termsConditions)}</p>
      </div>
    ` : ''}

    <div class="footer">
      <p>Gracias por su preferencia</p>
      <p>Documento generado electrónicamente</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Previsualización de Factura</DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          <div 
            className="bg-white shadow-lg mx-auto"
            style={{ maxWidth: '800px' }}
          >
            {/* Preview Content */}
            <div className="p-10">
              {/* Header */}
              <div className="flex justify-between mb-10">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {data.branch?.company?.name || 'Mi Empresa'}
                  </h1>
                  {data.branch?.company?.taxId && (
                    <p className="text-muted-foreground text-sm">NIT: {data.branch.company.taxId}</p>
                  )}
                  {data.branch?.company?.address && (
                    <p className="text-muted-foreground text-sm">{data.branch.company.address}</p>
                  )}
                  {data.branch?.company?.phone && (
                    <p className="text-muted-foreground text-sm">Tel: {data.branch.company.phone}</p>
                  )}
                  {data.branch?.company?.email && (
                    <p className="text-muted-foreground text-sm">{data.branch.company.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {data.invoiceNumber || 'NUEVA'}
                  </div>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase
                    ${status === 'draft' ? 'bg-muted text-muted-foreground' : ''}
                    ${status === 'issued' ? 'bg-blue-100 text-blue-700' : ''}
                    ${status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                    ${status === 'cancelled' || status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {statusLabels[status] || status}
                  </span>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-10 mb-10">
                <div>
                  <h3 className="text-xs uppercase text-muted-foreground mb-2 tracking-wide">Facturado a</h3>
                  {data.customer ? (
                    <>
                      <p className="font-semibold">{data.customer.name} {data.customer.lastName || ''}</p>
                      {data.customer.identification && <p className="text-sm">ID: {data.customer.identification}</p>}
                      {data.customer.address && <p className="text-sm">{data.customer.address}</p>}
                      {data.customer.city && <p className="text-sm">{data.customer.city}</p>}
                      {data.customer.phone && <p className="text-sm">Tel: {data.customer.phone}</p>}
                      {data.customer.email && <p className="text-sm">{data.customer.email}</p>}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Cliente general</p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs uppercase text-muted-foreground mb-2 tracking-wide">Sucursal</h3>
                  <p className="font-semibold">{data.branch?.name || 'Sucursal Principal'}</p>
                  {data.branch?.address && <p className="text-sm">{data.branch.address}</p>}
                  {data.branch?.phone && <p className="text-sm">Tel: {data.branch.phone}</p>}
                </div>
              </div>

              {/* Dates */}
              <div className="flex gap-10 mb-10 p-5 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground uppercase">Fecha de emisión</label>
                  <p className="font-semibold">{formatDate(data.issueDate)}</p>
                </div>
                {data.dueDate && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase">Fecha de vencimiento</label>
                    <p className="font-semibold">{formatDate(data.dueDate)}</p>
                  </div>
                )}
                {data.paymentMethod && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase">Método de pago</label>
                    <p className="font-semibold">{paymentMethodLabels[data.paymentMethod] || data.paymentMethod}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full mb-10">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground w-10">#</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Descripción</th>
                    <th className="p-3 text-center text-xs uppercase text-muted-foreground w-20">Cant.</th>
                    <th className="p-3 text-right text-xs uppercase text-muted-foreground w-28">P. Unit.</th>
                    <th className="p-3 text-center text-xs uppercase text-muted-foreground w-16">IVA</th>
                    <th className="p-3 text-center text-xs uppercase text-muted-foreground w-16">Desc.</th>
                    <th className="p-3 text-right text-xs uppercase text-muted-foreground w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => {
                    const itemTotals = calculateItemTotals(item);
                    return (
                      <tr key={index} className="border-b border-border">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">
                          <span className="font-medium">{item.itemName}</span>
                          {item.description && (
                            <span className="block text-sm text-muted-foreground">{item.description}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unitPrice, data.currency)}</td>
                        <td className="p-3 text-center">{item.taxRate}%</td>
                        <td className="p-3 text-center">{item.discountRate}%</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(itemTotals.total, data.currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-10">
                <div className="w-72">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal, data.currency)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span>Descuentos</span>
                    <span className="text-red-600">-{formatCurrency(totals.totalDiscount, data.currency)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span>IVA</span>
                    <span>{formatCurrency(totals.totalTax, data.currency)}</span>
                  </div>
                  <div className="flex justify-between py-4 mt-2 border-t-2 border-foreground text-xl font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total, data.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {data.notes && (
                <div className="p-5 bg-muted/50 rounded-lg mb-5">
                  <h3 className="font-semibold mb-2">Notas</h3>
                  <p className="text-sm text-muted-foreground">{data.notes}</p>
                </div>
              )}

              {data.termsConditions && (
                <div className="p-5 bg-muted/50 rounded-lg mb-5">
                  <h3 className="font-semibold mb-2">Términos y Condiciones</h3>
                  <p className="text-sm text-muted-foreground">{data.termsConditions}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-10 border-t border-border text-muted-foreground text-xs">
                <p>Gracias por su preferencia</p>
                <p>Documento generado electrónicamente</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
