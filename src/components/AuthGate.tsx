import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
};

type AuthContextValue = {
  profile: Profile | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (key: string) => boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthGate");
  return ctx;
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          await supabase.from("user_profiles").insert({
            user_id: data.user.id,
            email,
            full_name: fullName,
            department,
            job_title: jobTitle,
            role: "pending",
            status: "pending",
          });
        }

        alert("تم إرسال طلب التسجيل. بانتظار اعتماد الآدمن.");
      }
    } catch (e: any) {
      alert(e.message || "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center grid-lines" style={{ background: "var(--navy)" }}>
      <div className="holo-card w-[420px] p-6">
        <h1 className="text-white text-2xl font-black mb-1">ARAAK STORES</h1>
        <p className="text-cyan-400 text-xs mb-6">AI Command Center Access</p>

        {mode === "register" && (
          <>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" className="w-full mb-3 bg-black/30 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="القسم" className="w-full mb-3 bg-black/30 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="المسمى الوظيفي" className="w-full mb-3 bg-black/30 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm" />
          </>
        )}

        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full mb-3 bg-black/30 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="كلمة المرور" className="w-full mb-4 bg-black/30 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm" />

        <button disabled={busy} onClick={submit} className="neon-btn w-full py-2 text-sm">
          {busy ? "جارٍ التنفيذ..." : mode === "login" ? "دخول" : "تسجيل طلب مستخدم"}
        </button>

        <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="w-full mt-4 text-cyan-400 text-xs">
          {mode === "login" ? "إنشاء حساب جديد" : "لدي حساب بالفعل"}
        </button>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  async function load() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setProfile(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    let { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profileData) {
      const { data: inserted } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          role: "pending",
          status: "pending",
        })
        .select("*")
        .single();

      profileData = inserted;
    }

    setProfile(profileData);

    if (profileData?.role) {
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permission_key, allowed")
        .eq("role", profileData.role);

      const { data: overrides } = await supabase
        .from("user_permission_overrides")
        .select("permission_key, effect")
        .eq("user_id", user.id);

      const set = new Set<string>();

      (rolePerms || []).forEach((p: any) => {
        if (p.allowed) set.add(p.permission_key);
      });

      (overrides || []).forEach((o: any) => {
        if (o.effect === "allow") set.add(o.permission_key);
        if (o.effect === "deny") set.delete(o.permission_key);
      });

      setPermissions([...set]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    const { data } = supabase.auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    profile,
    permissions,
    loading,
    hasPermission: (key: string) => permissions.includes(key) || profile?.role === "admin",
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setPermissions([]);
    },
  }), [profile, permissions, loading]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-cyan-400" style={{ background: "var(--navy)" }}>جارٍ التحقق من المستخدم...</div>;
  }

  if (!profile) return <AuthScreen />;

  if (profile.status === "blocked") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
        <div className="holo-card p-6 text-center">
          <p className="text-red-400 font-bold mb-2">تم تقييد الوصول</p>
          <p className="text-white/50 text-sm mb-4">يرجى التواصل مع مسؤول النظام.</p>
          <button onClick={() => supabase.auth.signOut()} className="neon-btn px-4 py-2 text-xs">تسجيل خروج</button>
        </div>
      </div>
    );
  }

  if (profile.status !== "active") {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
        <div className="holo-card p-6 text-center">
          <p className="text-yellow-400 font-bold mb-2">بانتظار اعتماد الآدمن</p>
          <p className="text-white/50 text-sm mb-4">تم إنشاء حسابك، وسيتم تفعيل الوصول بعد الاعتماد.</p>
          <button onClick={() => supabase.auth.signOut()} className="neon-btn px-4 py-2 text-xs">تسجيل خروج</button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
