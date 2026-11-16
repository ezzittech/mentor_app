import { Link } from 'react-router-dom';
import { AlarmClock, ArrowRight, CalendarClock, Check, CheckCircle2, ClipboardList, Flag, Handshake, ListChecks, MessagesSquare, Route, Search, Target, Video } from 'lucide-react';
import { Card, Empty, PageHero, Page, Ring, Skeleton, StatCard, btnAccent } from '../../components/ui';
import { Avatar } from '../../components/media';
import { TaskRow, isOverdue, planProgress } from '../../components/plan';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../lib/auth';
import { daysUntil, fmtDateTime } from '../../lib/format';
import { useT } from '../../lib/i18n';
import { useNavigate } from 'react-router-dom';

export default function MenteeDashboard() {
  const t = useT();
  const nav = useNavigate();
  const user = useAuth((s) => s.user)!;
  const q = useAsync(async () => {
    const [assessment, ms, requests] = await Promise.all([api.myAssessment(), api.currentMentorship(), api.myRequests()]);
    const bundle = ms ? await api.planForMentorship(ms.id) : null;
    const sessions = await api.listSessions({ role: 'mentee' });
    // RLS returns only notes the supervisor shared with the mentee
    const notes = ms ? (await api.listNotes(ms.id)).filter((n) => n.visibility === 'mentee') : [];
    return { assessment, ms, requests, bundle, sessions, notes };
  });
  const first = user.name.split(' ')[0];

  if (q.loading || !q.data) return <Page><Skeleton className="h-56 mb-8" /><div className="grid md:grid-cols-4 gap-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div></Page>;
  const { assessment, ms, requests, bundle, sessions, notes } = q.data;
  const plan = bundle?.plan;
  const tasks = bundle?.tasks ?? [];
  const upcoming = sessions.filter((s) => new Date(s.starts_at) > new Date() && !['cancelled'].includes(s.status));
  const open = tasks.filter((x) => !['completed', 'cancelled'].includes(x.status)).sort((a, b) => (a.due_date ?? '9').localeCompare(b.due_date ?? '9'));
  const progress = bundle ? planProgress(bundle.goals, tasks) : 0;

  // Journey: each step is derived from real records, so the "next action" is always accurate.
  const steps = [
    { k: 'account', i: Check, l: t('Account', 'الحساب'), done: true },
    { k: 'assessment', i: ClipboardList, l: t('Assessment', 'التقييم'), done: !!assessment && assessment.status !== 'draft' },
    { k: 'mentor', i: Handshake, l: t('Mentor', 'المرشد'), done: !!ms },
    { k: 'plan', i: Route, l: t('Plan approved', 'اعتماد الخطة'), done: !!plan && ['active', 'completed'].includes(plan.status) },
    { k: 'work', i: ListChecks, l: t('Execution', 'التنفيذ'), done: progress >= 100 || plan?.status === 'completed' },
    { k: 'final', i: Flag, l: t('Final review', 'المراجعة الختامية'), done: plan?.status === 'completed' },
  ];
  const current = steps.findIndex((s) => !s.done);
  const next =
    !assessment || assessment.status === 'draft' ? { text: t('Complete your initial assessment so mentors understand your goal.', 'أكمل التقييم الأولي ليفهم المرشدون هدفك.'), cta: t('Start assessment', 'ابدأ التقييم'), to: '/app/mentee/assessment', i: ClipboardList }
    : assessment.status === 'needs_info' ? { text: t('Your mentor asked for more information in your assessment.', 'طلب مرشدك معلومات إضافية في تقييمك.'), cta: t('Update assessment', 'تحديث التقييم'), to: '/app/mentee/assessment', i: ClipboardList }
    : !ms ? (requests.some((r) => ['submitted', 'under_review'].includes(r.status))
      ? { text: t('Your application is with the mentor. You’ll be notified when they reply.', 'طلبك لدى المرشد، وستصلك إشعارًا عند الرد.'), cta: t('View applications', 'عرض الطلبات'), to: '/app/mentee/mentors', i: Handshake }
      : { text: t('Find a mentor who matches your goal and apply.', 'ابحث عن مرشد يناسب هدفك وقدّم طلبك.'), cta: t('Browse mentors', 'تصفح المرشدين'), to: '/mentors', i: Search })
    : !plan ? { text: t('Your mentor is preparing your development plan.', 'يُعد مرشدك خطة تطويرك الآن.'), cta: t('Message your mentor', 'راسل مرشدك'), to: '/app/messages', i: MessagesSquare }
    : plan.status === 'pending_approval' ? { text: t('Your plan is ready — review and approve it.', 'خطتك جاهزة — راجعها واعتمدها.'), cta: t('Review plan', 'مراجعة الخطة'), to: '/app/mentee/plan', i: Route }
    : open[0] ? { text: t(`Next task: “${open[0].title}”`, `المهمة التالية: «${open[0].title}»`), cta: t('Open tasks', 'فتح المهام'), to: '/app/mentee/tasks', i: ListChecks }
    : { text: t('All tasks are done. Great work!', 'أنجزت كل المهام. عمل رائع!'), cta: t('View plan', 'عرض الخطة'), to: '/app/mentee/plan', i: Target };
  const NI = next.i;

  return (
    <Page>
      <PageHero badge={t('Mentee workspace', 'مساحة المتدرب')} title={<>{t('Welcome back, ', 'أهلًا بعودتك، ')}{first} <span className="inline-block animate-wave origin-[70%_70%]">👋</span></>} subtitle={next.text} illus="compass">
        <Link to={next.to} className={btnAccent}><NI size={18} />{next.cta}<ArrowRight size={16} className="rtl:rotate-180" /></Link>
      </PageHero>

      {/* Journey stepper */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6 mb-8 overflow-x-auto no-scrollbar">
        <ol className="flex items-start min-w-[640px]">
          {steps.map((s, i) => {
            const I = s.i;
            const state = s.done ? 'done' : i === current ? 'now' : 'todo';
            return (
              <li key={s.k} className="flex-1 flex flex-col items-center relative">
                {i > 0 && <span className={`absolute top-5 end-1/2 w-full h-0.5 -z-0 ${steps[i - 1].done ? 'bg-emerald-400' : 'bg-slate-100'}`} />}
                <span className={`relative z-10 w-10 h-10 rounded-full grid place-items-center border-2 transition-all ${state === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : state === 'now' ? 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-100 animate-pulse' : 'bg-white border-slate-200 text-slate-300'}`}>{state === 'done' ? <Check size={18} /> : <I size={17} />}</span>
                <span className={`text-xs font-bold mt-2 text-center ${state === 'todo' ? 'text-slate-400' : 'text-slate-700'}`}>{s.l}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Target size={22} />} label={t('Plan progress', 'تقدم الخطة')} value={`${Math.round(progress)}%`} tone="indigo" />
        <StatCard icon={<CheckCircle2 size={22} />} label={t('Tasks done', 'مهام منجزة')} value={`${tasks.filter((x) => x.status === 'completed').length}/${tasks.length}`} tone="green" />
        <StatCard icon={<AlarmClock size={22} />} label={t('Overdue', 'متأخرة')} value={tasks.filter(isOverdue).length} tone="red" />
        <StatCard icon={<CalendarClock size={22} />} label={t('Next session', 'الجلسة القادمة')} value={upcoming[0] ? t(`in ${Math.max(0, daysUntil(upcoming[0].starts_at)!)}d`, `بعد ${Math.max(0, daysUntil(upcoming[0].starts_at)!)} يوم`) : '—'} tone="orange" />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <Card title={t('Up next', 'المهام القادمة')} action={<Link to="/app/mentee/tasks" className="text-sm font-bold text-indigo-600">{t('All tasks', 'كل المهام')}</Link>}>
          {!open.length ? <Empty icon={<ListChecks size={26} />} title={t('No open tasks', 'لا توجد مهام مفتوحة')} text={plan ? t('You’re all caught up.', 'أنجزت كل شيء.') : t('Tasks appear once your plan is ready.', 'تظهر المهام بعد إعداد خطتك.')} />
            : <div className="space-y-2">{open.slice(0, 5).map((x) => <TaskRow key={x.id} task={x} goal={bundle?.goals.find((g) => g.id === x.goal_id)} onOpen={() => nav('/app/mentee/tasks')} />)}</div>}
        </Card>
        <div className="space-y-6">
          {ms && (
            <div className="bg-navy rounded-4xl p-6 text-white relative overflow-hidden">
              <div className="absolute -end-10 -top-10 w-40 h-40 rounded-full bg-orange-500/20" />
              <p className="relative text-[10px] font-black uppercase tracking-widest text-orange-400">{t('Your mentor', 'مرشدك')}</p>
              <div className="relative flex items-center gap-3 mt-3"><Avatar name={ms.mentor?.full_name ?? '?'} className="w-12 h-12" /><div><p className="font-extrabold">{ms.mentor?.full_name}</p><p className="text-xs text-slate-300">{ms.package?.name}</p></div></div>
              <div className="relative grid grid-cols-2 gap-2 mt-5">
                <Link to="/app/messages" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold"><MessagesSquare size={16} />{t('Message', 'مراسلة')}</Link>
                <Link to="/app/mentee/sessions" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-bold"><Video size={16} />{t('Sessions', 'الجلسات')}</Link>
              </div>
            </div>
          )}
          {plan && <Card className="text-center"><Ring value={progress} sub={t('of plan', 'من الخطة')} /><p className="font-extrabold text-slate-900 mt-3">{plan.title}</p><Link to="/app/mentee/plan" className="text-sm font-bold text-indigo-600 mt-2 inline-block">{t('Open plan', 'فتح الخطة')} →</Link></Card>}
          {notes.length > 0 && <Card title={t('From your supervisor', 'من مشرفك')}>
            {notes.slice(0, 3).map((n) => <div key={n.id} className="p-3 rounded-2xl bg-amber-50 border border-amber-100 mb-2 last:mb-0"><p className="text-sm text-slate-700">{n.body}</p><p className="text-[11px] text-slate-400 mt-1">{n.author?.full_name} · {fmtDateTime(n.created_at)}</p></div>)}
          </Card>}
          <Card title={t('Upcoming sessions', 'الجلسات القادمة')}>
            {!upcoming.length ? <p className="text-sm text-slate-400">{t('No sessions scheduled.', 'لا توجد جلسات مجدولة.')}</p> : upcoming.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                <span className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 grid place-items-center"><CalendarClock size={18} /></span>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{s.title}</p><p className="text-xs text-slate-400">{fmtDateTime(s.starts_at)}</p></div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Page>
  );
}
