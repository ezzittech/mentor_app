import { Link } from 'react-router-dom';
import { Activity, AlarmClock, ArrowRight, CircleCheck, ShieldAlert, UserX, Users } from 'lucide-react';
import { Card, Empty, Page, PageHero, Progress, Skeleton, StatCard, StatusPill } from '../../components/ui';
import { Avatar } from '../../components/media';
import { isOverdue, planProgress } from '../../components/plan';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { ago } from '../../lib/format';
import { useT } from '../../lib/i18n';

/** Transparent risk score: each signal adds points, so supervisors can see *why* a mentee is flagged. */
export function riskOf(x: { overdue: number; idleDays: number; noShows: number; openInts: number; status: string }) {
  let s = 0;
  const why: string[] = [];
  if (x.overdue) { s += Math.min(3, x.overdue); why.push(`overdue:${x.overdue}`); }
  if (x.idleDays >= 14) { s += 3; why.push(`idle:${x.idleDays}`); } else if (x.idleDays >= 7) { s += 1; why.push(`idle:${x.idleDays}`); }
  if (x.noShows) { s += 2 * x.noShows; why.push(`noshow:${x.noShows}`); }
  if (x.openInts) { s += 1; why.push(`ints:${x.openInts}`); }
  if (x.status === 'paused') { s += 2; why.push('paused'); }
  return { score: s, level: s >= 5 ? 'high' : s >= 2 ? 'medium' : 'low', why } as const;
}

export default function SupervisorDashboard() {
  const t = useT();
  const q = useAsync(async () => {
    const ms = (await api.mentorshipsAs('supervisor')).filter((m) => m.status !== 'cancelled');
    const ints = await api.listInterventions();
    return Promise.all(ms.map(async (m) => {
      const [b, s] = await Promise.all([api.planForMentorship(m.id), api.listSessions({ mentorshipId: m.id })]);
      const overdue = b.tasks.filter(isOverdue).length;
      const idleDays = m.last_activity_at ? Math.floor((Date.now() - new Date(m.last_activity_at).getTime()) / 86400000) : 99;
      const noShows = s.filter((x) => x.status === 'no_show').length;
      const openInts = ints.filter((i) => i.mentorship_id === m.id && i.status === 'open').length;
      return { m, progress: planProgress(b.goals, b.tasks), overdue, idleDays, noShows, openInts, hasPlan: !!b.plan, risk: riskOf({ overdue, idleDays, noShows, openInts, status: m.status }) };
    }));
  });
  const WHY = (w: string) => { const [k, v] = w.split(':'); return ({ overdue: t(`${v} overdue tasks`, `${v} مهام متأخرة`), idle: t(`inactive ${v} days`, `غير نشط ${v} يوم`), noshow: t(`${v} missed sessions`, `${v} جلسات فائتة`), ints: t('open intervention', 'تدخل مفتوح'), paused: t('paused', 'متوقف') } as Record<string, string>)[k]; };
  if (!q.data) return <Page><Skeleton className="h-56 mb-8" /><Skeleton className="h-96" /></Page>;
  const rows = [...q.data].sort((a, b) => b.risk.score - a.risk.score);
  const atRisk = rows.filter((r) => r.risk.level !== 'low');
  return (
    <Page>
      <PageHero badge={t('Supervision', 'الإشراف')} badgeColor="amber" title={t('Follow-up dashboard', 'لوحة المتابعة')} subtitle={t('Mentees who need attention appear first. You follow execution and quality — specialist advice stays with the mentor.', 'يظهر المتدربون الذين يحتاجون متابعة أولًا. أنت تتابع التنفيذ والجودة — أما الإرشاد التخصصي فيبقى للمرشد.')} illus="gauge" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={22} />} label={t('Assigned', 'المسندون')} value={rows.length} />
        <StatCard icon={<ShieldAlert size={22} />} label={t('Need attention', 'يحتاجون متابعة')} value={atRisk.length} tone="red" />
        <StatCard icon={<AlarmClock size={22} />} label={t('Overdue tasks', 'مهام متأخرة')} value={rows.reduce((a, r) => a + r.overdue, 0)} tone="orange" />
        <StatCard icon={<UserX size={22} />} label={t('Missed sessions', 'جلسات فائتة')} value={rows.reduce((a, r) => a + r.noShows, 0)} tone="amber" />
      </div>
      <Card title={t('Caseload', 'قائمة المتابعة')} pad={false}>
        {!rows.length ? <div className="p-6"><Empty icon={<Users size={24} />} title={t('No mentees assigned', 'لا يوجد متدربون مسندون')} /></div> : (
          <div className="divide-y divide-slate-50">{rows.map(({ m, progress, risk, hasPlan }) => (
            <Link key={m.id} to={`/app/supervisor/mentees/${m.id}`} className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-5 hover:bg-slate-50/70 group">
              <div className="flex items-center gap-3 md:w-64"><span className={`w-2 self-stretch rounded-full ${risk.level === 'high' ? 'bg-red-500' : risk.level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} /><Avatar name={m.mentee?.full_name ?? '?'} className="w-11 h-11 text-xs" /><div className="min-w-0"><p className="font-bold text-slate-900 group-hover:text-indigo-700">{m.mentee?.full_name}</p><p className="text-xs text-slate-400">{t('with', 'مع')} {m.mentor?.full_name}</p></div></div>
              <div className="flex-1 min-w-0">
                {hasPlan ? <div className="flex items-center gap-3"><Progress value={progress} className="flex-1" /><span className="text-xs font-black w-10">{Math.round(progress)}%</span></div> : <span className="text-xs font-bold text-amber-600">{t('No plan yet', 'لا توجد خطة بعد')}</span>}
                <div className="flex flex-wrap gap-1.5 mt-2">{risk.why.length ? risk.why.map((w) => <span key={w} className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">{WHY(w)}</span>) : <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1"><CircleCheck size={12} />{t('On track', 'على المسار')}</span>}</div>
              </div>
              <div className="flex items-center gap-3"><StatusPill status={m.status} /><span className="text-xs text-slate-400 flex items-center gap-1"><Activity size={12} />{m.last_activity_at ? ago(m.last_activity_at) : '—'}</span><ArrowRight size={16} className="text-slate-300 rtl:rotate-180" /></div>
            </Link>
          ))}</div>
        )}
      </Card>
    </Page>
  );
}
