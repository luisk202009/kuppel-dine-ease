

# Plan: Crear Edge Function para Procesar Facturas con Dataico

## Resumen

Se creará una nueva edge function `process-dataico-invoice` que enviará facturas al sistema de facturación electrónica Dataico, siguiendo los patrones de seguridad y autenticación establecidos en el proyecto.

---

## Archivos a Crear/Modificar

| Archivo | Tipo |
|---------|------|
| `supabase/functions/process-dataico-invoice/index.ts` | Nuevo |
| `supabase/config.toml` | Modificar (agregar config de la función) |

---

## 1. Configuración en `supabase/config.toml`

```toml
[functions.process-dataico-invoice]
verify_jwt = false
```

Se configura `verify_jwt = false` para manejar la validación JWT manualmente en el código usando `getClaims()`, siguiendo el patrón establecido en otras edge functions del proyecto.

---

## 2. Nueva Edge Function `process-dataico-invoice/index.ts`

### Características de Seguridad

Siguiendo el patrón de seguridad establecido en `send-invoice-email`:

1. **Validación Zod** del input
2. **Verificación JWT** usando `getClaims()`
3. **Verificación RLS** para confirmar que el usuario tiene acceso a la factura
4. **Uso de service role** solo después de validar acceso

### Flujo de Datos

```text
1. Recibir invoiceId
   │
   ▼
2. Validar JWT del usuario
   │
   ▼
3. Verificar acceso a la factura (RLS)
   │
   ▼
4. Obtener datos completos con service role:
   ├── Factura (standard_invoices)
   ├── Items (standard_invoice_items)
   ├── Cliente (customers)
   └── Empresa (companies via branches)
   │
   ▼
5. Validar configuración Dataico de la empresa:
   ├── dataico_auth_token (requerido)
   ├── dataico_account_id
   └── dataico_status
   │
   ▼
6. Mapear datos al formato JSON de Dataico
   │
   ▼
7. Enviar a API de Dataico
   │
   ▼
8. Retornar respuesta
```

### Estructura del Request a Dataico

Basado en la API de Dataico, el body incluirá:

```typescript
const dataicoBody = {
  actions: { send_dian: true, send_email: false },
  invoice: {
    env: "PRODUCTION", // o "PRUEBAS"
    dataico_account_id: company.dataico_account_id,
    issue_date: invoice.issue_date,
    invoice_type_code: "01", // Factura de venta
    number: invoice.invoice_number,
    customer: {
      party_identification: customer.identification,
      party_identification_type: "13", // Cédula, o "31" para NIT
      tax_level_code: "49", // No responsable de IVA
      name: `${customer.name} ${customer.last_name || ''}`.trim(),
      email: customer.email,
      phone: customer.phone,
      address: {
        city: customer.city,
        address_line: customer.address,
      }
    },
    items: items.map(item => ({
      description: item.item_name,
      quantity: item.quantity,
      price: item.unit_price,
      tax_rate: item.tax_rate * 100, // Convertir 0.19 a 19
    }))
  }
};
```

---

## 3. Código Completo Propuesto

```typescript
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
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // 4. Check RLS access to invoice
    const { data: invoiceAccess, error: accessError } = await supabaseUser
      .from('standard_invoices')
      .select('id, branch_id')
      .eq('id', invoiceId)
      .single();

    if (accessError || !invoiceAccess) {
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

    // 7. Fetch invoice items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("standard_invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("display_order");

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
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
        items: (items || []).map(item => ({
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
```

---

## 4. Consideraciones de Seguridad

1. **No se exponen credenciales**: El `dataico_auth_token` se lee de la base de datos, no del cliente
2. **Validación JWT completa**: Se usa `getClaims()` para verificar la autenticación
3. **Verificación RLS**: Se valida que el usuario tenga acceso a la factura antes de procesarla
4. **Logging sin datos sensibles**: Los logs no incluyen tokens ni credenciales

---

## 5. Próximos Pasos (Fuera de este Plan)

Una vez creada la función, se deberá:
1. Añadir un botón "Enviar a DIAN" en la interfaz de facturas
2. Implementar manejo de respuestas y estados de la factura electrónica
3. Guardar el CUFE/UUID retornado por Dataico en la base de datos

