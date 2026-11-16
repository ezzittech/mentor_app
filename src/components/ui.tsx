import { useEffect, useId, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { AlertTriangle, CircleAlert, CircleCheck, Info, Loader2, RefreshCw, Star, X } from 'lucide-react';
import { Illus } from './media';
import { useT } from '../lib/i18n';

export const BADGE: Record<string, string> = {
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
  slate: 'bg-slate-50 text-slate-500 border-slate-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  pink: 'bg-pink-50 text-pink-600 border-pink-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

/** White hero card that opens every workspace page (same pattern as the LLC portals). */
export function PageHero({ badge, badgeColor = 'orange', title, subtitle, illus, children }: {
  badge: string; badgeColor?: keyof typeof BADGE; title: ReactNode; subtitle?: ReactNode; illus: string; children?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-8 flex flex-col-reverse lg:flex-row items-center justify-between relative overflow-hidden animate__animated animate__fadeIn animate__faster">
      <div className="absolute -top-24 -end-24 w-72 h-72 rounded-full bg-indigo-50/70 blur-2xl pointer-events-none" />
      <div className="z-10 w-full lg:w-3/5 mt-6 lg:mt-0">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border ${BADGE[badgeColor]}`}>{badge}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm sm:text-base mb-6 leading-relaxed max-w-xl">{subtitle}</p>}
        {children}
      </div>
      <div className="w-full lg:w-2/5 flex justify-center lg:justify-end relative">
        <Illus name={illus} className="drop-shadow-xl animate-float max-w-full" />
      </div>
    </div>
  );
}

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <main className={`${wide ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 py-8 pb-20`}>{children}</main>;
}

export function Card({ children, className = '', title, action, pad = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; pad?: boolean }) {
  return (
    <section className={`bg-white rounded-4xl border border-slate-100 shadow-sm ${pad ? 'p-6' : ''} ${className}`}>
      {(title || action) && <div className={`flex items-center justify-between gap-3 ${pad ? 'mb-5' : 'px-6 pt-6 pb-4'}`}><h2 className="font-extrabold text-slate-900 text-lg">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function StatCard({ icon, label, value, hint, tone = 'indigo' }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; tone?: keyof typeof BADGE }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <span className={`w-12 h-12 rounded-2xl grid place-items-center border ${BADGE[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
        {hint && <p className="text-xs text-slate-400 truncate">{hint}</p>}
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className = 'max-w-md' }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type="search" aria-label={placeholder}
        className="block w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all shadow-sm" />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const t = useT();
  return <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm" role="status"><Loader2 className="animate-spin" size={18} /> {label ?? t('Loading…', 'جارٍ التحميل…')}</div>;
}

export function Skeleton({ className = 'h-24' }: { className?: string }) {
  return <div className={`skeleton rounded-3xl ${className}`} />;
}
export function SkeletonGrid({ n = 6, className = 'h-64' }: { n?: number; className?: string }) {
  return <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">{Array.from({ length: n }, (_, i) => <Skeleton key={i} className={className} />)}</div>;
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="bg-white rounded-4xl border border-dashed border-slate-200 py-14 px-6 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-orange-50 grid place-items-center text-indigo-400 mb-4">{icon}</div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      {text && <p className="text-sm text-slate-400 mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <div className="flex items-start gap-3 p-5 rounded-3xl bg-red-50 border border-red-100 text-red-700 text-sm">
      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1"><p className="font-bold">{t('Something went wrong', 'حدث خطأ ما')}</p><p className="text-red-600/80 mt-0.5 break-words">{error}</p></div>
      {onRetry && <button onClick={onRetry} className="flex items-center gap-1 font-bold text-red-700"><RefreshCw size={14} />{t('Retry', 'إعادة المحاولة')}</button>}
    </div>
  );
}

/** Wraps a useAsync result: loading → skeleton, error → retry box, otherwise children(data). */
export function Async<T>({ q, children, skeleton }: { q: { data: T | null; loading: boolean; error: string | null; reload: () => void }; children: (d: T) => ReactNode; skeleton?: ReactNode }) {
  if (q.error) return <ErrorBox error={q.error} onRetry={q.reload} />;
  if (q.loading && q.data === null) return <>{skeleton ?? <Spinner />}</>;
  return <>{q.data !== null && children(q.data)}</>;
}

export function DemoNotice() {
  const t = useT();
  return (
    <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm">
      <Info size={18} className="shrink-0 mt-0.5" />
      <span>{t('Preview mode — sample data only. Changes are not saved after you reload.', 'وضع المعاينة — بيانات تجريبية فقط، ولا تُحفظ التغييرات بعد إعادة التحميل.')} <a href={`${import.meta.env.BASE_URL}login`} className="font-bold underline">{t('Sign in', 'تسجيل الدخول')}</a></span>
    </div>
  );
}

const STATUS: Record<string, [string, string, string]> = {
  // key: [tone classes, en, ar]
  submitted: ['bg-sky-50 text-sky-600 border-sky-100', 'Submitted', 'مُرسل'],
  under_review: ['bg-amber-50 text-amber-600 border-amber-100', 'Under review', 'قيد المراجعة'],
  accepted: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Accepted', 'مقبول'],
  rejected: ['bg-red-50 text-red-600 border-red-100', 'Rejected', 'مرفوض'],
  cancelled: ['bg-slate-100 text-slate-500 border-slate-200', 'Cancelled', 'ملغى'],
  pending_setup: ['bg-amber-50 text-amber-600 border-amber-100', 'Setting up', 'قيد الإعداد'],
  active: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Active', 'نشط'],
  paused: ['bg-slate-100 text-slate-500 border-slate-200', 'Paused', 'متوقف مؤقتًا'],
  completed: ['bg-indigo-50 text-indigo-600 border-indigo-100', 'Completed', 'مكتمل'],
  draft: ['bg-slate-100 text-slate-500 border-slate-200', 'Draft', 'مسودة'],
  pending_approval: ['bg-amber-50 text-amber-600 border-amber-100', 'Awaiting approval', 'بانتظار الموافقة'],
  on_hold: ['bg-slate-100 text-slate-500 border-slate-200', 'On hold', 'معلقة'],
  not_started: ['bg-slate-100 text-slate-500 border-slate-200', 'Not started', 'لم تبدأ'],
  in_progress: ['bg-sky-50 text-sky-600 border-sky-100', 'In progress', 'قيد التنفيذ'],
  changes_requested: ['bg-orange-50 text-orange-600 border-orange-100', 'Needs changes', 'تحتاج تعديل'],
  achieved: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Achieved', 'متحقق'],
  partially_achieved: ['bg-amber-50 text-amber-600 border-amber-100', 'Partially achieved', 'متحقق جزئيًا'],
  not_achieved: ['bg-red-50 text-red-600 border-red-100', 'Not achieved', 'غير متحقق'],
  dropped: ['bg-slate-100 text-slate-500 border-slate-200', 'Dropped', 'مُستبعد'],
  scheduled: ['bg-sky-50 text-sky-600 border-sky-100', 'Scheduled', 'مجدولة'],
  confirmed: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Confirmed', 'مؤكدة'],
  no_show: ['bg-red-50 text-red-600 border-red-100', 'No-show', 'غياب'],
  failed: ['bg-red-50 text-red-600 border-red-100', 'Failed', 'فشل'],
  pending: ['bg-amber-50 text-amber-600 border-amber-100', 'Pending', 'معلق'],
  paid: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Paid', 'مدفوع'],
  refunded: ['bg-slate-100 text-slate-500 border-slate-200', 'Refunded', 'مسترد'],
  approved: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Approved', 'معتمد'],
  suspended: ['bg-red-50 text-red-600 border-red-100', 'Suspended', 'موقوف'],
  needs_info: ['bg-orange-50 text-orange-600 border-orange-100', 'Needs info', 'يحتاج معلومات'],
  reviewed: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Reviewed', 'تمت المراجعة'],
  open: ['bg-amber-50 text-amber-600 border-amber-100', 'Open', 'مفتوح'],
  resolved: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'Resolved', 'محلول'],
  high: ['bg-red-50 text-red-600 border-red-100', 'High', 'عالية'],
  medium: ['bg-amber-50 text-amber-600 border-amber-100', 'Medium', 'متوسطة'],
  low: ['bg-slate-100 text-slate-500 border-slate-200', 'Low', 'منخفضة'],
};
export const statusLabel = (s: string, lang: 'en' | 'ar') => STATUS[s]?.[lang === 'en' ? 1 : 2] ?? s.replace(/_/g, ' ');
export function StatusPill({ status }: { status: string }) {
  const t = useT();
  const s = STATUS[status];
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${s?.[0] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>{s ? t(s[1], s[2]) : status.replace(/_/g, ' ')}</span>;
}

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange?.(i)} className={onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}>
          <Star size={size} className={i <= Math.round(value) ? 'fill-orange-400 text-orange-400' : 'text-slate-200'} />
        </button>
      ))}
    </span>
  );
}

