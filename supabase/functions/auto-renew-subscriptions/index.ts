import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting auto-renewal process...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find expired subscriptions that are not canceled
    const now = new Date().toISOString();
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('company_subscriptions')
      .select('*')
      .lt('current_period_end', now)
      .not('status', 'eq', 'canceled')
      .not('status', 'eq', 'expired');

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredSubscriptions?.length || 0} subscriptions to renew`);

    const renewedSubscriptions: string[] = [];
    const errors: string[] = [];

    for (const subscription of expiredSubscriptions || []) {
      try {
        console.log(`Processing subscription ${subscription.id} for company ${subscription.company_id}`);

        // Calculate new period dates based on billing period
        const currentEnd = new Date(subscription.current_period_end);
        const newStart = new Date(currentEnd);
        const newEnd = new Date(currentEnd);
        
        if (subscription.billing_period === 'yearly') {
          newEnd.setFullYear(newEnd.getFullYear() + 1);
        } else {
          // Default to monthly
          newEnd.setMonth(newEnd.getMonth() + 1);
        }

        // Mark current subscription as expired
        const { error: updateError } = await supabase
          .from('company_subscriptions')
          .update({ 
            status: 'expired',
            updated_at: now
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError);
          errors.push(`Failed to expire subscription ${subscription.id}: ${updateError.message}`);
          continue;
        }

        // Create new subscription with same details
        const { data: newSubscription, error: insertError } = await supabase
          .from('company_subscriptions')
          .insert({
            company_id: subscription.company_id,
            plan_id: subscription.plan_id,
            status: 'active',
            billing_period: subscription.billing_period,
            current_period_start: newStart.toISOString(),
            current_period_end: newEnd.toISOString(),
            notes: `Renovación automática - Anterior: ${subscription.id}`,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating new subscription for company ${subscription.company_id}:`, insertError);
          errors.push(`Failed to create new subscription for company ${subscription.company_id}: ${insertError.message}`);
          continue;
        }

        console.log(`Created new subscription ${newSubscription.id} for company ${subscription.company_id}`);
        renewedSubscriptions.push(newSubscription.id);

      } catch (subError) {
        console.error(`Unexpected error processing subscription ${subscription.id}:`, subError);
        errors.push(`Unexpected error for subscription ${subscription.id}: ${String(subError)}`);
      }
    }

    const result = {
      success: true,
      processed: expiredSubscriptions?.length || 0,
      renewed: renewedSubscriptions.length,
      renewedIds: renewedSubscriptions,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now,
    };

    console.log('Auto-renewal process completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Auto-renewal process failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
