const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, caller_id } = await req.json()

    if (!user_id || !caller_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id or caller_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is a librarian
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', caller_id)
      .single()

    if (!callerProfile || callerProfile.role !== 'librarian') {
      return new Response(JSON.stringify({ error: 'Unauthorized: only librarians can reset passwords' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Reset password to Mpesa123
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: 'Mpesa123'
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send notification to the user
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', user_id)
      .single()

    if (targetProfile) {
      await supabaseAdmin.from('notifications').insert({
        user_id,
        type: 'system',
        title: '🔑 Password Reset',
        message: 'Your password has been reset by a librarian. Your new temporary password is: Mpesa123. Please change it after logging in.'
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