export function Progress({ value, className = '', tone = 'bg-orange-500' }: { value: number; className?: string; tone?: string }) {
  return (
    <div className={`h-2.5 rounded-full bg-slate-100 overflow-hidden ${className}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${tone} transition-all duration-700`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Ring({ value, size = 120, stroke = 12, label, sub }: { value: number; size?: number; stroke?: number; label?: ReactNode; sub?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = useId();
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id={id}><stop offset="0" stopColor="#e9a823" /><stop offset="1" stopColor="#1f66c8" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#f1f5f9" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#${id})`} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-all duration-1000" />
      </svg>
      <div className="absolute text-center"><p className="text-2xl font-black text-slate-900">{label ?? `${Math.round(value)}%`}</p>{sub && <p className="text-[10px] font-bold text-slate-400 uppercase">{sub}</p>}</div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto no-scrollbar max-w-full" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${value === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
          {t.label}{t.count !== undefined && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${value === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate__animated animate__fadeIn animate__faster" onClick={onClose}>
      <div role="dialog" aria-modal="true" className={`bg-white rounded-t-4xl sm:rounded-4xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto custom-scrollbar animate__animated animate__fadeInUp animate__faster`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}

export function Confirm({ open, onClose, onConfirm, title, text, danger }: { open: boolean; onClose: () => void; onConfirm: () => void | Promise<void>; title: string; text?: string; danger?: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {text && <p className="text-slate-500 text-sm mb-6">{text}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button>
        <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); onClose(); }} className={danger ? btnDanger : btnPrimary}>{busy && <Loader2 size={16} className="animate-spin" />}{t('Confirm', 'تأكيد')}</button>
      </div>
    </Modal>
  );
}

export const inputCls = 'block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white transition-all';
export const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
export const btnAccent = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-200 transition-all disabled:opacity-50';
export const btnGhost = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all disabled:opacity-50';
export const btnDanger = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-100 transition-all disabled:opacity-50';
export const btnSm = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50';

// ---- toasts ----
type Toast = { id: number; kind: 'ok' | 'err'; text: string };
const useToasts = create<{ list: Toast[]; push: (t: Omit<Toast, 'id'>) => void }>((set) => ({
  list: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ list: [...s.list, { ...t, id }] }));
    setTimeout(() => set((s) => ({ list: s.list.filter((x) => x.id !== id) })), 4200);
  },
}));
export const toast = {
  ok: (text: string) => useToasts.getState().push({ kind: 'ok', text }),
  err: (e: unknown) => useToasts.getState().push({ kind: 'err', text: e instanceof Error ? e.message : String(e) }),
};
export function Toaster() {
  const list = useToasts((s) => s.list);
  return (
    <div className="fixed bottom-6 end-6 z-[70] space-y-2" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium bg-white animate__animated animate__fadeInUp animate__faster ${t.kind === 'ok' ? 'border-emerald-100 text-emerald-700' : 'border-red-100 text-red-600'}`}>
          {t.kind === 'ok' ? <CircleCheck size={18} /> : <CircleAlert size={18} />} {t.text}
        </div>
      ))}
    </div>
  );
}

/** Runs an async action with a toast on success / error. */
export async function act(fn: () => Promise<unknown>, okText?: string) {
  try { await fn(); if (okText) toast.ok(okText); return true; } catch (e) { toast.err(e); return false; }
}
