import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
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
    // Get the request body first to validate input
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error('Failed to parse request JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { planId, planName, userEmail, userId, userName } = requestData;
    console.log('Received upgrade request for plan:', planName, planId, 'from user:', userEmail);

    if (!planId || !planName || !userEmail || !userId) {
      console.error('Missing required fields:', { planId, planName, userEmail, userId });
      return new Response(
        JSON.stringify({ error: 'Plan ID, name, user email, and user ID are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('APP_UPDATES_EMAIL');
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    
    // Validate environment variables
    const missingEnvVars = [];
    if (!supabaseUrl) missingEnvVars.push('SUPABASE_URL');
    if (!supabaseKey) missingEnvVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!resendApiKey) missingEnvVars.push('RESEND_API_KEY');
    if (!fromEmail) missingEnvVars.push('APP_UPDATES_EMAIL');
    if (!adminEmail) missingEnvVars.push('ADMIN_EMAIL');
    
    if (missingEnvVars.length > 0) {
      console.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error', 
          details: 'Missing required environment variables',
          missing: missingEnvVars
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
      });
    } catch (initError) {
      console.error('Failed to initialize Supabase client:', initError);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error', 
          details: 'Failed to initialize database client'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    let user;
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !userData.user) {
        console.error('Auth error:', userError);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token', details: userError?.message }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      user = userData.user;
    } catch (authError) {
      console.error('Error verifying authentication:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication error', 
          details: authError.message || 'Failed to verify authentication'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // No need to query the profiles table since we have all the user info

    // Send email using Resend API directly
    let emailSent = false;
    let emailError = null;
    
    try {
      console.log('Attempting to send email notification');
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: adminEmail,
          subject: `New Upgrade Request: ${planName}`,
          html: `
            <h2>New Upgrade Request</h2>
            <p><strong>User:</strong> ${userName || 'N/A'} (${userEmail})</p>
            <p><strong>Plan:</strong> ${planName} (ID: ${planId})</p>
            <p><strong>Requested at:</strong> ${new Date().toLocaleString()}</p>
            <p>Please contact the user to complete the upgrade process.</p>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({ message: 'Unknown email service error' }));
        console.error('Email API error:', errorData);
        emailError = errorData.message || 'Unknown email service error';
        throw new Error(`Email service error: ${emailError}`);
      }

      const emailData = await emailResponse.json().catch(() => ({}));
      emailSent = true;
      console.log('Email notification sent successfully');

      // Record the upgrade request in the database (optional)
      try {
        await supabase.from('upgrade_requests').insert({
          user_id: userId,
          plan_id: planId,
          plan_name: planName,
          email_sent: true
        });
      } catch (dbError) {
        console.error('Failed to record upgrade request in database:', dbError);
        // Non-critical error, continue
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Upgrade request received. We will contact you shortly!',
          email_status: 'sent'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Try to record the upgrade request even if email fails
      try {
        await supabase.from('upgrade_requests').insert({
          user_id: userId,
          plan_id: planId,
          plan_name: planName,
          email_sent: false,
          error_details: emailError.message || 'Unknown error'
        });
      } catch (dbError) {
        console.error('Failed to record upgrade request in database:', dbError);
        // Non-critical error, continue
      }
      
      // Even if email fails, we want to return success to the user
      // but log the error for debugging
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Upgrade request received. We will contact you shortly!',
          email_status: 'delayed',
          warning: 'Email notification may be delayed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
  } catch (error) {
    console.error('Error processing upgrade request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
