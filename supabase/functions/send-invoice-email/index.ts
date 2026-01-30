import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { InvoiceEmail } from "../_shared/email-templates/InvoiceEmail.tsx";
import { brandStyles } from "../_shared/email-templates/styles.ts";

// Input validation schema
const RequestSchema = z.object({
  invoiceId: z.string().uuid({ message: "Invalid invoice ID format" }),
  recipientEmail: z.string().email({ message: "Invalid email format" }).optional(),
  subject: z.string().max(200, { message: "Subject must be less than 200 characters" }).optional(),
  message: z.string().max(1000, { message: "Message must be less than 1000 characters" }).optional(),
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendEmailRequest {
  invoiceId: string;
  recipientEmail?: string;
  subject?: string;
  message?: string;
}

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
    
    const { invoiceId, recipientEmail, subject, message } = validationResult.data;
    console.log(`Processing email request for invoice: ${invoiceId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Step 1: Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Create user client to verify access
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Authentication failed:", claimsError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    // Step 3: Check if user has access to this invoice via RLS
    const { data: invoiceAccess, error: accessError } = await supabaseUser
      .from('standard_invoices')
      .select('id, branch_id')
      .eq('id', invoiceId)
      .single();

    if (accessError || !invoiceAccess) {
      console.error("Invoice access denied or not found:", accessError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${userId} has access to invoice ${invoiceId}, proceeding with email`);

    // Step 4: Now use service role key to fetch complete data
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabaseAdmin
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
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("standard_invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("display_order");

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
    }

    const companyName = invoice.branch?.company?.name || 'Nuestra Empresa';
    const companyEmail = invoice.branch?.company?.email;
    const customerName = invoice.customer ? 
      `${invoice.customer.name} ${invoice.customer.last_name || ''}`.trim() : 
      'Estimado cliente';

    console.log('Rendering invoice email with React Email template...');

    // Render React Email template
    const html = await renderAsync(
      React.createElement(InvoiceEmail, {
        customerName,
        companyName,
        companyEmail,
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        items: (items || []).map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
        subtotal: invoice.subtotal,
        totalDiscount: invoice.total_discount,
        totalTax: invoice.total_tax,
        total: invoice.total,
        currency: invoice.currency,
        notes: invoice.notes,
        customMessage: message,
      })
    );

    const emailSubject = subject || `Factura ${invoice.invoice_number} - ${companyName}`;

    console.log(`Sending email to: ${toEmail}`);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${companyName} <${brandStyles.senderEmail}>`,
      to: [toEmail],
      subject: emailSubject,
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Email sent successfully with branded template:", emailData);

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
