import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Input validation schema
const RequestSchema = z.object({
  invoiceId: z.string().uuid({ message: "Invalid invoice ID format" }),
  sendEmail: z.boolean().optional().default(false),
});

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // 1. Validate input
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { invoiceId, sendEmail } = validationResult.data;
    console.log(`Processing Dataico invoice: ${invoiceId}`);

    // 2. Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verify JWT and user access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`User ${userId} requesting Dataico processing`);

    // 4. Check RLS access to invoice
    const { data: invoiceAccess, error: accessError } = await supabaseUser
      .from('standard_invoices')
      .select('id, branch_id')
      .eq('id', invoiceId)
      .single();

    if (accessError || !invoiceAccess) {
      console.error("Access check failed:", accessError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Use service role to fetch complete data
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice with all related data
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
      console.error("Invoice fetch error:", invoiceError);
      throw new Error("Invoice not found");
    }

    const company = invoice.branch?.company;
    
    // 6. Validate Dataico configuration
    if (!company?.dataico_auth_token) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuración incompleta',
          message: 'La empresa no tiene configurado el token de Dataico' 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company?.dataico_account_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuración incompleta',
          message: 'La empresa no tiene configurado el Account ID de Dataico' 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Fetch invoice items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("standard_invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("display_order");

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Factura sin items',
          message: 'La factura debe tener al menos un item para ser enviada a la DIAN' 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Build Dataico request body
    const customer = invoice.customer;
    
    const dataicoBody = {
      actions: { 
        send_dian: true, 
        send_email: sendEmail 
      },
      invoice: {
        env: "PRODUCTION",
        dataico_account_id: company.dataico_account_id,
        issue_date: invoice.issue_date,
        invoice_type_code: "01",
        number: invoice.invoice_number,
        customer: {
          party_identification: customer?.identification || '',
          party_identification_type: "13",
          tax_level_code: "49",
          name: customer ? `${customer.name} ${customer.last_name || ''}`.trim() : 'Consumidor Final',
          email: customer?.email || '',
          phone: customer?.phone || '',
          address: {
            city_name: customer?.city || '',
            address_line: customer?.address || '',
            country_code: "CO"
          }
        },
        items: items.map(item => ({
          description: item.item_name,
          quantity: item.quantity,
          price: item.unit_price,
          tax_rate: (item.tax_rate * 100).toString(),
        }))
      }
    };

    console.log("Sending to Dataico API...");

    // 9. Send to Dataico API
    const dataicoResponse = await fetch('https://api.dataico.com/direct/dataico_api/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': company.dataico_auth_token
      },
      body: JSON.stringify(dataicoBody)
    });

    const dataicoResult = await dataicoResponse.json();
    
    console.log("Dataico response status:", dataicoResponse.status);
    console.log("Dataico response:", JSON.stringify(dataicoResult));

    if (!dataicoResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Error de Dataico',
          details: dataicoResult 
        }),
        { status: dataicoResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Factura enviada a la DIAN correctamente',
        dataico: dataicoResult 
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-dataico-invoice:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
