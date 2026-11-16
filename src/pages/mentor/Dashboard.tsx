import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, CalendarClock, Coins, Inbox, Star, Users } from 'lucide-react';
import { Card, Empty, Page, PageHero, Skeleton, StatCard, StatusPill, btnAccent } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../lib/auth';
import { fmtDateTime, money, ago } from '../../lib/format';
import { useT } from '../../lib/i18n';

export default function MentorDashboard() {
  const t = useT();
  const user = useAuth((s) => s.user)!;
  const q = useAsync(async () => {
    const [reqs, ms, subs, sessions, orders, profile] = await Promise.all([api.incomingRequests(), api.mentorshipsAs('mentor'), api.submittedTasks(), api.listSessions({ role: 'mentor' }), api.listOrders('mentor'), api.myMentorProfile()]);
    return { reqs, ms, subs, sessions, orders, profile };
  });
  if (!q.data) return <Page><Skeleton className="h-56 mb-8" /><div className="grid md:grid-cols-4 gap-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div></Page>;
  const { reqs, ms, subs, sessions, orders, profile } = q.data;
  const pending = reqs.filter((r) => ['submitted', 'under_review'].includes(r.status));
  const active = ms.filter((m) => m.status === 'active');
  const upcoming = sessions.filter((s) => new Date(s.starts_at) > new Date() && s.status !== 'cancelled');
  const month = new Date().toISOString().slice(0, 7);
  const earned = orders.filter((o) => o.status === 'paid' && o.created_at.startsWith(month)).reduce((a, o) => a + (o.amount - o.commission_amount), 0);
  return (
    <Page>
      <PageHero badge={t('Mentor workspace', 'مساحة المرشد')} title={<>{t('Hello, ', 'مرحبًا، ')}{user.name.split(' ')[0]} <span className="inline-block animate-wave">👋</span></>} subtitle={pending.length ? t(`You have ${pending.length} new application(s) and ${subs.length} submission(s) to review.`, `لديك ${pending.length} طلب جديد و${subs.length} تسليم بانتظار المراجعة.`) : t('You’re all caught up. Great job!', 'أنجزت كل شيء. عمل رائع!')} illus="dashboard">
        {profile && profile.status !== 'approved' ? <Link to="/app/mentor/profile" className={btnAccent}>{t('Complete your profile', 'أكمل ملفك')}<ArrowRight size={16} className="rtl:rotate-180" /></Link>
          : pending.length > 0 && <Link to="/app/mentor/applications" className={btnAccent}><Inbox size={16} />{t('Review applications', 'مراجعة الطلبات')}</Link>}
      </PageHero>
      {profile && profile.status !== 'approved' && <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm font-semibold flex items-center gap-2"><StatusPill status={profile.status} />{t('Your public profile is not published yet. Submit it for review from “Profile & plans”.', 'ملفك العام غير منشور بعد. أرسله للمراجعة من «الملف والباقات».')}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={22} />} label={t('Active mentees', 'متدربون نشطون')} value={active.length} hint={profile ? t(`${profile.spots_left} spots open`, `${profile.spots_left} مقاعد متاحة`) : undefined} />
        <StatCard icon={<Inbox size={22} />} label={t('New applications', 'طلبات جديدة')} value={pending.length} tone="orange" />
        <StatCard icon={<BookOpenCheck size={22} />} label={t('To review', 'للمراجعة')} value={subs.length} tone="purple" />
        <StatCard icon={<Coins size={22} />} label={t('Net this month', 'صافي هذا الشهر')} value={money(earned)} tone="green" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Card title={t('New applications', 'طلبات جديدة')} action={<Link to="/app/mentor/applications" className="text-sm font-bold text-indigo-600">{t('All', 'الكل')}</Link>}>
          {!pending.length ? <p className="text-sm text-slate-400">{t('No pending applications.', 'لا توجد طلبات معلقة.')}</p> : pending.slice(0, 4).map((r) => (
            <Link to="/app/mentor/applications" key={r.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 group"><Avatar name={r.mentee?.full_name ?? '?'} className="w-10 h-10 text-xs" /><div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">{r.mentee?.full_name}</p><p className="text-xs text-slate-400 truncate">{r.goal}</p></div><span className="text-[10px] text-slate-400">{ago(r.created_at)}</span></Link>
          ))}
        </Card>
        <Card title={t('Waiting for your review', 'بانتظار مراجعتك')} action={<Link to="/app/mentor/reviews" className="text-sm font-bold text-indigo-600">{t('All', 'الكل')}</Link>}>
          {!subs.length ? <p className="text-sm text-slate-400">{t('Nothing to review.', 'لا يوجد ما يُراجع.')}</p> : subs.slice(0, 4).map((s) => (
            <Link to={`/app/mentor/mentees/${s.mentorship_id}`} key={s.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 group"><span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 grid place-items-center"><BookOpenCheck size={18} /></span><div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-700">{s.title}</p><p className="text-xs text-slate-400">{s.mentee_name}</p></div></Link>
          ))}
        </Card>
        <Card title={t('Upcoming sessions', 'الجلسات القادمة')}>
          {!upcoming.length ? <p className="text-sm text-slate-400">{t('No sessions scheduled.', 'لا توجد جلسات.')}</p> : upcoming.slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"><span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 grid place-items-center"><CalendarClock size={18} /></span><div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{s.title}</p><p className="text-xs text-slate-400">{s.mentee?.full_name} · {fmtDateTime(s.starts_at)}</p></div></div>
          ))}
        </Card>
      </div>
      <div className="mt-6">
        <Card title={t('My mentees', 'متدربيّ')} action={<Link to="/app/mentor/mentees" className="text-sm font-bold text-indigo-600">{t('All', 'الكل')}</Link>}>
          {!ms.length ? <Empty icon={<Users size={24} />} title={t('No mentees yet', 'لا يوجد متدربون بعد')} /> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{ms.slice(0, 4).map((m) => (
            <Link key={m.id} to={`/app/mentor/mentees/${m.id}`} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex items-center gap-3"><Avatar name={m.mentee?.full_name ?? '?'} className="w-11 h-11 text-xs" /><div className="min-w-0"><p className="font-bold text-sm text-slate-800 truncate">{m.mentee?.full_name}</p><StatusPill status={m.status} /></div></Link>
          ))}</div>}
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1"><Star size={12} className="text-orange-400" />{profile ? `${profile.rating_avg.toFixed(1)} · ${profile.reviews_count} ${t('reviews', 'تقييم')}` : ''}</p>
        </Card>
      </div>
    </Page>
  );
}
