import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    // 1) ensure service 'generic'
    let { data: svc, error: svcErr } = await sb
      .from('otp_services')
      .select('id')
      .eq('code','generic')
      .limit(1)
      .maybeSingle();
    if (svcErr) throw svcErr;
    if (!svc?.id) {
      const { data: insSvc, error: insSvcErr } = await sb
        .from('otp_services')
        .insert({ id: crypto.randomUUID(), code: 'generic', name: 'Generic OTP' })
        .select('id')
        .single();
      if (insSvcErr) throw insSvcErr;
      svc = insSvc;
    }

    // 2) pick latest public user
    const { data: u, error: uErr } = await sb
      .from('users')
      .select('id,email')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (uErr) throw uErr;

    // 3) create a fresh session for your number
    const sessionRow = {
      user_id: u.id,
      service_id: svc.id,
      country: 'US',
      allocated_number: '+14243800358',
      status: 'pending',
      expires_at: new Date(Date.now() + 20*60*1000).toISOString(),
      created_at: new Date().toISOString()
    };
    const { data: sess, error: sessErr } = await sb
      .from('otp_sessions')
      .insert(sessionRow)
      .select('id')
      .single();
    if (sessErr) throw sessErr;

    // 4) insert a test message bound to that session
    const msgRow = {
      session_id: sess.id,
      from_number: '+15551234567',
      to_number: '+14243800358',
      message_body: 'Direct test 777888 (with session)',
      code: '777888',
      provider_payload: { source: 'test-insert' },
      received_at: new Date().toISOString()
    };
    const { error: msgErr } = await sb.from('otp_messages').insert(msgRow);
    if (msgErr) throw msgErr;

    return NextResponse.json({ ok: true, sessionId: sess.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
