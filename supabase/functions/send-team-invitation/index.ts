import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  invitationId: string;
  email: string;
  companyName: string;
  role: string;
  inviterName: string;
}

serve(async (req) => {
  console.log('=== SEND TEAM INVITATION START ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasResendKey: !!resendApiKey
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody: InvitationRequest = await req.json();
    const { invitationId, email, companyName, role, inviterName } = requestBody;

    console.log('Request body:', { invitationId, email, companyName, role, inviterName });

    // Get invitation details with token
    const { data: invitation, error: invError } = await supabase
      .from('company_invitations')
      .select('token, expires_at')
      .eq('id', invitationId)
      .single();

    if (invError || !invitation) {
      console.error('Error fetching invitation:', invError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          emailSent: false,
          error: 'Invitation not found',
          details: invError 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Invitation found:', { token: invitation.token?.substring(0, 8) + '...', expires_at: invitation.expires_at });

    // Build invitation URL
    const appUrl = 'https://kuppelapp.lovable.app';
    const inviteUrl = `${appUrl}/invite/${invitation.token}`;

    const roleLabels: Record<string, string> = {
      viewer: 'Visualizador',
      staff: 'Personal',
      company_owner: 'Dueño'
    };

    const roleLabel = roleLabels[role] || role;

    // Send email via Resend if API key is available
    if (resendApiKey) {
      console.log('Attempting to send email via Resend...');
      
      const emailPayload = {
        from: 'Kuppel <noreply@kuppel.co>',
        to: [email],
        subject: `Has sido invitado a unirte a ${companyName} en Kuppel`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitación a Kuppel</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7c3aed; margin: 0;">Kuppel</h1>
            </div>
            
            <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #111;">¡Hola!</h2>
              <p><strong>${inviterName}</strong> te ha invitado a unirte a <strong>${companyName}</strong> en Kuppel como <strong>${roleLabel}</strong>.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                  Aceptar Invitación
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Esta invitación expirará en 7 días.
              </p>
            </div>
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Si no esperabas esta invitación, puedes ignorar este correo.
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${inviteUrl}" style="color: #7c3aed;">${inviteUrl}</a>
            </p>
          </body>
          </html>
        `,
      };

      console.log('Email payload:', { from: emailPayload.from, to: emailPayload.to, subject: emailPayload.subject });

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const responseText = await emailResponse.text();
      console.log('Resend API response status:', emailResponse.status);
      console.log('Resend API response body:', responseText);

      if (!emailResponse.ok) {
        console.error('Resend API error:', {
          status: emailResponse.status,
          statusText: emailResponse.statusText,
          body: responseText
        });
        
        return new Response(
          JSON.stringify({ 
            success: true,
            emailSent: false,
            error: 'Email send failed',
            details: responseText,
            inviteUrl // Return URL so user can share manually
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      console.log('=== EMAIL SENT SUCCESSFULLY ===');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          emailSent: true,
          message: 'Invitation email sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
      
    } else {
      console.log('RESEND_API_KEY not configured, skipping email send');
      console.log('Invitation URL for testing:', inviteUrl);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          emailSent: false,
          message: 'Email not configured',
          inviteUrl // Return URL for manual sharing
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

  } catch (error) {
    console.error('Error processing invitation:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        emailSent: false,
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
