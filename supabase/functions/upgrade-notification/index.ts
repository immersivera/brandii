import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the request body
    const requestData = await req.json();
    const { planId, planName } = requestData;

    if (!planId || !planName) {
      return new Response(JSON.stringify({ error: 'Plan ID and name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    // Initialize Resend with API key from environment variables
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: Deno.env.get('APP_UPDATES_EMAIL'),
      to: Deno.env.get('ADMIN_EMAIL'), // Your email address to receive the notification
      subject: `New Upgrade Request: ${planName}`,
      html: `
        <h2>New Upgrade Request</h2>
        <p><strong>User:</strong> ${profile.full_name || 'N/A'} (${user.email})</p>
        <p><strong>Plan:</strong> ${planName} (ID: ${planId})</p>
        <p><strong>Requested at:</strong> ${new Date().toLocaleString()}</p>
        <p>Please contact the user to complete the upgrade process.</p>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw new Error('Failed to send upgrade notification email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Upgrade request received. We will contact you shortly!',
        emailData 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing upgrade request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString() 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    );
  }
});
