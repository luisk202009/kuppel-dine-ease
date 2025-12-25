import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Input validation schema
const RequestSchema = z.object({
  invoiceId: z.string().uuid({ message: "Invalid invoice ID format" }),
});

interface InvoiceItem {
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  subtotal: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  total_tax: number;
  total_discount: number;
  total: number;
  status: string;
  notes: string | null;
  terms_conditions: string | null;
  payment_method: string | null;
  customer: {
    name: string;
    last_name: string | null;
    identification: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
  } | null;
  items: InvoiceItem[];
  branch: {
    name: string;
    address: string | null;
    phone: string | null;
    company: {
      name: string;
      tax_id: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
    };
  };
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-CO', {
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

const generateHTML = (invoice: Invoice): string => {
  const itemsRows = invoice.items.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.item_name}</strong>
        ${item.description ? `<br><span style="color: #6b7280; font-size: 12px;">${item.description}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price, invoice.currency)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.tax_rate}%</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.discount_rate}%</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.total, invoice.currency)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoice.invoice_number}</title>
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
        <h1>${invoice.branch.company.name}</h1>
        ${invoice.branch.company.tax_id ? `<p>NIT: ${invoice.branch.company.tax_id}</p>` : ''}
        ${invoice.branch.company.address ? `<p>${invoice.branch.company.address}</p>` : ''}
        ${invoice.branch.company.phone ? `<p>Tel: ${invoice.branch.company.phone}</p>` : ''}
        ${invoice.branch.company.email ? `<p>${invoice.branch.company.email}</p>` : ''}
      </div>
      <div class="invoice-info">
        <div class="invoice-number">${invoice.invoice_number}</div>
        <div class="invoice-status status-${invoice.status}">${statusLabels[invoice.status] || invoice.status}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Facturado a</h3>
        ${invoice.customer ? `
          <p><strong>${invoice.customer.name} ${invoice.customer.last_name || ''}</strong></p>
          ${invoice.customer.identification ? `<p>ID: ${invoice.customer.identification}</p>` : ''}
          ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
          ${invoice.customer.city ? `<p>${invoice.customer.city}</p>` : ''}
          ${invoice.customer.phone ? `<p>Tel: ${invoice.customer.phone}</p>` : ''}
          ${invoice.customer.email ? `<p>${invoice.customer.email}</p>` : ''}
        ` : '<p style="color: #9ca3af;">Cliente general</p>'}
      </div>
      <div class="party">
        <h3>Sucursal</h3>
        <p><strong>${invoice.branch.name}</strong></p>
        ${invoice.branch.address ? `<p>${invoice.branch.address}</p>` : ''}
        ${invoice.branch.phone ? `<p>Tel: ${invoice.branch.phone}</p>` : ''}
      </div>
    </div>

    <div class="dates">
      <div class="date-item">
        <label>Fecha de emisión</label>
        <p>${formatDate(invoice.issue_date)}</p>
      </div>
      ${invoice.due_date ? `
        <div class="date-item">
          <label>Fecha de vencimiento</label>
          <p>${formatDate(invoice.due_date)}</p>
        </div>
      ` : ''}
      ${invoice.payment_method ? `
        <div class="date-item">
          <label>Método de pago</label>
          <p>${invoice.payment_method}</p>
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
          <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        <div class="total-row">
          <span>Descuentos</span>
          <span style="color: #dc2626;">-${formatCurrency(invoice.total_discount, invoice.currency)}</span>
        </div>
        <div class="total-row">
          <span>IVA</span>
          <span>${formatCurrency(invoice.total_tax, invoice.currency)}</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span>${formatCurrency(invoice.total, invoice.currency)}</span>
        </div>
      </div>
    </div>

    ${invoice.notes ? `
      <div class="notes">
        <h3>Notas</h3>
        <p>${invoice.notes}</p>
      </div>
    ` : ''}

    ${invoice.terms_conditions ? `
      <div class="notes">
        <h3>Términos y Condiciones</h3>
        <p>${invoice.terms_conditions}</p>
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

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // Validate input
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { invoiceId } = validationResult.data;
    console.log(`Generating PDF for invoice: ${invoiceId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch invoice with all related data
    const { data: invoice, error: invoiceError } = await supabase
      .from("standard_invoices")
      .select(`
        *,
        customer:customers(*),
        branch:branches(
          *,
          company:companies(*)
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      throw new Error("Invoice not found");
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from("standard_invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("display_order");

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
      throw new Error("Failed to fetch invoice items");
    }

    const invoiceData: Invoice = {
      ...invoice,
      customer: invoice.customer,
      items: items || [],
      branch: {
        name: invoice.branch.name,
        address: invoice.branch.address,
        phone: invoice.branch.phone,
        company: invoice.branch.company,
      },
    };

    const html = generateHTML(invoiceData);

    console.log(`PDF HTML generated successfully for invoice: ${invoice.invoice_number}`);

    return new Response(JSON.stringify({ 
      html,
      invoiceNumber: invoice.invoice_number,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating PDF:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
