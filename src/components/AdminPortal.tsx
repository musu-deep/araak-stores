import { useEffect, useState } from "react";
import { Shield, Users, Lock, LayoutDashboard, RefreshCw, Check, X, Ban } from "lucide-react";
import { supabase } from "../lib/supabase";

type UserProfile = {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  department: string | null;
  job_title: string | null;
};

type Permission = {
  key: string;
  label_ar: string;
  category: string | null;
};

type ComponentItem = {
  key: string;
  page_key: string;
  label_ar: string;
  default_visible: boolean;
  sensitive: boolean;
};

export default function AdminPortal() {
  const [tab, setTab] = useState<"users" | "permissions" | "layout">("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAdminData() {
    setLoading(true);

    const [usersRes, permsRes, compsRes] = await Promise.all([
      supabase.from("user_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("permissions").select("*").order("category", { ascending: true }),
      supabase.from("page_components").select("*").order("page_key", { ascending: true }),
    ]);

    setUsers(usersRes.data || []);
    setPermissions(permsRes.data || []);
    setComponents(compsRes.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function updateUser(id: string, patch: Partial<UserProfile>) {
    const { error } = await supabase.from("user_profiles").update(patch).eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadAdminData();
  }

  async function approveUser(user: UserProfile) {
    await updateUser(user.id, { status: "active", role: user.role === "pending" ? "viewer" : user.role });
  }

  async function blockUser(user: UserProfile) {
    await updateUser(user.id, { status: "blocked" });
  }

  async function makeRole(user: UserProfile, role: string) {
    await updateUser(user.id, { role });
  }

  async function toggleComponent(component: ComponentItem) {
    const { error } = await supabase
      .from("page_components")
      .update({ default_visible: !component.default_visible })
      .eq("key", component.key);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAdminData();
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-3 py-3">
      <div className="holo-card flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-4 border-b border-cyan-500/15 pb-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-500/15 border border-cyan-400/40">
            <Shield size={28} className="text-cyan-400" />
          </div>

          <div>
            <h1 className="text-white text-2xl font-black">إدارة النظام</h1>
            <p className="text-white/40 text-sm">Admin Portal Governance</p>
          </div>

          <button onClick={loadAdminData} className="neon-btn mr-auto px-4 py-2 text-xs flex items-center gap-2">
            <RefreshCw size={14} />
            تحديث
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <button onClick={() => setTab("users")} className={`rounded-xl border p-4 text-right ${tab === "users" ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}>
            <Users className="text-cyan-400 mb-2" size={20} />
            <p className="text-white font-bold">المستخدمون</p>
            <p className="text-white/35 text-xs">اعتماد، حظر، وتغيير الأدوار</p>
          </button>

          <button onClick={() => setTab("permissions")} className={`rounded-xl border p-4 text-right ${tab === "permissions" ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}>
            <Lock className="text-cyan-400 mb-2" size={20} />
            <p className="text-white font-bold">الصلاحيات</p>
            <p className="text-white/35 text-xs">كتالوج صلاحيات البورتال</p>
          </button>

          <button onClick={() => setTab("layout")} className={`rounded-xl border p-4 text-right ${tab === "layout" ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}>
            <LayoutDashboard className="text-cyan-400 mb-2" size={20} />
            <p className="text-white font-bold">مكونات الصفحات</p>
            <p className="text-white/35 text-xs">إظهار وحجب أجزاء البورتال</p>
          </button>
        </div>

        {loading ? (
          <p className="text-cyan-400 text-sm">جارٍ تحميل بيانات الإدارة...</p>
        ) : tab === "users" ? (
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="rounded-xl border border-white/10 p-5 text-white/40 text-sm">
                لا يوجد مستخدمون في user_profiles حالياً. بعد تفعيل التسجيل سيتم ظهورهم هنا للاعتماد.
              </div>
            ) : users.map((user) => (
              <div key={user.id} className="rounded-xl border border-white/10 bg-black/20 p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-white font-bold">{user.full_name || user.email || "مستخدم غير مكتمل"}</p>
                  <p className="text-white/35 text-xs">{user.email}</p>
                </div>

                <select
                  value={user.role}
                  onChange={(e) => makeRole(user, e.target.value)}
                  className="bg-black/40 border border-cyan-500/20 rounded-lg text-white text-xs px-2 py-2"
                >
                  <option value="pending">pending</option>
                  <option value="admin">admin</option>
                  <option value="ceo">ceo</option>
                  <option value="manager">manager</option>
                  <option value="analyst">analyst</option>
                  <option value="viewer">viewer</option>
                </select>

                <span className={`text-xs px-3 py-1 rounded-full ${user.status === "active" ? "bg-green-500/15 text-green-400" : user.status === "blocked" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                  {user.status}
                </span>

                <button onClick={() => approveUser(user)} className="neon-btn text-xs px-3 py-2 flex items-center gap-1">
                  <Check size={13} />
                  اعتماد
                </button>

                <button onClick={() => blockUser(user)} className="neon-btn text-xs px-3 py-2 flex items-center gap-1 text-red-400 border-red-400/40">
                  <Ban size={13} />
                  حظر
                </button>
              </div>
            ))}
          </div>
        ) : tab === "permissions" ? (
          <div className="grid grid-cols-3 gap-3">
            {permissions.map((p) => (
              <div key={p.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-cyan-400 text-xs font-bold">{p.category || "general"}</p>
                <p className="text-white text-sm font-bold mt-1">{p.label_ar}</p>
                <p className="text-white/30 text-[10px] mt-1">{p.key}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {components.map((c) => (
              <div key={c.key} className="rounded-xl border border-white/10 bg-black/20 p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-white font-bold">{c.label_ar}</p>
                  <p className="text-white/30 text-xs">{c.page_key} / {c.key}</p>
                </div>

                {c.sensitive && (
                  <span className="text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full text-xs">حساس</span>
                )}

                <button
                  onClick={() => toggleComponent(c)}
                  className={`neon-btn text-xs px-3 py-2 flex items-center gap-1 ${c.default_visible ? "" : "text-red-400 border-red-400/40"}`}
                >
                  {c.default_visible ? <Check size={13} /> : <X size={13} />}
                  {c.default_visible ? "ظاهر" : "مخفي"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
