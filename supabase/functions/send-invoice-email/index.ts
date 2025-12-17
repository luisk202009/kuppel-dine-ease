import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Input validation schema
const RequestSchema = z.object({
  invoiceId: z.string().uuid({ message: "Invalid invoice ID format" }),
  recipientEmail: z.string().email({ message: "Invalid email format" }).optional(),
  subject: z.string().max(200, { message: "Subject must be less than 200 characters" }).optional(),
  message: z.string().max(1000, { message: "Message must be less than 1000 characters" }).optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendEmailRequest {
  invoiceId: string;
  recipientEmail?: string;
  subject?: string;
  message?: string;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    
    const { invoiceId, recipientEmail, subject, message } = validationResult.data;
    console.log(`Sending email for invoice: ${invoiceId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch invoice with related data
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

    // Determine recipient email
    const toEmail = recipientEmail || invoice.customer?.email;
    if (!toEmail) {
      throw new Error("No recipient email provided and customer has no email");
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from("standard_invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("display_order");

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
    }

    const companyName = invoice.branch?.company?.name || 'Nuestra Empresa';
    const customerName = invoice.customer ? 
      `${invoice.customer.name} ${invoice.customer.last_name || ''}`.trim() : 
      'Estimado cliente';

    // Build items HTML
    const itemsHtml = (items || []).map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.item_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price, invoice.currency)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total, invoice.currency)}</td>
      </tr>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Factura ${invoice.invoice_number}</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        <p style="margin: 0 0 20px 0;">Hola <strong>${customerName}</strong>,</p>
        
        ${message ? `<p style="margin: 0 0 20px 0;">${message}</p>` : `
        <p style="margin: 0 0 20px 0;">
          Le enviamos la factura <strong>${invoice.invoice_number}</strong> correspondiente a sus servicios/productos.
        </p>
        `}

        <!-- Invoice Summary Box -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280;">Fecha de emisión:</span>
            <strong>${formatDate(invoice.issue_date)}</strong>
          </div>
          ${invoice.due_date ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280;">Fecha de vencimiento:</span>
            <strong>${formatDate(invoice.due_date)}</strong>
          </div>
          ` : ''}
          <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 18px; font-weight: 600;">Total a pagar:</span>
              <span style="font-size: 24px; font-weight: 700; color: #3b82f6;">${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <h3 style="margin: 24px 0 12px 0; font-size: 16px; color: #374151;">Detalle de la factura</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-weight: 600;">Descripción</th>
              <th style="padding: 12px; text-align: center; font-weight: 600;">Cant.</th>
              <th style="padding: 12px; text-align: right; font-weight: 600;">Precio</th>
              <th style="padding: 12px; text-align: right; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="margin-top: 20px; text-align: right;">
          <div style="margin-bottom: 8px;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="margin-left: 20px;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          ${invoice.total_discount > 0 ? `
          <div style="margin-bottom: 8px;">
            <span style="color: #6b7280;">Descuentos:</span>
            <span style="margin-left: 20px; color: #dc2626;">-${formatCurrency(invoice.total_discount, invoice.currency)}</span>
          </div>
          ` : ''}
          <div style="margin-bottom: 8px;">
            <span style="color: #6b7280;">IVA:</span>
            <span style="margin-left: 20px;">${formatCurrency(invoice.total_tax, invoice.currency)}</span>
          </div>
        </div>

        ${invoice.notes ? `
        <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px;">
          <strong style="color: #92400e;">Notas:</strong>
          <p style="margin: 8px 0 0 0; color: #92400e;">${invoice.notes}</p>
        </div>
        ` : ''}

        <p style="margin: 24px 0 0 0; color: #6b7280;">
          Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.
        </p>

        <p style="margin: 24px 0 0 0;">
          Atentamente,<br>
          <strong>${companyName}</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          Este es un correo electrónico automático. Por favor no responda directamente.
        </p>
        ${invoice.branch?.company?.email ? `
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
          Contacto: ${invoice.branch.company.email}
        </p>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const emailSubject = subject || `Factura ${invoice.invoice_number} - ${companyName}`;

    console.log(`Sending email to: ${toEmail}`);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [toEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Email enviado a ${toEmail}`,
      emailId: emailData?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-invoice-email:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
