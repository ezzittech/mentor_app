import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Briefcase, CalendarCheck, Check, Clock, Globe2, Languages, Link2, Loader2, MapPin, MessageCircle, Phone,
  ShieldCheck, Sparkles, Star, UserX, Users,
} from 'lucide-react';
import { SiteShell } from './Site';
import { LANG_NAME } from '../../components/MentorCard';
import { Avatar } from '../../components/media';
import { Empty, Field, Modal, Skeleton, Stars, Tabs, btnAccent, btnGhost, inputCls, toast } from '../../components/ui';
import { createRequest, getMentor, mentorReviews } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../lib/auth';
import { money, fmtDate } from '../../lib/format';
import { useLang, useT } from '../../lib/i18n';
import type { Mentor, Package } from '../../lib/types';

function ApplyModal({ m, pkg, onClose }: { m: Mentor; pkg: Package; onClose: () => void }) {
  const t = useT();
  const nav = useNavigate();
  const [goal, setGoal] = useState('');
  const [background, setBackground] = useState('');
  const [expectations, setExpectations] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await createRequest({ mentor_id: m.id, package_id: pkg.id, goal, background, expectations });
      toast.ok(t('Application sent! The mentor usually replies within ', 'تم إرسال طلبك! يرد المرشد عادة خلال ') + `${m.response_hours}h`);
      nav('/app/mentee/mentors');
    } catch (err) { toast.err(err); }
    setBusy(false);
  };
  return (
    <Modal open onClose={onClose} title={t(`Apply to ${m.full_name}`, `التقديم إلى ${m.full_name}`)} wide>
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 mb-6">
        <CalendarCheck size={20} className="text-indigo-600" />
        <p className="text-sm text-indigo-800"><b>{pkg.name}</b> · {money(pkg.price, pkg.currency)}{pkg.billing === 'monthly' && `/${t('month', 'شهر')}`}{pkg.trial_days > 0 && <> · {t(`${pkg.trial_days}-day free trial`, `تجربة مجانية ${pkg.trial_days} أيام`)}</>}</p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <Field label={t('What do you want to achieve? *', 'ما الذي تريد تحقيقه؟ *')} hint={t('Be specific: the clearer your goal, the better the mentor can help.', 'كن محددًا: كلما كان هدفك أوضح، كان المرشد أقدر على مساعدتك.')}>
          <textarea required minLength={20} rows={4} value={goal} onChange={(e) => setGoal(e.target.value)} className={inputCls} placeholder={t('e.g. I want to move into a senior role within 6 months…', 'مثال: أريد الانتقال إلى دور قيادي خلال 6 أشهر…')} />
        </Field>
        <Field label={t('Your background', 'خلفيتك')}><textarea rows={3} value={background} onChange={(e) => setBackground(e.target.value)} className={inputCls} placeholder={t('Current role, experience, what you tried so far', 'دورك الحالي وخبرتك وما جربته حتى الآن')} /></Field>
        <Field label={t('What do you expect from this mentorship?', 'ما توقعاتك من هذا الإرشاد؟')}><textarea rows={2} value={expectations} onChange={(e) => setExpectations(e.target.value)} className={inputCls} /></Field>
        <p className="text-xs text-slate-400 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" />{t('No payment now. You pay only after the mentor accepts.', 'لا دفع الآن. تدفع فقط بعد قبول المرشد لطلبك.')}</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button><button disabled={busy} className={btnAccent}>{busy && <Loader2 size={16} className="animate-spin" />}{t('Send application', 'إرسال الطلب')}</button></div>
      </form>
    </Modal>
  );
}

