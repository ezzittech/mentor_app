import { Link } from 'react-router-dom';
import { Coins, FolderKanban, ScrollText, UserCheck, UserRoundCheck, Users } from 'lucide-react';
import { Card, Page, PageHero, Skeleton, StatCard, StatusPill } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { ago, money } from '../../lib/format';
import { useLang, useT } from '../../lib/i18n';
import { ROLE_LABEL } from '../../lib/nav';
import type { Role } from '../../lib/types';

export default function AdminDashboard() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const q = useAsync(async () => {
    const [users, mentors, ms, orders, audit] = await Promise.all([api.listUsers(), api.mentorApplications(), api.mentorshipsAs('admin'), api.listOrders('all'), api.listAudit()]);
    return { users, mentors, ms, orders, audit };
  });
  if (!q.data) return <Page><Skeleton className="h-56 mb-8" /><Skeleton className="h-96" /></Page>;
  const { users, mentors, ms, orders, audit } = q.data;
  const paid = orders.filter((o) => o.status === 'paid');
  const gmv = paid.reduce((a, o) => a + Number(o.amount), 0);
  const fees = paid.reduce((a, o) => a + Number(o.commission_amount), 0);
  const pending = mentors.filter((m) => m.status === 'pending');
  const roles: Role[] = ['mentee', 'mentor', 'supervisor', 'admin'];
  const funnel = [
    [t('Users', 'المستخدمون'), users.length],
    [t('Mentorships', 'علاقات الإرشاد'), ms.length],
    [t('Active', 'نشطة'), ms.filter((m) => m.status === 'active').length],
    [t('Completed', 'مكتملة'), ms.filter((m) => m.status === 'completed').length],
  ] as const;
  return (
    <Page>
      <PageHero badge={t('Administration', 'الإدارة')} badgeColor="indigo" title={t('Platform overview', 'نظرة عامة على المنصة')} subtitle={t('Manage users, mentors, programs, payments and settings — all from this one app.', 'أدر المستخدمين والمرشدين والبرامج والمدفوعات والإعدادات — من هذا التطبيق نفسه.')} illus="admin" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={22} />} label={t('Users', 'المستخدمون')} value={users.length} />
        <StatCard icon={<FolderKanban size={22} />} label={t('Active mentorships', 'علاقات نشطة')} value={ms.filter((m) => m.status === 'active').length} tone="sky" />
        <StatCard icon={<Coins size={22} />} label={t('GMV', 'إجمالي المدفوعات')} value={money(gmv)} tone="green" hint={t(`commission ${money(fees)}`, `عمولة ${money(fees)}`)} />
        <StatCard icon={<UserCheck size={22} />} label={t('Mentors pending', 'مرشدون بانتظار الاعتماد')} value={pending.length} tone="orange" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Card title={t('Funnel', 'المسار')}>
          <div className="space-y-3">{funnel.map(([l, v], i) => (
            <div key={l}><div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-600">{l}</span><b>{v}</b></div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-orange-400" style={{ width: `${Math.max(4, (v / Math.max(funnel[0][1], 1)) * 100)}%`, opacity: 1 - i * 0.15 }} /></div></div>
          ))}</div>
          <div className="grid grid-cols-2 gap-2 mt-6">{roles.map((r) => <div key={r} className="p-3 rounded-2xl bg-slate-50 text-center"><p className="text-xl font-black">{users.filter((u) => u.roles.includes(r)).length}</p><p className="text-[11px] text-slate-400 font-bold">{ROLE_LABEL[r][lang]}</p></div>)}</div>
        </Card>
        <Card title={t('Mentor approvals', 'اعتماد المرشدين')} action={<Link to="/app/admin/mentors" className="text-sm font-bold text-indigo-600">{t('All', 'الكل')}</Link>}>
          {!pending.length ? <p className="text-sm text-slate-400">{t('No pending applications.', 'لا توجد طلبات معلقة.')}</p> : pending.map((m) => (
            <Link key={m.id} to="/app/admin/mentors" className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"><Avatar name={m.full_name} className="w-10 h-10 text-xs" /><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{m.full_name}</p><p className="text-xs text-slate-400 truncate">{m.headline}</p></div><UserRoundCheck size={16} className="text-orange-500" /></Link>
          ))}
        </Card>
        <Card title={t('Recent activity', 'آخر النشاطات')} action={<Link to="/app/admin/audit" className="text-sm font-bold text-indigo-600"><ScrollText size={16} /></Link>}>
          {audit.slice(0, 6).map((a) => <div key={a.id} className="py-2.5 border-b border-slate-50 last:border-0"><p className="text-sm"><b>{a.actor?.full_name ?? 'system'}</b> <span className="font-mono text-xs text-indigo-600">{a.action}</span></p><p className="text-[11px] text-slate-400">{a.entity} #{a.entity_id} · {ago(a.created_at)}</p></div>)}
        </Card>
      </div>
      <Card title={t('Latest mentorships', 'أحدث علاقات الإرشاد')} className="mt-6" action={<Link to="/app/admin/mentorships" className="text-sm font-bold text-indigo-600">{t('All', 'الكل')}</Link>}>
        <div className="grid md:grid-cols-2 gap-3">{ms.slice(0, 4).map((m) => <Link key={m.id} to={`/app/admin/mentorships/${m.id}`} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-indigo-200"><Avatar name={m.mentee?.full_name ?? '?'} className="w-10 h-10 text-xs" /><div className="flex-1 min-w-0 text-sm"><b>{m.mentee?.full_name}</b> <span className="text-slate-400">↔ {m.mentor?.full_name}</span></div><StatusPill status={m.status} /></Link>)}</div>
      </Card>
    </Page>
  );
}
