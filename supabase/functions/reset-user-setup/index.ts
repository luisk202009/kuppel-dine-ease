import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Resetting setup for user:', user.id);

    // Get user's companies and branches
    const { data: userCompanies } = await supabaseAdmin
      .from('user_companies')
      .select('company_id, branch_id')
      .eq('user_id', user.id);

    if (!userCompanies || userCompanies.length === 0) {
      console.log('No companies found for user');
      return new Response(
        JSON.stringify({ error: 'No companies associated with user' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const companyIds = [...new Set(userCompanies.map(uc => uc.company_id))];
    const branchIds = [...new Set(userCompanies.map(uc => uc.branch_id).filter(Boolean))];

    console.log('Cleaning data for companies:', companyIds, 'and branches:', branchIds);

    // Delete in correct order respecting foreign keys
    // 1. Get all orders for the user's branches
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .in('branch_id', branchIds);

    // 2. Delete order_items
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      await supabaseAdmin
        .from('order_items')
        .delete()
        .in('order_id', orderIds);
      console.log('Deleted order_items');
    }

    // 3. Delete orders
    await supabaseAdmin
      .from('orders')
      .delete()
      .in('branch_id', branchIds);
    console.log('Deleted orders');

    // 4. Delete tables
    await supabaseAdmin
      .from('tables')
      .delete()
      .in('branch_id', branchIds);
    console.log('Deleted tables');

    // 5. Delete areas
    await supabaseAdmin
      .from('areas')
      .delete()
      .in('branch_id', branchIds);
    console.log('Deleted areas');

    // 6. Delete products
    await supabaseAdmin
      .from('products')
      .delete()
      .in('company_id', companyIds);
    console.log('Deleted products');

    // 7. Delete categories
    await supabaseAdmin
      .from('categories')
      .delete()
      .in('company_id', companyIds);
    console.log('Deleted categories');

    // 8. Reset setup_completed flag using service role to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ setup_completed: false, tour_completed: false })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error resetting setup flag:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to reset setup flag', details: updateError.message }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Setup reset successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Setup reset successfully. You can now go through the setup wizard again.'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in reset-user-setup function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
