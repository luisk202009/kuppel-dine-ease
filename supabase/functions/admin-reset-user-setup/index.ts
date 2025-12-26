import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  target_user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user's auth to verify they're admin
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the calling user
    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling user:', callingUser.id);

    // Check if calling user is admin using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', callingUser.id)
      .maybeSingle();

    if (callerError || !callerData) {
      console.error('Error checking caller role:', callerError);
      return new Response(
        JSON.stringify({ error: 'Could not verify admin status' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerData.role !== 'admin' && callerData.role !== 'platform_admin') {
      console.error('User is not admin:', callerData.role);
      return new Response(
        JSON.stringify({ error: 'Only admins can reset user setup' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Caller verified as admin');

    // Parse request body
    const body: RequestBody = await req.json();
    const { target_user_id } = body;

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'target_user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resetting setup for user:', target_user_id);

    // 1. Delete user_companies records for the target user
    const { error: deleteError, count: deletedCount } = await supabaseAdmin
      .from('user_companies')
      .delete()
      .eq('user_id', target_user_id);

    if (deleteError) {
      console.error('Error deleting user_companies:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user companies: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleted user_companies records:', deletedCount);

    // 2. Update users.setup_completed = false and tour_completed = false
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        setup_completed: false,
        tour_completed: false 
      })
      .eq('id', target_user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User setup reset successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User setup has been reset. They will see the wizard on next login.',
        deleted_companies: deletedCount || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
