// src/app/admin/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const router = useRouter();

  const [status, setStatus] = useState('checking'); // 'checking' | 'no-user' | 'not-admin' | 'ok'
  const [user, setUser] = useState(null);
  const [adminEmails, setAdminEmails] = useState([]);

  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
      const admins = adminEnv
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      setAdminEmails(admins);

      if (error) {
        console.error('[ADMIN] Error getting user:', error);
      }

      if (!user) {
        setStatus('no-user');
        return;
      }

      const isAdminUser =
        user.email && admins.includes(user.email.toLowerCase());

      if (!isAdminUser) {
        setUser(user);
        setStatus('not-admin');
        return;
      }

      setUser(user);
      setStatus('ok');
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleLoadUsers = async () => {
    if (!user?.email) return;
    setUsersLoading(true);
    setUsersError('');
    setShowUsers(true);

    try {
      const res = await fetch(
        `/api/admin/users?email=${encodeURIComponent(user.email)}`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUsersError(body.error || 'Failed to load users');
        setUsersLoading(false);
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsersError('Unexpected error while loading users');
    } finally {
      setUsersLoading(false);
    }
  };

  // 1) Still checking
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 rounded-full border-2 border-slate-500 border-t-white animate-spin mx-auto" />
          <p className="text-sm text-slate-400">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  // 2) Not logged in
  if (status === 'no-user') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <h1 className="text-xl font-semibold mb-2">Login required</h1>
        <p className="text-sm text-slate-400 mb-4">
          You&apos;re not logged in. Please sign in on the main page, then come back to /admin.
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition"
        >
          Go to home
        </button>
      </div>
    );
  }

  // 3) Logged in but not admin
  if (status === 'not-admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
        <h1 className="text-xl font-semibold mb-2">No admin access</h1>
        <p className="text-sm text-slate-400 mb-2">
          You&apos;re logged in as <span className="font-mono">{user?.email}</span>,
          but only these emails are allowed as admins:
        </p>
        <p className="text-xs text-slate-300 font-mono mb-4">
          {adminEmails.length ? adminEmails.join(', ') : '(none set)'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition"
        >
          Go back home
        </button>
      </div>
    );
  }

  // 4) Admin OK — show real dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">
            SuperWallet Admin
          </h1>
          <p className="text-xs text-slate-400">
            Signed in as {user?.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition"
        >
          Sign out
        </button>
      </header>

      {/* Main content */}
      <main className="px-4 py-6 max-w-5xl mx-auto space-y-6">
        {/* Summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Users
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {users.length ? users.length : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total registered users (first 100 shown below).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Wallet balance (total)
            </p>
            <p className="mt-2 text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-slate-500">
              Later: sum of all user balances.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              OTP Purchases (24h)
            </p>
            <p className="mt-2 text-2xl font-semibold">—</p>
            <p className="mt-1 text-xs text-slate-500">
              Later: recent number/OTP purchases.
            </p>
          </div>
        </section>

        {/* Admin sections */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Admin sections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Users */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold">
                👤 Users
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                View all registered users, balances, status.
              </p>
              <button
                onClick={handleLoadUsers}
                className="mt-3 text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition disabled:opacity-50"
                disabled={usersLoading}
              >
                {usersLoading ? 'Loading users...' : 'View users'}
              </button>
              {usersError && (
                <p className="mt-2 text-xs text-rose-400">
                  {usersError}
                </p>
              )}
            </div>

            {/* Numbers / services */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold">
                📱 Numbers &amp; Services
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Manage virtual numbers, prices, and supported apps.
              </p>
              <button className="mt-3 text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition">
                Manage numbers (coming soon)
              </button>
            </div>

            {/* Transactions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold">
                💸 Transactions &amp; Wallets
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Track deposits, purchases, refunds, and balances.
              </p>
              <button className="mt-3 text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition">
                View transactions (coming soon)
              </button>
            </div>

            {/* Logs / system */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold">
                📊 Logs &amp; System
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Monitor errors, API usage, and provider balance.
              </p>
              <button className="mt-3 text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-900 transition">
                View logs (coming soon)
              </button>
            </div>
          </div>
        </section>

        {/* Users table */}
        {showUsers && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Registered users
              </h2>
              <span className="text-[11px] text-slate-500">
                Showing up to 100 users from Supabase Auth
              </span>
            </div>

            {usersLoading && (
              <p className="text-xs text-slate-400">Loading users…</p>
            )}

            {!usersLoading && users.length === 0 && !usersError && (
              <p className="text-xs text-slate-500">
                No users found yet.
              </p>
            )}

            {!usersLoading && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 pr-3 font-medium">User ID</th>
                      <th className="py-2 pr-3 font-medium">Created at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-slate-900/60 last:border-b-0"
                      >
                        <td className="py-2 pr-3 font-mono text-[11px]">
                          {u.email}
                        </td>
                        <td className="py-2 pr-3 font-mono text-[11px] text-slate-400">
                          {u.id}
                        </td>
                        <td className="py-2 pr-3 text-[11px] text-slate-400">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
