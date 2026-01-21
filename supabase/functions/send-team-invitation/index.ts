import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { TeamInvitationEmail } from "../_shared/email-templates/TeamInvitation.tsx";
import { brandStyles } from "../_shared/email-templates/styles.ts";

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

    // Send email via Resend if API key is available
    if (resendApiKey) {
      console.log('Attempting to send email via Resend with React Email template...');
      
      // Render React Email template
      const html = await renderAsync(
        React.createElement(TeamInvitationEmail, {
          inviterName,
          companyName,
          role,
          inviteUrl,
          expiresIn: '7 días',
        })
      );

      const emailPayload = {
        from: `${brandStyles.companyName} <${brandStyles.senderEmail}>`,
        to: [email],
        subject: `Has sido invitado a unirte a ${companyName} en Kuppel`,
        html,
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

      console.log('=== EMAIL SENT SUCCESSFULLY WITH BRANDED TEMPLATE ===');
      
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
