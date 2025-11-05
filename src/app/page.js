"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sun, Moon, LogOut, HelpCircle, Phone, DollarSign, History,
  LayoutGrid, Sparkles, Shield, Lock, Search, Clipboard,
  CheckCircle, X, User, KeyRound, Trash2, Save, AlertTriangle
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/* ---------------- Theme ---------------- */
const t = {
  bg: "bg-[#081225]",
  panel: "bg-[#0D1A33]",
  text: "text-slate-200",
  sub: "text-slate-400",
  ring: "ring-1 ring-white/10",
  grad: "bg-gradient-to-r from-blue-600 to-indigo-700",
};
const lightFix = {
  text: "text-slate-800",
  sub: "text-slate-600",
  panel: "bg-white",
  ring: "ring-1 ring-slate-200",
  border: "border border-slate-200",
};

/* ---------------- Small UI ---------------- */
const Btn = ({ as = "button", variant = "solid", size = "md", className = "", ...props }) => {
  const base = "inline-flex items-center justify-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 gap-2";
  const variants = {
    solid: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border border-white/20 hover:bg-white/10 text-white",
    ghost: "hover:bg-white/10 text-white",
    destructive: "bg-rose-500 hover:bg-rose-600 text-white",
    lightOutline: "border border-slate-300 hover:bg-slate-100 text-slate-800",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5" };
  const Comp = as;
  return <Comp className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
};
const Card = ({ className = "", children, light = false }) => (
  <div className={`rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,.20)] ${light ? `${lightFix.panel} ${lightFix.border}` : `${t.panel} ${t.ring}`} ${className}`}>{children}</div>
);
const CardContent = ({ className = "", children }) => <div className={`p-6 md:p-7 ${className}`}>{children}</div>;
const Input = ({ light = false, className = "", ...props }) => (
  <input {...props} className={`w-full rounded-xl px-3 py-2 text-sm outline-none placeholder:opacity-60 ${light ? "bg-white border border-slate-300 text-slate-900" : "bg-white/5 border border-white/15 text-white"} ${className}`} />
);

/* ---------------- Minimal Dialog ---------------- */
function Dialog({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#0D1A33] text-slate-100 rounded-2xl p-4 w-full max-w-lg shadow-xl border border-white/10">
        {children}
      </div>
    </div>
  );
}
const DialogHeader = ({ children }) => <div className="mb-2">{children}</div>;
const DialogTitle = ({ children, className = "" }) => <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
const DialogDescription = ({ children }) => <p className="text-sm opacity-80">{children}</p>;
const DialogFooter = ({ children, className = "" }) => <div className={`mt-4 flex items-center justify-end gap-2 ${className}`}>{children}</div>;

/* ---------------- Helpers & Countdown ---------------- */
const flag = (c = "") => {
  const s = String(c).toLowerCase();
  const map = { us:"🇺🇸", uk:"🇬🇧", gb:"🇬🇧", ng:"🇳🇬", in:"🇮🇳", fr:"🇫🇷", ca:"🇨🇦", de:"🇩🇪", ae:"🇦🇪", jp:"🇯🇵" };
  return map[s] || "🌐";
};
function CountdownTimer({ endsAt, dark }) {
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();
    const start = Date.now();
    const tot = Math.max(1, Math.floor((end - start) / 1000));
    setTotal(tot);
    setLeft(tot);
    const id = setInterval(() => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);
  const pct = total ? Math.max(0, Math.min(100, Math.round(((total - left) / total) * 100))) : 0;
  return (
    <div className={`rounded-2xl p-4 ${dark ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>Session countdown</div>
        <div className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{pct}%</div>
      </div>
      <div className={`${dark ? "bg-white/10" : "bg-slate-200"} h-2 rounded-full overflow-hidden`}>
        <div className={`h-2 ${dark ? "bg-gradient-to-r from-emerald-400 to-blue-500" : "bg-gradient-to-r from-emerald-500 to-blue-600"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className={`text-4xl font-extrabold tabular-nums tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{left}s</div>
        <div className={`${dark ? "text-slate-300" : "text-slate-600"} text-sm`}>remaining</div>
      </div>
      <div className={`${dark ? "text-slate-400" : "text-slate-600"} text-xs mt-1`}>Don’t close this page — we’ll auto-catch your OTP SMS here.</div>
    </div>
  );
}

/* ---------------- Main Component ---------------- */
export default function DialProApp() {
  // Router + theme
  const [active, setActive] = useState("landing");
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Real auth via Supabase
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session ?? null);
      setAuthReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription?.unsubscribe?.();
  }, []);

  // Profile basics for greeting
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const displayName = fullName || session?.user?.email?.split("@")[0] || "User";

  // Wallet UI
  const [balanceUSD, setBalanceUSD] = useState(52.4);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositCurrency, setDepositCurrency] = useState("NGN");
  const [depositAmount, setDepositAmount] = useState("");
  const rate = displayCurrency === "USD" ? 1 : 1600;
  const balancePretty = useMemo(
    () => (balanceUSD * rate).toFixed(displayCurrency === "USD" ? 2 : 0),
    [balanceUSD, displayCurrency, rate]
  );
  const depositUSD = useMemo(() => {
    const v = parseFloat(String(depositAmount)) || 0;
    return depositCurrency === "NGN" ? v / 1600 : v;
  }, [depositAmount, depositCurrency]);
  const handleDeposit = () => {
    if ((depositUSD || 0) <= 0) return;
    setBalanceUSD((b) => b + Number(depositUSD.toFixed(2)));
    setDepositOpen(false);
    setDepositAmount("");
  };

  /* ---------- Top Nav ---------- */
  const Nav = () => (
    <header className="max-w-7xl mx-auto px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setActive(session ? "home" : "landing")} className="flex items-center gap-2 group" aria-label="Go to Home">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 ring-1 ring-white/20 group-hover:scale-105 transition" />
            <span className={`font-semibold tracking-wide text-lg ${darkMode ? "text-white" : "text-slate-900"}`}>DialPro</span>
          </button>

          {/* Home visible only when logged in */}
          {session && (
            <Btn variant={darkMode ? "outline" : "lightOutline"} size="sm" onClick={() => setActive("home")}>
              Home
            </Btn>
          )}

          {session && (
            <Btn variant={darkMode ? "outline" : "lightOutline"} size="sm" onClick={() => setMenuOpen(true)}>
              <LayoutGrid size={14} /> Actions
            </Btn>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Btn variant={darkMode ? "outline" : "lightOutline"} size="sm" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </Btn>

          {!session ? (
            <>
              <Btn size="sm" className={`${t.grad} text-white`} onClick={() => setActive("signup")}>
                <Sparkles size={14} /> Create
              </Btn>
              <Btn size="sm" variant={darkMode ? "outline" : "lightOutline"} onClick={() => setActive("login")}>
                <Lock size={14} /> Sign in
              </Btn>
            </>
          ) : (
            <Btn
              size="sm"
              variant={darkMode ? "outline" : "lightOutline"}
              onClick={async () => {
                await supabase.auth.signOut();
                setActive("landing");
              }}
            >
              <LogOut size={14} />
            </Btn>
          )}
        </div>
      </div>

      {/* Balance strip only when logged in */}
      {session && (
        <div className={`mt-4 rounded-2xl px-4 py-3 flex items-center justify-between ${darkMode ? "bg-white/5 border border-white/10 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
          <div className="flex items-center gap-3">
            <DollarSign size={18} className={darkMode ? "text-emerald-300" : "text-emerald-600"} />
            <span className={`${darkMode ? "text-slate-300" : "text-slate-700"}`}>Balance</span>
            <span className={`text-xl font-semibold ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>{displayCurrency === "USD" ? "$" : "₦"}{balancePretty}</span>
            <div className={`inline-flex rounded-xl overflow-hidden ${darkMode ? "border border-white/15 bg-white/5" : "border border-slate-300 bg-white"}`}>
              {["USD", "NGN"].map((c) => (
                <button key={c} onClick={() => setDisplayCurrency(c)} className={`px-3 py-1.5 text-xs transition ${displayCurrency === c ? (darkMode ? "bg-white/15 text-white" : "bg-slate-100 text-slate-900") : "opacity-80"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Btn size="sm" variant={darkMode ? "outline" : "lightOutline"} onClick={() => setDepositOpen(true)}><DollarSign size={16} /> Deposit</Btn>
            <Btn size="sm" variant={darkMode ? "outline" : "lightOutline"}> <History size={16} /> Activity</Btn>
          </div>
        </div>
      )}
    </header>
  );

  /* ---------- Landing ---------- */
  const Landing = () => (
    <section className="max-w-7xl mx-auto px-6 pt-10 pb-16">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className={`mt-1 text-5xl md:text-6xl font-black leading-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
            Get a number. <br/> Capture the code.
          </h1>
          <p className={`mt-5 text-lg ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            Pick country & service, start verification, and watch OTPs arrive here in real-time.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Btn className={`${t.grad}`} onClick={() => setActive("signup")}>Create account</Btn>
            <Btn variant={darkMode ? "outline" : "lightOutline"} onClick={() => setActive("login")}><Lock size={16}/> Sign in</Btn>
          </div>
          <div className={`mt-6 text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Global coverage • Instant activation • Privacy-first
          </div>
        </div>
        <div className="relative">
          <Card light={!darkMode}>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {["us","+1","uk","+44","de","+49","fr","+33","ca","+1 CA","ng","+234"].map((v,i)=>(
                  <div key={i} className={`aspect-square flex items-center justify-center rounded-2xl text-sm font-medium
                    ${darkMode ? "bg-white/5 ring-1 ring-white/10 text-slate-200" : "bg-slate-50 ring-1 ring-slate-200 text-slate-800"}`}>
                    {i%2===0 ? flag(v) : v}
                  </div>
                ))}
              </div>
              <p className={`${darkMode ? t.sub : lightFix.sub} text-sm mt-4`}>Many more regions supported.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );

  /* ---------- Home (auth-gated) ---------- */
  const Home = () => (
    <section className="max-w-7xl mx-auto px-6 pb-16">
      <div className="mb-4">
        <Card light={!darkMode}>
          <CardContent className="flex items-start gap-3">
            <AlertTriangle className={darkMode ? "text-amber-300" : "text-amber-600"} size={18}/>
            <div>
              <div className={`font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Maintenance window</div>
              <div className={`${darkMode ? t.sub : lightFix.sub} text-sm`}>SMS ingestion upgrade tonight 01:00–01:15 UTC. No action needed.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2" light={!darkMode}>
          <CardContent>
            <h2 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Welcome back, {displayName}</h2>
            <p className={`${darkMode ? t.sub : lightFix.sub} mt-1 text-sm`}>All systems normal. Start a verification or manage numbers.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className={`rounded-xl p-4 ${darkMode ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"}`}>
                <div className="text-sm mb-2">One-time verification</div>
                <Btn onClick={()=>setActive("otp")} className="w-full"><Phone size={16}/> Start verification</Btn>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"}`}>
                <div className="text-sm mb-2">Reserve / Monthly</div>
                <Btn variant={darkMode ? "outline" : "lightOutline"} onClick={()=>setActive("reserve")} className="w-full"><Phone size={16}/> Browse numbers</Btn>
              </div>
            </div>

            <div className="mt-6">
              <div className={`text-sm ${darkMode ? t.sub : lightFix.sub}`}>Recent info</div>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                {[
                  { id: 1, title:"NGN local payments", text:"Paystack checkout added for Nigeria users." },
                  { id: 2, title:"eSIM (preview)", text:"Early access is live—QR activation in tests." },
                ].map(up=>(
                  <div key={up.id} className={`rounded-xl px-4 py-3 ${darkMode ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"}`}>
                    <div className={`font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>{up.title}</div>
                    <div className={`${darkMode ? t.sub : lightFix.sub} text-sm`}>{up.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card light={!darkMode}>
          <CardContent className="flex flex-col gap-3">
            <h3 className={`font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Shortcuts</h3>
            <Btn onClick={()=>setActive("otp")}><Phone size={16}/> One-time verification</Btn>
            <Btn variant={darkMode ? "outline" : "lightOutline"} onClick={()=>setActive("reserve")}><Phone size={16}/> Reserve number</Btn>
            <Btn variant={darkMode ? "outline" : "lightOutline"}><History size={16}/> Transactions</Btn>
            <Btn variant={darkMode ? "outline" : "lightOutline"} onClick={()=>setActive("profile")}><User size={16}/> Profile</Btn>
          </CardContent>
        </Card>
      </div>
    </section>
  );

  /* ---------- Auth (real Supabase) ---------- */
  const Auth = ({ mode }) => {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [confirm, setConfirm] = useState("");
    const [err, setErr] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const strength = (() => {
      let s = 0;
      if (pass.length >= 8) s++;
      if (/[A-Z]/.test(pass)) s++;
      if (/[a-z]/.test(pass)) s++;
      if (/\d/.test(pass)) s++;
      if (/[^A-Za-z0-9]/.test(pass)) s++;
      return Math.min(4, s);
    })();
    const bar = (i)=>(
      <div key={i} className={`h-1 rounded ${i<=strength ? (darkMode ? "bg-emerald-400" : "bg-emerald-600") : (darkMode ? "bg-white/10" : "bg-slate-200")}`} />
    );

    const submit = async () => {
      setErr(""); setInfo(""); setLoading(true);
      try {
        if (!email || !pass) throw new Error("Enter email and password");
        if (mode === "signup") {
          if (!confirm) throw new Error("Re-enter your password");
          if (pass !== confirm) throw new Error("Passwords do not match");
          const { error } = await supabase.auth.signUp({ email, password: pass });
          if (error) throw error;
          setInfo("Check your email to confirm your account.");
          setActive("login");
          return;
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) throw error;
          setActive("home");
        }
      } catch (e) {
        setErr(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    return (
      <section className="max-w-md mx-auto px-6 pt-6 pb-16">
        <Card light={!darkMode}>
          <CardContent>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs
                bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-white/15">
                {mode==="signup" ? <Sparkles size={14}/> : <Lock size={14}/>}
                {mode==="signup" ? "Create your DialPro account" : "Welcome back"}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {err && <div className="text-rose-400 text-sm">{err}</div>}
              {info && <div className="text-emerald-400 text-sm">{info}</div>}
              <Input light={!darkMode} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" />
              <Input light={!darkMode} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder={mode==="signup"?"Create password":"Password"} />
              {mode === "signup" && (
                <>
                  <div className="grid grid-cols-4 gap-1">{[0,1,2,3].map(bar)}</div>
                  <Input light={!darkMode} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password" />
                </>
              )}
            </div>

            <div className="mt-5">
              <Btn className={`${t.grad} w-full`} onClick={submit} disabled={loading}>
                {loading ? "Please wait…" : (mode==="signup" ? "Create account" : "Continue")}
              </Btn>
              <Btn variant={darkMode ? "outline" : "lightOutline"} className="w-full mt-2" onClick={() => setActive(session ? "home" : "landing")}>Back</Btn>
            </div>

            <div className={`mt-4 text-xs text-center ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              {mode === "signup" ? (
                <>Already have an account? <button className="underline" onClick={()=>setActive("login")}>Sign in</button></>
              ) : (
                <>New here? <button className="underline" onClick={()=>setActive("signup")}>Create account</button></>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  };

  /* ---------- OTP (UI kept; provider integration comes later) ---------- */
  const OtpFlow = () => {
    // hooks first
    const meta = { services:[{code:"whatsapp",name:"WhatsApp"},{code:"gmail",name:"Google Gmail"},{code:"yahoo",name:"Yahoo"},{code:"instagram",name:"Instagram"}], countries:["US","UK","DE","FR","CA","NG"] };
    const [serviceCode, setServiceCode] = useState("whatsapp");
    const [countryPick, setCountryPick] = useState("US");
    const [otpLoading, setOtpLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [allocated, setAllocated] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [otpCode, setOtpCode] = useState("");
    const [lastMsg, setLastMsg] = useState(null);

    // gate AFTER hooks
    if (!session) return <Gate text="Sign in to start a verification" onSignup={()=>setActive("signup")} onLogin={()=>setActive("login")} />;

    async function startOtp() {
      setOtpLoading(true);
      try {
        // UI demo: simulate a session allocation + OTP
        const fakeSession = Math.random().toString(36).slice(2, 10);
        const fakeNumber = countryPick === "US" ? "+1 415 555 0137" : countryPick === "UK" ? "+44 7700 900 111" : "+49 3012 345 678";
        setSessionId(fakeSession);
        setAllocated(fakeNumber);
        const end = new Date(Date.now() + 1000 * 60 * 5);
        setExpiresAt(end.toISOString());
        setOtpCode("");
        setLastMsg(null);
        setTimeout(()=>{ setLastMsg({ message_body: `Your ${serviceCode} code is 8 4 2 9 1 6`, received_at: new Date().toISOString() }); }, 3000);
        setTimeout(()=>{ setOtpCode("842916"); }, 5000);
      } finally {
        setOtpLoading(false);
      }
    }
    const refreshLatest = () => {
      if (!lastMsg) return setLastMsg({ message_body: "No new messages yet…", received_at: new Date().toISOString() });
      setLastMsg({ ...lastMsg, received_at: new Date().toISOString() });
    };

    return (
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <Card light={!darkMode}>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3 md:items-end">
              <div className="md:col-span-1">
                <label className={`text-xs mb-1 block ${darkMode ? t.sub : lightFix.sub}`}>Country</label>
                <select value={countryPick} onChange={(e)=>setCountryPick(e.target.value)} className={`w-full rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-white/5 border border-white/15 text-white" : "bg-white border border-slate-300 text-slate-900"}`}>
                  {meta.countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={`text-xs mb-1 block ${darkMode ? t.sub : lightFix.sub}`}>Service</label>
                <select value={serviceCode} onChange={(e)=>setServiceCode(e.target.value)} className={`w-full rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-white/5 border border-white/15 text-white" : "bg-white border border-slate-300 text-slate-900"}`}>
                  {meta.services.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-1">
                <Btn onClick={startOtp} disabled={otpLoading} className="w-full">{otpLoading ? "Getting…" : "Start Verification"}</Btn>
              </div>
            </div>

            {(sessionId || allocated) && (
              <div className="mt-5 grid md:grid-cols-3 gap-3">
                <div className={`${darkMode ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"} rounded-xl p-4`}>
                  <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Your verification number</div>
                  <div className={`text-2xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{allocated || "—"}</div>
                  <div className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Session: {sessionId}</div>
                  <div className="mt-3 flex gap-2">
                    <Btn variant={darkMode ? "outline" : "lightOutline"} size="sm" onClick={refreshLatest}>Refresh</Btn>
                    <Btn variant={darkMode ? "outline" : "lightOutline"} size="sm" onClick={async ()=>{ try { await navigator.clipboard.writeText(allocated || ""); } catch {} }}>
                      <Clipboard size={14}/> Copy
                    </Btn>
                  </div>
                </div>

                <CountdownTimer endsAt={expiresAt} dark={darkMode} />

                <div className={`${darkMode ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"} rounded-xl p-4`}>
                  <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Latest message</div>
                  <div className={`mt-1 text-sm ${darkMode ? "text-slate-200" : "text-slate-800"} whitespace-pre-wrap`}>
                    {lastMsg?.message_body || "—"}
                  </div>
                </div>
              </div>
            )}

            {otpCode && (
              <div className={`mt-4 rounded-2xl p-5 flex items-center justify-between ${darkMode ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-200" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>
                <div>
                  <div className="text-xs opacity-80">OTP Code</div>
                  <div className="text-4xl md:text-5xl font-black tracking-[0.35em]">{otpCode}</div>
                </div>
                <Btn variant={darkMode ? "outline" : "lightOutline"} onClick={async ()=>{ try { await navigator.clipboard.writeText(otpCode); } catch {} }}>
                  <Clipboard size={16}/> Copy
                </Btn>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    );
  };

  /* ---------- Reserve (auth-gated) ---------- */
  const Reserve = () => {
    const [term, setTerm] = useState("");
    const [plan, setPlan] = useState("All");
    const numbers = [
      { id:1, e164:"+1 415 550 0123", country:"US", region:"CA", price:1, kind:"OTP" },
      { id:2, e164:"+44 7700 900 111", country:"UK", region:"LON", price:3, kind:"7-Day" },
      { id:3, e164:"+49 3012 345 678", country:"DE", region:"BER", price:9, kind:"Monthly" },
      { id:4, e164:"+33 612 34 56 78", country:"FR", region:"PAR", price:9, kind:"Monthly" },
    ];
    const filtered = numbers
      .filter(n => (plan==="All" ? true : n.kind === plan))
      .filter(n => [n.e164, n.country, n.region].join(" ").toLowerCase().includes(term.toLowerCase()));

    if (!session) return <Gate text="Sign in to reserve numbers" onSignup={()=>setActive("signup")} onLogin={()=>setActive("login")} />;

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [copied, setCopied] = useState(false);

    return (
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className={`rounded-2xl p-3 flex flex-wrap items-center gap-3
          ${darkMode ? "bg-[#081225]/80 border border-white/10" : "bg-white/90 border border-slate-200"}`}>
          <div className={`inline-flex rounded-xl overflow-hidden ${darkMode ? "border border-white/15 bg-white/5" : "border border-slate-300 bg-white"}`}>
            {["All","OTP","7-Day","Monthly"].map((p) => (
              <button key={p} onClick={()=>setPlan(p)} className={`px-3 py-1.5 text-xs transition ${plan===p ? (darkMode ? "bg-white/15 text-white" : "bg-slate-100 text-slate-900") : "opacity-80"}`}>{p}</button>
            ))}
          </div>
          <div className="relative ml-auto min-w-[240px]">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "opacity-60 text-white" : "opacity-60 text-slate-600"}`}/>
            <Input light={!darkMode} placeholder="Search country, region, or number…" value={term} onChange={(e)=>setTerm(e.target.value)} className="pl-9"/>
          </div>
        </div>

        <Card className="mt-4" light={!darkMode}>
          <CardContent className="p-0">
            <div className={`max-h-[540px] overflow-y-auto ${darkMode ? "divide-white/10" : "divide-slate-200"} divide-y`}>
              {filtered.map((n)=>(
                <div key={n.id} className={`group flex items-center gap-4 px-4 sm:px-6 py-4 transition ${darkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                  <div className="text-2xl shrink-0">{flag(n.country)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{n.e164}</span>
                      <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>• {n.country} • {n.region}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-white/10 border border-white/15 text-white" : "bg-slate-100 border border-slate-200 text-slate-700"}`}>{n.kind}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>${n.price}{n.kind==="Monthly" && <span className={`${darkMode ? "text-slate-400" : "text-slate-600"} text-xs`}>/mo</span>}</div>
                    <div className="mt-1 flex gap-2 justify-end">
                      <Btn size="sm" variant={darkMode ? "outline" : "lightOutline"} onClick={()=>{setSelected(n); setOpen(true);}}>Details</Btn>
                      <Btn size="sm" onClick={()=>{setSelected(n); setOpen(true);}}>Reserve</Btn>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length===0 && <div className={`px-6 py-12 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>No numbers match your filters.</div>}
            </div>
          </CardContent>
        </Card>

        <Dialog open={open} onClose={()=>setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{selected?.e164 || "—"}</DialogTitle>
            <DialogDescription>{selected && `${selected.country} • ${selected.region} • ${selected.kind}`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Btn variant="outline" size="sm" onClick={async ()=>{
                if (!selected) return;
                try { await navigator.clipboard.writeText(selected.e164); setCopied(true); setTimeout(()=>setCopied(false),1200);} catch {}
              }} className="flex items-center gap-2">{copied ? <CheckCircle size={14}/> : <Clipboard size={14}/>}{copied ? "Copied" : "Copy"}</Btn>
              <div className="text-sm"><span className="font-semibold">${selected?.price || 0}</span>{selected?.kind==="Monthly" && <span className="text-slate-400"> / mo</span>}</div>
            </div>
          </div>
          <DialogFooter>
            <Btn onClick={()=>setOpen(false)}>Continue</Btn>
            <Btn variant="ghost" onClick={()=>setOpen(false)}>Close</Btn>
          </DialogFooter>
        </Dialog>
      </section>
    );
  };

  /* ---------- Profile (auth-gated) ---------- */
  const Profile = () => {
    const [saving, setSaving] = useState(false);
    const [info, setInfo] = useState({ msg: "", kind: "" });
    const [notifications, setNotifications] = useState([
      { id: 1, message: "Deposit of $29 confirmed", time: "1h ago" },
      { id: 2, message: "Reserved +1-415-550-0123", time: "2h ago" },
    ]);

    if (!session) return <Gate text="Sign in to view profile" onSignup={()=>setActive("signup")} onLogin={()=>setActive("login")} />;

    const saveProfile = async () => {
      setSaving(true); setInfo({ msg: "", kind: "" });
      setTimeout(()=>{ setInfo({ msg: "Profile saved.", kind: "success" }); setSaving(false); }, 600);
    };
    const resetPassword = async () => setInfo({ msg: "Reset email sent (demo)", kind: "success" });
    const deleteAccount = async () => { setInfo({ msg: "Account deletion requires admin (demo)", kind: "info" }); };

    return (
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <Card light={!darkMode}>
          <CardContent>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-slate-900"}`}>Profile</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={`text-xs mb-1 block ${darkMode ? t.sub : lightFix.sub}`}>Full name</label>
                <Input light={!darkMode} value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className={`text-xs mb-1 block ${darkMode ? t.sub : lightFix.sub}`}>Avatar URL</label>
                <Input light={!darkMode} value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="https://…" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Btn onClick={saveProfile} disabled={saving}><Save size={16}/> {saving ? "Saving…" : "Save changes"}</Btn>
              <Btn variant={darkMode ? "outline" : "lightOutline"} onClick={resetPassword}><KeyRound size={16}/> Reset password</Btn>
              <Btn variant="destructive" onClick={deleteAccount}><Trash2 size={16}/> Delete account</Btn>
            </div>
            {info.msg && (
              <div className={`mt-3 text-sm ${
                info.kind === "success" ? (darkMode ? "text-emerald-300" : "text-emerald-700")
                : info.kind === "error" ? "text-rose-400"
                : (darkMode ? "text-slate-300" : "text-slate-700")
              }`}>{info.msg}</div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 max-w-3xl">
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-slate-900"}`}>Notifications</h3>
          {notifications.length === 0 ? (
            <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>No new notifications.</div>
          ) : (
            notifications.map(n=>(
              <div key={n.id} className={`flex items-center justify-between rounded-2xl p-4 mb-3 ${darkMode ? "border border-white/10 bg-white/5" : "border border-slate-200 bg-white"}`}>
                <div>
                  <div className={`${darkMode ? "text-slate-200" : "text-slate-900"} text-sm`}>{n.message}</div>
                  <div className={`${darkMode ? "text-slate-400" : "text-slate-600"} text-xs`}>{n.time}</div>
                </div>
                <Btn size="sm" variant={darkMode ? "outline" : "lightOutline"} onClick={()=>setNotifications(notifications.filter(x=>x.id!==n.id))}>Dismiss</Btn>
              </div>
            ))
          )}
        </div>
      </section>
    );
  };

  /* ---------- Gate helper ---------- */
  function Gate({ text, onSignup, onLogin }) {
    return (
      <section className="max-w-xl mx-auto px-6 pb-16 text-center">
        <Card light={!darkMode}><CardContent>
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>{text}</h3>
          <div className="flex gap-2 justify-center">
            <Btn className={t.grad} onClick={onSignup}><Sparkles size={16}/> Create account</Btn>
            <Btn variant={darkMode ? "outline" : "lightOutline"} onClick={onLogin}><Lock size={16}/> Sign in</Btn>
          </div>
        </CardContent></Card>
      </section>
    );
  }

  /* ---------- Actions Drawer ---------- */
  const ActionsPanel = () => (
    <Dialog open={menuOpen} onClose={()=>setMenuOpen(false)}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><LayoutGrid size={18}/> Quick Actions</DialogTitle>
        <DialogDescription>Jump to what matters</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Btn onClick={()=>{ setMenuOpen(false); setActive(session ? "home" : "landing"); }}>Home</Btn>
        {session ? (
          <>
            <Btn variant="outline" onClick={()=>{ setMenuOpen(false); setActive("otp"); }}>One-time verification</Btn>
            <Btn variant="outline" onClick={()=>{ setMenuOpen(false); setActive("reserve"); }}>Reserve number</Btn>
            <Btn variant="outline" onClick={()=>{ setMenuOpen(false); setActive("profile"); }}>Profile</Btn>
            <Btn variant="outline" onClick={()=>{ setMenuOpen(false); setActive("terms"); }}><Shield size={16}/> Terms</Btn>
            <Btn variant="outline" onClick={()=>{ setMenuOpen(false); setActive("support"); }}><HelpCircle size={16}/> Support</Btn>
            <Btn variant="outline" onClick={async ()=>{ await supabase.auth.signOut(); setMenuOpen(false); setActive("landing"); }}><LogOut size={16}/> Log out</Btn>
          </>
        ) : (
          <>
            <Btn variant="outline" onClick={()=>{ setMenuOpen(false); setActive("signup"); }}><Sparkles size={16}/> Create account</Btn>
            <Btn variant="outline" onClick={()=>{ setMenuOpen(false); setActive("login"); }}><Lock size={16}/> Sign in</Btn>
          </>
        )}
      </div>
      <DialogFooter>
        <Btn variant="ghost" onClick={()=>setMenuOpen(false)}><X size={16}/> Close</Btn>
      </DialogFooter>
    </Dialog>
  );

  // Splash while auth initializes (prevents flicker)
  if (!authReady) {
    return (
      <div className={`${darkMode ? t.bg : "bg-slate-50"} min-h-screen flex items-center justify-center`}>
        <div className={`${darkMode ? "text-white" : "text-slate-900"}`}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? t.bg : "bg-slate-50"} min-h-screen ${darkMode ? "text-white" : "text-slate-900"} relative overflow-hidden`}>
      {darkMode && (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[30rem] w-[60rem] rounded-full blur-3xl opacity-40 bg-gradient-to-br from-blue-600 to-indigo-900" />
        </div>
      )}

      <Nav />

      {active === "landing" && <Landing />}
      {active === "home" && session && <Home />}
      {active === "otp" && <OtpFlow />}
      {active === "reserve" && <Reserve />}
      {active === "profile" && <Profile />}
      {active === "support" && <Support />}
      {active === "terms" && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <Card light={!darkMode}><CardContent>
            <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Terms & Conditions</h2>
            <p className={`${darkMode ? t.sub : lightFix.sub} mt-2 text-sm`}>By using DialPro you agree to the following:</p>
            <ul className={`mt-4 space-y-2 text-sm ${darkMode ? t.sub : lightFix.sub}`}>
              <li>Lawful use only.</li>
              <li>Delivery best-effort; third-party senders may vary.</li>
              <li>Keep your credentials safe.</li>
              <li>Wallet balances non-transferable; refunds case-by-case.</li>
              <li>We process data per our Privacy Policy.</li>
            </ul>
          </CardContent></Card>
        </section>
      )}
      {active === "signup" && <Auth mode="signup" />}
      {active === "login" && <Auth mode="login" />}

      <ActionsPanel />

      <Dialog open={depositOpen} onClose={()=>setDepositOpen(false)}>
        <DialogHeader>
          <DialogTitle>Deposit funds</DialogTitle>
          <DialogDescription>Local NGN or USD supported. We credit your wallet in USD.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <select
              value={depositCurrency}
              onChange={(e)=>setDepositCurrency(e.target.value)}
              className={`w-full rounded-md px-3 py-2 text-sm outline-none ${darkMode ? "border border-white/15 bg-white/5 text-white" : "border border-slate-300 bg-white text-slate-900"}`}
            >
              <option value="NGN">NGN (₦) — Local Pay</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <Input
            light={!darkMode}
            type="number"
            placeholder={depositCurrency==="NGN" ? "Amount in NGN" : "Amount in USD"}
            value={depositAmount}
            onChange={(e)=>setDepositAmount(e.target.value)}
            className="md:col-span-2"
          />
          <Btn className="w-full md:w-auto" onClick={handleDeposit}>Deposit</Btn>
        </div>
        <div className={`text-xs mt-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
          Credits in USD: <span className="font-medium">${depositUSD.toFixed(2)}</span>{depositCurrency==="NGN" && <span> (rate ₦{(1600).toLocaleString()} ≈ $1)</span>}
        </div>
        <DialogFooter>
          <Btn variant="ghost" onClick={()=>setDepositOpen(false)}>Close</Btn>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
