import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BroadcastBody {
  subject: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  attachments?: { name: string; url: string }[];
  audience: {
    type: 'all' | 'house' | 'year_group' | 'class' | 'role' | 'emails';
    value?: string;
    emails?: string[];
  };
  alsoCreateNotification?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // verify caller is staff
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const allowedRoles = ['librarian', 'staff', 'head_of_year', 'house_patron', 'homeroom_tutor'];
    if (!callerProfile || !allowedRoles.includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden — staff only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: BroadcastBody = await req.json();
    if (!body.subject?.trim() || !body.message?.trim()) {
      return new Response(JSON.stringify({ error: 'Subject and message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // build recipient query
    let q = supabase.from('profiles').select('user_id, email, full_name');
    switch (body.audience.type) {
      case 'house': q = q.eq('house', body.audience.value); break;
      case 'year_group': q = q.eq('year_group', body.audience.value); break;
      case 'class': q = q.eq('class_name', body.audience.value); break;
      case 'role': q = q.eq('role', body.audience.value); break;
      case 'individual': q = q.eq('user_id', body.audience.value); break;
      case 'all': default: break;
    }
    const { data: recipients, error: rErr } = await q.limit(2000);
    if (rErr) throw rErr;
    if (!recipients?.length) {
      return new Response(JSON.stringify({ error: 'No recipients matched' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // build HTML
    const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e7d3e,#2563eb);padding:24px;color:#fff">
          <h1 style="margin:0;font-size:20px">📚 Mpesa Foundation Academy</h1>
          <p style="margin:4px 0 0;font-size:13px;opacity:.9">Reading Challenge Announcement</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin:0 0 12px;color:#111">${escape(body.subject)}</h2>
          ${body.imageUrl ? `<img src="${escape(body.imageUrl)}" alt="" style="width:100%;border-radius:8px;margin:12px 0"/>` : ''}
          <div style="color:#374151;font-size:15px;line-height:1.6;white-space:pre-wrap">${escape(body.message)}</div>
          ${body.linkUrl ? `<p style="margin:24px 0 0"><a href="${escape(body.linkUrl)}" style="display:inline-block;background:#1e7d3e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${escape(body.linkLabel || 'Open Link')}</a></p>` : ''}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#6b7280;font-size:12px;margin:0">Sent by ${escape(callerProfile.full_name || 'Library Staff')}</p>
        </div>
      </div>`;

    // send in batches via Resend (free tier ~10/sec)
    const valid = recipients.filter(r => r.email);
    let sent = 0, failed = 0;
    for (let i = 0; i < valid.length; i += 50) {
      const batch = valid.slice(i, i + 50);
      const results = await Promise.allSettled(batch.map(r =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'MFA Reading <onboarding@resend.dev>',
            to: [r.email],
            subject: body.subject,
            html,
          }),
        }).then(async res => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
      ));
      results.forEach(r => r.status === 'fulfilled' ? sent++ : failed++);
      if (i + 50 < valid.length) await new Promise(r => setTimeout(r, 1100));
    }

    // also store as in-app notifications
    if (body.alsoCreateNotification !== false) {
      const notifs = valid.map(r => ({
        user_id: r.user_id,
        title: body.subject,
        message: body.message + (body.linkUrl ? `\n\n${body.linkUrl}` : ''),
        type: 'broadcast',
        email_sent: true,
      }));
      // chunk insert
      for (let i = 0; i < notifs.length; i += 500) {
        await supabase.from('notifications').insert(notifs.slice(i, i + 500));
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: valid.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
