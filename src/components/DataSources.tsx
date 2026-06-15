import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Link2, CheckCircle, XCircle, RefreshCw, Upload, Copy, ExternalLink,
  AlertCircle, Clock, Package, ShoppingBag, ChevronDown, Play, Zap,
  FileText, Trash2, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/zid-webhook`;
const SYNC_URL = `${SUPABASE_URL}/functions/v1/zid-sync`;
const CSV_URL = `${SUPABASE_URL}/functions/v1/csv-import`;

interface SyncLog {
  id: string;
  source: string;
  sync_type: string;
  status: string;
  records_fetched: number;
  records_inserted: number;
  records_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface UploadLog {
  id: string;
  filename: string;
  file_type: string;
  rows_total: number;
  rows_imported: number;
  rows_failed: number;
  data_type: string;
  status: string;
  uploaded_at: string;
}

interface ZidConnection {
  id: string;
  store_id: string;
  store_name: string | null;
  last_sync_at: string | null;
  last_sync_status: string;
  total_synced_orders: number;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="neon-btn py-1 px-2 text-[10px] flex items-center gap-1">
      {copied ? <CheckCircle size={10} className="text-green-400" /> : <Copy size={10} />}
      {copied ? 'تم النسخ' : 'نسخ'}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    success: { label: 'ناجح', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    error: { label: 'خطأ', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    running: { label: 'جارٍ...', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 blink' },
    pending: { label: 'انتظار', cls: 'bg-white/10 text-white/50 border-white/20' },
    processing: { label: 'معالجة', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30 blink' },
    failed: { label: 'فشل', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="holo-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cyan-500/15">
        <div className="w-1 h-1 rounded-full bg-cyan-400 blink" />
        <span className="text-cyan-400 text-[11px] font-bold tracking-wider flex items-center gap-2">
          {icon}{title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DataSources() {
  const [storeId, setStoreId] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [syncPages, setSyncPages] = useState('2');
  const [syncType, setSyncType] = useState<'orders' | 'products' | 'all'>('orders');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadDataType, setUploadDataType] = useState<'orders' | 'products'>('orders');
  const [dragOver, setDragOver] = useState(false);
  const [connection, setConnection] = useState<ZidConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchState = useCallback(async () => {
    const [connRes, syncRes, uploadRes] = await Promise.all([
      supabase.from('zid_connection').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('sync_logs').select('*').order('started_at', { ascending: false }).limit(8),
      supabase.from('data_uploads').select('*').order('uploaded_at', { ascending: false }).limit(5),
    ]);
    if (connRes.data) {
      setConnection(connRes.data);
      setStoreId(connRes.data.store_id);
    }
    if (syncRes.data) setSyncLogs(syncRes.data);
    if (uploadRes.data) setUploadLogs(uploadRes.data);
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId || !token) return;
    setConnecting(true);
    try {
      const { error } = await supabase.from('zid_connection').upsert({
        store_id: storeId,
        manager_token: token,
        store_name: `متجر ${storeId}`,
        last_sync_status: 'pending',
        active: true,
      }, { onConflict: 'store_id' });
      if (error) throw error;
      showMsg('success', 'تم حفظ بيانات الاتصال. يمكنك الآن مزامنة البيانات.');
      await fetchState();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ في الاتصال');
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync() {
    if (!connection) return showMsg('error', 'ربط متجر زد أولاً');
    setSyncing(true);
    try {
      const connRes = await supabase
        .from('zid_connection')
        .select('manager_token')
        .eq('store_id', connection.store_id)
        .single();
      const resp = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: connection.store_id,
          manager_token: connRes.data?.manager_token || token,
          sync_type: syncType,
          pages: parseInt(syncPages),
        }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'خطأ في المزامنة');
      showMsg('success', `تمت المزامنة: ${result.inserted} سجل مُضاف، ${result.fetched} سجل مُحضَّر`);
      await fetchState();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ في المزامنة');
    } finally {
      setSyncing(false);
    }
  }

  async function handleFileUpload(file: File) {
    if (!file) return;
    setUploadLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('data_type', uploadDataType);
      const resp = await fetch(CSV_URL, { method: 'POST', body: form });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'خطأ في الرفع');
      showMsg('success', `تم استيراد ${result.imported} سجل من ${result.total} (${result.failed} فشل)`);
      await fetchState();
    } catch (err) {
      showMsg('error', err instanceof Error ? err.message : 'خطأ في رفع الملف');
    } finally {
      setUploadLoading(false);
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDuration = (start: string, end: string | null) => {
    if (!end) return '...';
    const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    return s < 60 ? `${s}ث` : `${Math.floor(s / 60)}د`;
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-2">
        <Link2 size={18} className="text-cyan-400" />
        <div>
          <h1 className="text-white text-lg font-black">مصادر البيانات والتكامل</h1>
          <p className="text-white/40 text-xs">ربط متجر زد، رفع Excel/CSV، مراقبة المزامنة</p>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ── Zid Connection ── */}
        <Section title="ربط متجر زد" icon={<Link2 size={13} />}>
          {/* Connection status */}
          {connection && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
              <CheckCircle size={16} className="text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-green-400 text-xs font-bold">متصل بنجاح</p>
                <p className="text-white/50 text-[10px]">
                  متجر: {connection.store_id} · آخر مزامنة: {fmtDate(connection.last_sync_at)}
                </p>
              </div>
              <StatusBadge status={connection.last_sync_status} />
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="text-white/60 text-[10px] block mb-1">معرّف المتجر (Store ID)</label>
              <input
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                placeholder="12345678"
                className="w-full bg-white/5 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 placeholder-white/20 font-mono"
              />
            </div>
            <div>
              <label className="text-white/60 text-[10px] block mb-1">Manager Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="eyJ0eXAiOiJKV1Qi..."
                  className="w-full bg-white/5 border border-cyan-500/20 rounded-lg px-3 py-2 pl-9 text-white text-sm outline-none focus:border-cyan-500/50 placeholder-white/20 font-mono"
                />
                <button type="button" onClick={() => setShowToken(!showToken)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-white/30 text-[9px] mt-1">
                من لوحة زد ← الإعدادات ← API ← Manager Token
              </p>
            </div>
            <button
              type="submit"
              disabled={connecting || !storeId || !token}
              className="neon-btn w-full py-2 flex items-center justify-center gap-2 text-xs disabled:opacity-40"
            >
              {connecting ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {connection ? 'تحديث بيانات الاتصال' : 'ربط المتجر'}
            </button>
          </form>

          {/* Webhook URL */}
          <div className="mt-4 p-3 rounded-lg bg-black/30 border border-cyan-500/15">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/60 text-[10px] font-bold">رابط الـ Webhook (زد ← إعدادات ← Webhooks)</p>
              <a href="https://web.zid.sa" target="_blank" rel="noopener noreferrer">
                <ExternalLink size={11} className="text-cyan-500/50 hover:text-cyan-400" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-cyan-400 text-[9px] flex-1 truncate font-mono">{WEBHOOK_URL}</code>
              <CopyButton text={WEBHOOK_URL} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {['order.created', 'order.updated', 'order.refunded', 'cart.abandoned'].map(ev => (
                <span key={ev} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10 font-mono">{ev}</span>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Manual Sync ── */}
        <Section title="مزامنة يدوية من API زد" icon={<RefreshCw size={13} />}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/60 text-[10px] block mb-1">نوع البيانات</label>
                <div className="relative">
                  <select
                    value={syncType}
                    onChange={e => setSyncType(e.target.value as typeof syncType)}
                    className="w-full bg-white/5 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none appearance-none cursor-pointer"
                  >
                    <option value="orders" className="bg-slate-900">الطلبات فقط</option>
                    <option value="products" className="bg-slate-900">المنتجات فقط</option>
                    <option value="all" className="bg-slate-900">الكل</option>
                  </select>
                  <ChevronDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-[10px] block mb-1">عدد الصفحات (50 طلب/صفحة)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={syncPages}
                  onChange={e => setSyncPages(e.target.value)}
                  className="w-full bg-white/5 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-[10px] text-white/50">
              سيجلب حتى <span className="text-cyan-400 font-bold">{parseInt(syncPages) * 50}</span> طلب من زد ويُحدّث قاعدة البيانات
            </div>

            <button
              onClick={handleSync}
              disabled={syncing || !connection}
              className="neon-btn w-full py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
            >
              {syncing
                ? <><RefreshCw size={14} className="animate-spin" /> جارٍ المزامنة...</>
                : <><Play size={14} /> بدء المزامنة</>
              }
            </button>
            {!connection && (
              <p className="text-amber-400/70 text-[10px] text-center">ربط المتجر أولاً للمزامنة</p>
            )}
          </div>

          {/* Sync stats */}
          {connection && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: 'طلبات مُزامَنة', value: connection.total_synced_orders, icon: ShoppingBag, color: '#10b981' },
                { label: 'آخر مزامنة', value: fmtDate(connection.last_sync_at), icon: Clock, color: '#00d4ff' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <Icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
                    <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-white/40 text-[9px]">{s.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ── CSV/Excel Upload ── */}
      <Section title="رفع ملفات Excel / CSV" icon={<Upload size={13} />}>
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Upload zone */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-white/60 text-[10px]">نوع البيانات في الملف:</label>
              <div className="flex gap-2">
                {(['orders', 'products'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setUploadDataType(t)}
                    className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
                      uploadDataType === t
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-white/5 border-white/15 text-white/50'
                    }`}
                  >
                    {t === 'orders' ? 'طلبات' : 'منتجات'}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                dragOver
                  ? 'border-cyan-500/60 bg-cyan-500/10'
                  : 'border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5'
              }`}
              style={{ minHeight: 140 }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                {uploadLoading ? (
                  <>
                    <RefreshCw size={28} className="text-cyan-400 animate-spin" />
                    <p className="text-cyan-400 text-sm font-medium">جارٍ المعالجة...</p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className={dragOver ? 'text-cyan-400' : 'text-white/30'} />
                    <p className="text-white/60 text-sm">اسحب الملف هنا أو انقر للاختيار</p>
                    <p className="text-white/30 text-xs">CSV · Excel (.xlsx) · حتى 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }}
              />
            </div>
          </div>

          {/* Column mapping guide */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-white/60 text-[10px] font-bold mb-2 flex items-center gap-1">
              <FileText size={10} /> أعمدة الملف المقبولة
            </p>
            {uploadDataType === 'orders' ? (
              <div className="space-y-1.5">
                {[
                  ['رقم الطلب', 'order_id / id', true],
                  ['الإجمالي', 'total / amount', true],
                  ['الحالة', 'status', false],
                  ['اسم العميل', 'customer_name', false],
                  ['المصدر', 'channel / source', false],
                  ['تاريخ الطلب', 'created_at / date', false],
                ].map(([ar, en, required]) => (
                  <div key={ar as string} className="flex items-start justify-between gap-1">
                    <span className="text-white/70 text-[9px]">{ar as string}</span>
                    <div className="text-left">
                      <span className="text-cyan-400/70 text-[8px] font-mono">{en as string}</span>
                      {required && <span className="text-red-400 text-[8px] mr-1">*</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {[
                  ['اسم المنتج', 'name / product_name', true],
                  ['رمز المنتج', 'sku / code', false],
                  ['التصنيف', 'category', false],
                  ['المخزون', 'stock / quantity', false],
                  ['مبيعات', 'sold / sold_count', false],
                ].map(([ar, en, required]) => (
                  <div key={ar as string} className="flex items-start justify-between gap-1">
                    <span className="text-white/70 text-[9px]">{ar as string}</span>
                    <div className="text-left">
                      <span className="text-cyan-400/70 text-[8px] font-mono">{en as string}</span>
                      {required && <span className="text-red-400 text-[8px] mr-1">*</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-white/20 text-[8px] mt-2">* حقل مطلوب</p>
          </div>
        </div>
      </Section>

      {/* ── Sync History ── */}
      <Section title="سجل المزامنة والعمليات" icon={<Clock size={13} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-cyan-500/10">
                {['المصدر', 'النوع', 'الحالة', 'مُحضَّر', 'مُضاف', 'المدة', 'الوقت'].map(h => (
                  <th key={h} className="text-right text-white/40 font-medium px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/5">
              {syncLogs.map(log => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                      log.source === 'zid' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    }`}>{log.source.toUpperCase()}</span>
                  </td>
                  <td className="px-3 py-2 text-white/60">{log.sync_type === 'orders' ? 'طلبات' : log.sync_type === 'products' ? 'منتجات' : 'الكل'}</td>
                  <td className="px-3 py-2"><StatusBadge status={log.status} /></td>
                  <td className="px-3 py-2 text-white/80 font-mono">{log.records_fetched}</td>
                  <td className="px-3 py-2 text-green-400 font-mono">{log.records_inserted}</td>
                  <td className="px-3 py-2 text-white/40">{fmtDuration(log.started_at, log.completed_at)}</td>
                  <td className="px-3 py-2 text-white/40">{fmtDate(log.started_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Upload History ── */}
      {uploadLogs.length > 0 && (
        <Section title="سجل الملفات المرفوعة" icon={<Upload size={13} />}>
          <div className="space-y-2">
            {uploadLogs.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <FileText size={16} className="text-white/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{u.filename}</p>
                  <p className="text-white/40 text-[9px]">
                    {u.data_type === 'orders' ? 'طلبات' : 'منتجات'} · {fmtDate(u.uploaded_at)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-green-400 text-xs font-bold">{u.rows_imported}</p>
                  <p className="text-white/30 text-[8px]">مُستورَد</p>
                </div>
                {u.rows_failed > 0 && (
                  <div className="text-center">
                    <p className="text-red-400 text-xs font-bold">{u.rows_failed}</p>
                    <p className="text-white/30 text-[8px]">فشل</p>
                  </div>
                )}
                <StatusBadge status={u.status} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Architecture Diagram ── */}
      <Section title="كيف تتدفق البيانات" icon={<Zap size={13} />}>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            {
              title: 'Webhook (حي)',
              color: '#10b981',
              desc: 'كل طلب جديد يصل للمنصة خلال ثوانٍ تلقائياً',
              steps: ['متجر زد', '← Webhook', '← Edge Function', '← Supabase', '← Dashboard'],
            },
            {
              title: 'API Sync (يدوي)',
              color: '#00d4ff',
              desc: 'استيراد تاريخي وجلب دوري للبيانات',
              steps: ['زر المزامنة', '← Edge Function', '← Zid API', '← Supabase', '← Dashboard'],
            },
            {
              title: 'Excel / CSV (يدوي)',
              color: '#a78bfa',
              desc: 'رفع تقارير تاريخية وبيانات من أي مصدر',
              steps: ['رفع الملف', '← CSV Parser', '← Edge Function', '← Supabase', '← Dashboard'],
            },
          ].map((path, i) => (
            <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: `${path.color}20`, border: `1px solid ${path.color}40` }}>
                <Zap size={14} style={{ color: path.color }} />
              </div>
              <p className="font-bold text-xs mb-1" style={{ color: path.color }}>{path.title}</p>
              <p className="text-white/40 text-[9px] mb-3">{path.desc}</p>
              <div className="space-y-0.5">
                {path.steps.map((step, j) => (
                  <p key={j} className="text-[9px] font-mono" style={{ color: j === 0 ? 'white' : `${path.color}${80 + j * 5}` }}>{step}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
