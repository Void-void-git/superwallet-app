// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabaseAdminClient';

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const callerEmail = (searchParams.get('email') || '').toLowerCase();

  if (!callerEmail || !adminEmails.includes(callerEmail)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) {
      console.error('Error listing users:', error);
      return NextResponse.json(
        { error: 'Failed to list users' },
        { status: 500 }
      );
    }

    const users = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error('Unexpected error listing users:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
