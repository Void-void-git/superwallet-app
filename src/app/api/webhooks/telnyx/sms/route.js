import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function POST(req) {
  try {
    const body = await req.json();

    const payload = body?.data?.payload || body?.data || body;
    const to = payload?.to?.[0]?.phone_number || payload?.to?.[0] || payload?.to || "";
    const from = payload?.from?.phone_number || payload?.from || "";
    const text = payload?.text || payload?.body || "";

    if (!to || !text) return NextResponse.json({ ok: true, skip: "no to/text" });

    const { data: sess } = await supabaseAdmin
      .from("otp_sessions")
      .select("id")
      .eq("allocated_number", to)
      .in("status", ["pending","allocated"])
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const match = String(text).match(/\b\d{4,8}\b/);
    const code = match?.[0] || null;

    await supabaseAdmin.from("otp_messages").insert({
      session_id: sess?.id || null,
      from_number: from || null,
      to_number: to || null,
      message_body: text || null,
      code,
      provider_payload: body,
      received_at: new Date().toISOString()
    });

    if (sess?.id && code) {
      await supabaseAdmin.from("otp_sessions")
        .update({ status: "completed" })
        .eq("id", sess.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("telnyx webhook error", e);
    return NextResponse.json({ error: e?.message || "telnyx webhook error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}
