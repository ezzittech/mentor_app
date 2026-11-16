import { useState } from 'react';
import { Ban, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Confirm, Page, PageHero, SearchInput, Spinner, Tabs, act } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../lib/auth';
import { fmtDate } from '../../lib/format';
import { useLang, useT } from '../../lib/i18n';
import { ROLE_LABEL } from '../../lib/nav';
import type { Role, UserRow } from '../../lib/types';

const ROLES: Role[] = ['mentee', 'mentor', 'supervisor', 'program_manager', 'support', 'admin'];

export default function AdminUsers() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const me = useAuth((s) => s.user)!;
  const isAdmin = me.roles.includes('admin');
  const q = useAsync(api.listUsers);
  const [s, setS] = useState('');
  const [f, setF] = useState<'all' | Role>('all');
  const [confirm, setConfirm] = useState<{ u: UserRow; r: Role; grant: boolean } | null>(null);
  const list = (q.data ?? []).filter((u) => (f === 'all' || u.roles.includes(f)) && (!s || `${u.full_name} ${u.email}`.toLowerCase().includes(s.toLowerCase())));
  return (
    <Page wide>
      <PageHero badge={t('Users', 'المستخدمون')} badgeColor="indigo" title={t('Users & roles', 'المستخدمون والأدوار')} subtitle={t('Roles are stored in the database and enforced by row-level security. Users can never grant themselves a role.', 'تُخزَّن الأدوار في قاعدة البيانات وتُفرض عبر RLS، ولا يمكن للمستخدم منح نفسه أي دور.')} illus="shield" />
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6"><Tabs value={f} onChange={setF} tabs={[{ id: 'all', label: t('All', 'الكل'), count: q.data?.length }, ...ROLES.slice(0, 4).map((r) => ({ id: r, label: ROLE_LABEL[r][lang], count: (q.data ?? []).filter((u) => u.roles.includes(r)).length }))]} /><SearchInput value={s} onChange={setS} placeholder={t('Search by name or email', 'ابحث بالاسم أو البريد')} /></div>
      {q.loading ? <Spinner /> : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead><tr className="text-[11px] uppercase text-slate-400 border-b border-slate-100"><th className="text-start px-5 py-4">{t('User', 'المستخدم')}</th><th className="text-start px-5 py-4">{t('Roles', 'الأدوار')}</th><th className="text-start px-5 py-4">{t('Joined', 'الانضمام')}</th><th className="text-start px-5 py-4">{t('Status', 'الحالة')}</th></tr></thead>
            <tbody>{list.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={u.full_name} className="w-10 h-10 text-xs" /><div><p className="font-bold text-slate-800">{u.full_name}</p><p className="text-xs text-slate-400" dir="ltr">{u.email}</p></div></div></td>
                <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{ROLES.map((r) => { const on = u.roles.includes(r); return (
                  <button key={r} disabled={!isAdmin || (u.id === me.id && r === 'admin')} onClick={() => setConfirm({ u, r, grant: !on })} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all disabled:cursor-not-allowed ${on ? r === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-white text-slate-300 border-slate-100 hover:text-slate-500'}`}>{ROLE_LABEL[r][lang]}</button>
                ); })}</div></td>
                <td className="px-5 py-4 text-slate-500">{fmtDate(u.created_at)}</td>
                <td className="px-5 py-4">{isAdmin && u.id !== me.id ? <button onClick={() => act(() => api.setUserActive(u.id, !u.is_active), t('Updated', 'تم التحديث')).then(q.reload)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{u.is_active ? <><CheckCircle2 size={13} />{t('Active', 'نشط')}</> : <><Ban size={13} />{t('Suspended', 'موقوف')}</>}</button> : <span className="text-xs text-slate-400">—</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} danger={confirm?.r === 'admin'} title={confirm ? (confirm.grant ? t(`Grant “${ROLE_LABEL[confirm.r].en}” to ${confirm.u.full_name}?`, `منح دور «${ROLE_LABEL[confirm.r].ar}» إلى ${confirm.u.full_name}؟`) : t(`Remove “${ROLE_LABEL[confirm.r].en}” from ${confirm.u.full_name}?`, `إزالة دور «${ROLE_LABEL[confirm.r].ar}» من ${confirm.u.full_name}؟`)) : ''}
        text={t('This action is recorded in the audit log.', 'يُسجَّل هذا الإجراء في سجل التدقيق.')} onConfirm={async () => { await act(() => api.setRole(confirm!.u.id, confirm!.r, confirm!.grant), t('Role updated', 'تم تحديث الدور')); q.reload(); }} />
      <p className="text-xs text-slate-400 mt-4 flex items-center gap-1"><ShieldCheck size={12} />{t('The first admin is created once with SQL (see docs/SUPABASE_SETUP.md).', 'يُنشأ أول مسؤول مرة واحدة عبر SQL (راجع docs/SUPABASE_SETUP.md).')}</p>
    </Page>
  );
}
