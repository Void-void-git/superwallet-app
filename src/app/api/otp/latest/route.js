import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function normalizeE164(input) {
  if (!input) return null;
  const digits = String(input).replace(/[^\d]/g, ''); // keep only 0-9
  return digits ? ('+' + digits) : null;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawNumber = searchParams.get('number');      // might be " 1928..." if '+' was decoded to space
    const sessionId = searchParams.get('sessionId');

    // normalize number like "+19283921511"
    const number = normalizeE164(rawNumber);

    // pick session
    let sid = sessionId || null;
    if (!sid && number) {
      const { data: sess } = await sb
        .from('otp_sessions')
        .select('id')
        .eq('allocated_number', number)
        .in('status', ['pending','allocated','completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      sid = sess?.id || null;
    }
    if (!sid) return NextResponse.json({ sessionId: null, code: null, message: null, at: null });

    // latest message for session
    const { data: msg } = await sb
      .from('otp_messages')
      .select('code, message_body, received_at')
      .eq('session_id', sid)
      .order('received_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      sessionId: sid,
      code: msg?.code || null,
      message: msg?.message_body || null,
      at: msg?.received_at || null
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'otp/latest error' }, { status: 500 });
  }
}