export default function MentorProfile() {
  const { slug = '' } = useParams();
  const t = useT();
  const lang = useLang((s) => s.lang);
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const q = useAsync(() => getMentor(slug), [slug]);
  const reviews = useAsync(() => (q.data ? mentorReviews(q.data.id) : Promise.resolve([])), [q.data?.id]);
  const [tab, setTab] = useState<'monthly' | 'one_off'>('monthly');
  const [pick, setPick] = useState<number | null>(null);
  const [apply, setApply] = useState(false);

  if (q.loading) return <SiteShell><div className="max-w-7xl mx-auto px-5 py-10 space-y-6"><Skeleton className="h-64" /><Skeleton className="h-96" /></div></SiteShell>;
  const m = q.data;
  if (!m) return <SiteShell><div className="max-w-xl mx-auto py-24 px-5"><Empty icon={<UserX size={28} />} title={t('Mentor not found', 'المرشد غير موجود')} action={<Link to="/mentors" className={btnGhost}>{t('Browse mentors', 'تصفح المرشدين')}</Link>} /></div></SiteShell>;

  const pkgs = m.packages.filter((p) => p.is_active && p.billing === tab).sort((a, b) => a.price - b.price);
  const selected = m.packages.find((p) => p.id === pick) ?? pkgs[Math.min(1, pkgs.length - 1)];
  const full = !m.accepting || m.spots_left <= 0;
  const start = () => {
    if (!user) { nav('/register', { state: { from: `/mentors/${m.slug}` } }); return; }
    if (!user.roles.includes('mentee')) { toast.err(t('Switch to a mentee account to apply.', 'يلزم حساب متدرب للتقديم.')); return; }
    setApply(true);
  };

  return (
    <SiteShell>
      <section className="relative bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-20" />
        <div className="absolute -end-24 -top-24 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute start-1/3 -bottom-32 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-12 pb-28 flex flex-col md:flex-row gap-8 items-start md:items-end">
          <Avatar name={m.full_name} src={m.avatar_url} className="w-24 h-24 sm:w-32 sm:h-32 text-3xl sm:text-4xl shadow-2xl" ring />
          <div className="flex-1">
            {m.featured && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-black border border-orange-400/20 mb-3"><Sparkles size={13} />{t('Top mentor', 'مرشد مميز')}</span>}
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-2">{m.full_name}<BadgeCheck className="text-sky-400" /></h1>
            <p className="text-lg text-slate-200 mt-1">{m.headline}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-orange-400" />{m.job_title}{m.company && ` · ${m.company}`}</span>
              {m.country && <span className="flex items-center gap-1.5"><MapPin size={16} className="text-orange-400" />{m.country}</span>}
              <span className="flex items-center gap-1.5"><Languages size={16} className="text-orange-400" />{m.languages.map((l) => LANG_NAME[l]?.[lang] ?? l).join('، ')}</span>
              {m.linkedin_url && <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white"><Link2 size={16} className="text-orange-400" />LinkedIn</a>}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 -mt-16 relative pb-20 grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[[Star, m.rating_avg.toFixed(1), t(`${m.reviews_count} reviews`, `${m.reviews_count} تقييم`)], [Users, m.mentees_count, t('mentees', 'متدرب')], [Clock, `${m.response_hours}h`, t('response time', 'وقت الرد')], [Globe2, `${m.years_experience}+`, t('years experience', 'سنوات خبرة')]].map(([I, v, l], i) => {
              const Icon = I as typeof Star;
              return <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 text-center"><Icon size={20} className="mx-auto text-orange-500 mb-2" /><p className="text-2xl font-black text-slate-900">{v as string}</p><p className="text-xs text-slate-400 font-semibold">{l as string}</p></div>;
            })}
          </div>

          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-7">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">{t('About', 'نبذة')}</h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-line">{m.bio}</div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mt-8 mb-3">{t('Skills', 'المهارات')}</h3>
            <div className="flex flex-wrap gap-2">{m.skills.map((s) => <Link key={s} to={`/mentors?skill=${encodeURIComponent(s)}`} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100">{s}</Link>)}</div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mt-6 mb-3">{t('Fields', 'المجالات')}</h3>
            <div className="flex flex-wrap gap-2">{m.categories.map((c) => <Link key={c.id} to={`/mentors?category=${c.slug}`} className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100">{lang === 'ar' ? c.name_ar : c.name_en}</Link>)}</div>
          </section>

          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-7">
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">{t('What you get', 'ما الذي ستحصل عليه')}</h2>
            <p className="text-sm text-slate-500 mb-6">{t('Every mentorship on the platform includes the full development toolkit.', 'كل علاقة إرشاد على المنصة تتضمن أدوات التطوير الكاملة.')}</p>
            <div className="grid sm:grid-cols-2 gap-3">{[
              t('Initial assessment & goal setting', 'تقييم أولي وتحديد الأهداف'), t('Personal development plan', 'خطة تطوير شخصية'), t('Practical tasks with reviews', 'مهام عملية مع مراجعة'),
              t('1:1 video sessions', 'جلسات فيديو فردية'), t('Chat between sessions', 'محادثة بين الجلسات'), t('Progress tracking & final review', 'متابعة التقدم ومراجعة ختامية'),
            ].map((x) => <div key={x} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50"><span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center shrink-0"><Check size={15} /></span><span className="text-sm font-semibold text-slate-700">{x}</span></div>)}</div>
          </section>

          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-7">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-extrabold text-slate-900">{t('Reviews', 'التقييمات')}</h2><span className="flex items-center gap-2"><Stars value={m.rating_avg} size={16} /><b>{m.rating_avg.toFixed(1)}</b></span></div>
            {!reviews.data?.length ? <p className="text-sm text-slate-400">{t('No reviews yet.', 'لا توجد تقييمات بعد.')}</p> : (
              <div className="space-y-5">{reviews.data.map((r) => (
                <div key={r.id} className="flex gap-4 pb-5 border-b border-slate-50 last:border-0 last:pb-0">
                  <Avatar name={r.mentee?.full_name ?? '?'} className="w-11 h-11 text-xs" />
                  <div className="flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-slate-900">{r.mentee?.full_name}</b><span className="text-xs text-slate-400">{fmtDate(r.created_at)}</span></div>
                    <Stars value={r.rating} size={13} /><p className="text-slate-600 mt-2 leading-relaxed">{r.comment}</p></div>
                </div>
              ))}</div>
            )}
          </section>
        </div>

        {/* Plan picker */}
        <aside>
          <div className="lg:sticky lg:top-28 bg-white rounded-4xl border border-slate-100 shadow-xl p-6">
            <Tabs value={tab} onChange={(v) => { setTab(v); setPick(null); }} tabs={[{ id: 'monthly', label: t('Monthly plans', 'باقات شهرية') }, { id: 'one_off', label: t('Single session', 'جلسة واحدة') }]} />
            <div className="space-y-3 mt-5">
              {pkgs.map((p) => {
                const on = selected?.id === p.id;
                return (
                  <button key={p.id} onClick={() => setPick(p.id)} className={`w-full text-start p-4 rounded-2xl border-2 transition-all ${on ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' : 'border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center justify-between"><span className="font-extrabold text-slate-900">{p.name}</span><span><b className="text-lg text-slate-900">{money(p.price, p.currency)}</b>{p.billing === 'monthly' && <span className="text-xs text-slate-400">/{t('mo', 'شهر')}</span>}</span></div>
                    <div className={`grid transition-[grid-template-rows] duration-300 ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden">
                      <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                        <li className="flex items-center gap-2"><Phone size={14} className="text-indigo-500" />{p.billing === 'monthly' ? t(`${p.calls_per_month} × ${p.call_minutes}-min calls / month`, `${p.calls_per_month} × مكالمة ${p.call_minutes} دقيقة شهريًا`) : t(`${p.call_minutes}-minute session`, `جلسة ${p.call_minutes} دقيقة`)}</li>
                        {p.chat_support && <li className="flex items-center gap-2"><MessageCircle size={14} className="text-indigo-500" />{t(`Chat · replies within ${p.response_hours}h`, `محادثة · رد خلال ${p.response_hours} ساعة`)}</li>}
                        {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check size={14} className="text-emerald-500" />{f}</li>)}
                      </ul>
                    </div></div>
                  </button>
                );
              })}
              {!pkgs.length && <p className="text-sm text-slate-400 text-center py-6">{t('No plans of this type.', 'لا توجد باقات من هذا النوع.')}</p>}
            </div>
            {selected && <button disabled={full} onClick={start} className={`${btnAccent} w-full mt-5 py-4 text-base`}>{full ? t('Fully booked', 'مكتمل العدد') : <>{selected.trial_days > 0 ? t(`Start ${selected.trial_days}-day free trial`, `ابدأ التجربة المجانية (${selected.trial_days} أيام)`) : t('Apply now', 'قدّم الآن')}<ArrowRight size={18} className="rtl:rotate-180" /></>}</button>}
            <p className="text-xs text-slate-400 text-center mt-3">{full ? t('Join later — spots open as mentees finish.', 'تتاح المقاعد عند إنهاء المتدربين لبرامجهم.') : t(`${m.spots_left} spots left · cancel anytime`, `${m.spots_left} مقاعد متبقية · إلغاء في أي وقت`)}</p>
          </div>
        </aside>
      </div>
      {apply && selected && <ApplyModal m={m} pkg={selected} onClose={() => setApply(false)} />}
    </SiteShell>
  );
}
