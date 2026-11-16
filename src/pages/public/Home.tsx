import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Building2, CalendarCheck, CircleCheck, ClipboardList, Eye, Flag, Handshake, ListChecks, MessagesSquare,
  Route, Search, ShieldCheck, Sparkles, Star, Target, TrendingUp, Users,
} from 'lucide-react';
import { SectionTitle, SiteShell } from './Site';
import { CAT_ICON, MentorCard } from '../../components/MentorCard';
import { Avatar } from '../../components/media';
import { SkeletonGrid, Stars } from '../../components/ui';
import { listCategories, listMentors, publicReviews } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useLang, useT } from '../../lib/i18n';

const COMPANIES = ['Careem', 'Aramco', 'Talabat', 'Noon', 'Grab', 'AWS', 'Deel', 'Flat6Labs', 'STC', 'Emirates NBD', 'Petronas', 'Microsoft'];

export function FAQ({ limit }: { limit?: number }) {
  const t = useT();
  const items = [
    [t('How is this different from booking a single call?', 'ما الفرق بين المنصة وحجز مكالمة واحدة؟'), t('Every mentorship runs on a personal development plan: an initial assessment, measurable goals, tasks with reviews, sessions and follow-up by a supervisor — so progress is visible, not just conversations.', 'كل علاقة إرشاد تقوم على خطة تطوير شخصية: تقييم أولي، وأهداف قابلة للقياس، ومهام تتم مراجعتها، وجلسات، ومتابعة من مشرف — فيصبح التقدم واضحًا لا مجرد محادثات.')],
    [t('Is there a free trial?', 'هل توجد فترة تجريبية؟'), t('Most monthly plans include a 7-day trial. If the match isn’t right, you can cancel before it ends.', 'معظم الباقات الشهرية تتضمن فترة تجريبية لمدة 7 أيام، ويمكنك الإلغاء قبل انتهائها إذا لم يكن التوافق مناسبًا.')],
    [t('How are mentors vetted?', 'كيف يتم اختيار المرشدين؟'), t('Every mentor applies and is reviewed by our team (experience, references and a short interview) before their profile is published.', 'يتقدم كل مرشد بطلب يراجعه فريقنا (الخبرة والمراجع ومقابلة قصيرة) قبل نشر ملفه.')],
    [t('Can I switch mentors?', 'هل يمكنني تغيير المرشد؟'), t('Yes. Your plan, goals and history stay with you and can be continued with a new mentor.', 'نعم. تبقى خطتك وأهدافك وسجلك معك ويمكن متابعتها مع مرشد جديد.')],
    [t('Which languages are supported?', 'ما اللغات المدعومة؟'), t('The platform is fully bilingual (Arabic & English) and you can filter mentors by the language they mentor in.', 'المنصة ثنائية اللغة بالكامل (العربية والإنجليزية)، ويمكنك تصفية المرشدين حسب لغة الإرشاد.')],
    [t('Do you work with companies?', 'هل تعملون مع الشركات؟'), t('Yes — teams get program dashboards, supervisors and reports. See Pricing & teams.', 'نعم — تحصل الفرق على لوحات برامج ومشرفين وتقارير. راجع صفحة الأسعار والفرق.')],
  ];
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {items.slice(0, limit).map(([q, a], i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start font-bold text-slate-800" aria-expanded={open === i}>
            {q}<span className={`w-7 h-7 rounded-full grid place-items-center text-lg shrink-0 transition-all ${open === i ? 'bg-orange-500 text-white rotate-45' : 'bg-slate-100 text-slate-500'}`}>+</span>
          </button>
          <div className={`grid transition-[grid-template-rows] duration-300 ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><p className="px-6 pb-5 text-slate-500 leading-relaxed">{a}</p></div></div>
        </div>
      ))}
    </div>
  );
}

function HeroVisual() {
  const t = useT();
  return (
    <div className="relative hidden lg:block">
      <div className="bg-navy rounded-[2.5rem] p-8 text-white shadow-2xl rotate-1 relative overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-20" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">{t('My development plan', 'خطة تطويري')}</p>
          <p className="text-2xl font-extrabold mt-1">{t('Path to Senior Engineer', 'الطريق إلى مهندس أول')}</p>
          <div className="mt-6 space-y-3">{[
            [t('Master system design', 'إتقان تصميم الأنظمة'), 72, 'bg-orange-500'],
            [t('Lead code quality', 'قيادة جودة الكود'), 45, 'bg-sky-400'],
            [t('Build visible track record', 'بناء سجل إنجازات واضح'), 15, 'bg-emerald-400'],
          ].map(([g, v, c]) => (
            <div key={g as string} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex justify-between text-sm font-semibold mb-2"><span>{g}</span><span className="text-slate-300">{v}%</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className={`h-full rounded-full ${c}`} style={{ width: `${v}%` }} /></div>
            </div>
          ))}</div>
          <div className="mt-5 flex items-center gap-3 p-3 rounded-2xl bg-white/5"><Avatar name="Omar Khalid" className="w-10 h-10 text-sm" /><div className="flex-1"><p className="text-sm font-bold">{t('Next session · Thu 6:00 PM', 'الجلسة القادمة · الخميس 6:00 م')}</p><p className="text-xs text-slate-400">{t('Mock system design interview', 'مقابلة تجريبية لتصميم الأنظمة')}</p></div><CalendarCheck size={20} className="text-orange-400" /></div>
        </div>
      </div>
      <div className="absolute -bottom-10 -start-12 bg-white rounded-3xl p-5 shadow-xl border border-slate-100 -rotate-2 w-72 animate-float">
        <p className="text-[10px] font-black uppercase text-slate-400">{t('Task reviewed', 'تمت مراجعة المهمة')}</p>
        <p className="text-base font-black text-slate-800 mt-1">{t('Design doc: notifications', 'مستند تصميم: الإشعارات')}</p>
        <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><CircleCheck size={14} />{t('Approved by your mentor', 'اعتمدها مرشدك')}</p>
      </div>
      <div className="absolute -top-6 -end-4 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 grid place-items-center"><Eye size={20} /></span><div><p className="text-xs font-black text-slate-800">{t('Supervisor check-in', 'متابعة المشرف')}</p><p className="text-[11px] text-slate-400">{t('On track 🎯', 'على المسار الصحيح 🎯')}</p></div></div>
    </div>
  );
}

export default function Home() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const mentors = useAsync(listMentors);
  const cats = useAsync(listCategories);
  const reviews = useAsync(publicReviews);
  const featured = (mentors.data ?? []).filter((m) => m.featured).concat((mentors.data ?? []).filter((m) => !m.featured)).slice(0, 6);

  const journey = [
    { i: ClipboardList, t: t('Assessment', 'التقييم الأولي'), d: t('Define your goal, level, strengths and gaps in 5 minutes.', 'حدد هدفك ومستواك ونقاط قوتك وفجواتك خلال 5 دقائق.') },
    { i: Handshake, t: t('Match & apply', 'المطابقة والتقديم'), d: t('Pick a vetted mentor and plan that fits your goal and budget.', 'اختر مرشدًا معتمدًا وباقة تناسب هدفك وميزانيتك.') },
    { i: Route, t: t('Personal plan', 'خطة شخصية'), d: t('Goals, milestones and success criteria you both agree on.', 'أهداف ومراحل ومعايير نجاح تتفقان عليها معًا.') },
    { i: ListChecks, t: t('Tasks & sessions', 'مهام وجلسات'), d: t('Practical tasks with feedback, plus regular 1:1 calls.', 'مهام عملية مع تغذية راجعة، وجلسات فردية منتظمة.') },
    { i: Eye, t: t('Supervisor follow-up', 'متابعة المشرف'), d: t('A supervisor spots delays early and keeps you on track.', 'مشرف يرصد التأخر مبكرًا ويبقيك على المسار.') },
    { i: Flag, t: t('Final review', 'المراجعة الختامية'), d: t('Compare results to your starting point and plan what’s next.', 'قارن النتائج بنقطة البداية وخطط للمرحلة التالية.') },
  ];

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -end-40 w-[600px] h-[600px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute top-40 -start-40 w-[400px] h-[400px] rounded-full bg-orange-100/60 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-14 pb-24 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-14 items-center">
          <div className="animate__animated animate__fadeInUp">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm"><Sparkles size={14} className="text-orange-500" />{t('Mentorship + a real development plan', 'إرشاد + خطة تطوير حقيقية')}</span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              {t('Grow faster with a ', 'انطلق في مسيرتك مع ')}
              <span className="text-indigo-600">{t('mentor', 'مرشد')}</span>{' '}
              <span className="relative whitespace-nowrap">{t('who’s been there', 'سبقك إلى القمة')}<svg className="absolute -bottom-2 start-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none"><path d="M2 9C50 3 150 3 198 9" stroke="#e9a823" strokeWidth="5" strokeLinecap="round" /></svg></span>
            </h1>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-lg">{t('1:1 long-term mentorship with vetted experts — built around your goals, with a personal plan, practical tasks and progress you can measure.', 'إرشاد فردي طويل المدى مع خبراء معتمدين — مبني حول أهدافك، بخطة شخصية ومهام عملية وتقدم يمكنك قياسه.')}</p>
            <form onSubmit={(e) => { e.preventDefault(); nav(`/mentors${q ? `?q=${encodeURIComponent(q)}` : ''}`); }} className="mt-8 flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-xl focus-within:ring-4 focus-within:ring-indigo-50">
              <Search size={20} className="text-slate-400 ms-3 shrink-0" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Try “System Design”, “Product”, “Leadership”…', 'جرّب "تصميم الأنظمة"، "إدارة المنتجات"، "القيادة"…')} className="flex-1 min-w-0 py-3 outline-none bg-transparent text-sm" aria-label={t('Search mentors', 'ابحث عن مرشد')} />
              <button className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-200 shrink-0">{t('Find mentors', 'ابحث')}</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {(cats.data ?? []).slice(0, 5).map((c) => <Link key={c.id} to={`/mentors?category=${c.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors">{lang === 'ar' ? c.name_ar : c.name_en}</Link>)}
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3 rtl:space-x-reverse">{['Lina H', 'Omar K', 'Maya C', 'Noura S'].map((n) => <Avatar key={n} name={n} className="w-10 h-10 text-xs" ring />)}</div>
              <div className="text-sm"><Stars value={5} /><p className="text-slate-500"><b className="text-slate-800">4.9/5</b> {t('from 400+ mentee reviews', 'من أكثر من 400 تقييم')}</p></div>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Marquee */}
      <section className="bg-white border-y border-slate-100 py-8 overflow-hidden">
        <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-slate-400 mb-6">{t('Mentors from leading companies', 'مرشدون من كبرى الشركات')}</p>
        <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]" dir="ltr">
          <div className="flex shrink-0 gap-14 animate-marquee pe-14">{[...COMPANIES, ...COMPANIES].map((c, i) => <span key={i} className="text-2xl font-black text-slate-300 whitespace-nowrap font-brand">{c}</span>)}</div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <SectionTitle kicker={t('Explore', 'استكشف')} title={t('Mentorship in every field', 'إرشاد في كل المجالات')} sub={t('From your first job to the C-suite.', 'من وظيفتك الأولى إلى المناصب القيادية.')} center />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(cats.data ?? []).map((c, i) => {
            const I = CAT_ICON[c.icon ?? ''] ?? Target;
            const count = (mentors.data ?? []).filter((m) => m.categories.some((x) => x.id === c.id)).length;
            return (
              <Link key={c.id} to={`/mentors?category=${c.slug}`} className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all overflow-hidden">
                <div className="absolute -end-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-50 group-hover:bg-orange-50 group-hover:scale-150 transition-all duration-500" />
                <span className={`relative w-12 h-12 rounded-2xl grid place-items-center mb-4 transition-colors ${i % 2 ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'} group-hover:bg-indigo-600 group-hover:text-white`}><I size={22} /></span>
                <h3 className="relative font-extrabold text-slate-900">{lang === 'ar' ? c.name_ar : c.name_en}</h3>
                <p className="relative text-xs text-slate-400 mt-1">{count} {t('mentors', 'مرشد')}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured mentors */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <SectionTitle kicker={t('Top mentors', 'مرشدون مميزون')} title={t('Learn from people who did it', 'تعلّم ممن حققوا ما تطمح إليه')} />
            <Link to="/mentors" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 mb-10">{t('Browse all mentors', 'تصفح جميع المرشدين')} <ArrowRight size={16} className="rtl:rotate-180" /></Link>
          </div>
          {mentors.loading ? <SkeletonGrid /> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">{featured.map((m) => <MentorCard key={m.id} m={m} />)}</div>}
        </div>
      </section>

      {/* Journey */}
      <section className="relative max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <SectionTitle kicker={t('Beyond a marketplace', 'أكثر من مجرد سوق')} title={t('A complete development journey', 'رحلة تطوير متكاملة')} sub={t('Not just calls — a structured path from goal to measurable result.', 'ليست مجرد مكالمات — بل مسار منظم من الهدف إلى نتيجة قابلة للقياس.')} center />
        <div className="relative grid md:grid-cols-3 lg:grid-cols-6 gap-5">
          <div className="hidden lg:block absolute top-9 start-[8%] end-[8%] h-0.5 bg-gradient-to-r from-indigo-200 via-orange-300 to-indigo-200" />
          {journey.map(({ i: I, t: title, d }, k) => (
            <div key={title} className="relative text-center group">
              <span className="relative z-10 mx-auto w-[72px] h-[72px] rounded-3xl bg-white border-2 border-indigo-100 text-indigo-600 grid place-items-center shadow-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:-translate-y-1 transition-all"><I size={28} /></span>
              <span className="absolute top-0 start-1/2 ms-6 z-20 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black grid place-items-center shadow">{k + 1}</span>
              <h3 className="font-extrabold text-slate-900 mt-5">{title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-24">
        <div className="bg-navy rounded-[2.5rem] p-10 lg:p-14 text-white relative overflow-hidden">
          <div className="absolute -end-20 -bottom-20 w-80 h-80 rounded-full bg-orange-500/15" />
          <div className="absolute -start-10 -top-10 w-60 h-60 rounded-full bg-indigo-500/20" />
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[[Users, '1,200+', t('mentees supported', 'متدرب تم دعمهم')], [BadgeCheck, '150+', t('vetted mentors', 'مرشد معتمد')], [TrendingUp, '87%', t('goals achieved', 'من الأهداف تحققت')], [Star, '4.9', t('average rating', 'متوسط التقييم')]].map(([I, v, l]) => {
              const Icon = I as typeof Users;
              return <div key={l as string}><Icon size={28} className="mx-auto text-orange-400 mb-3" /><p className="text-4xl font-black">{v as string}</p><p className="text-slate-300 text-sm mt-1">{l as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
          <SectionTitle kicker={t('Success stories', 'قصص نجاح')} title={t('What mentees say', 'ماذا يقول المتدربون')} center />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{(reviews.data ?? []).map((r) => (
            <figure key={r.id} className="bg-[#fafafa] rounded-3xl border border-slate-100 p-7 flex flex-col hover:bg-white hover:shadow-xl transition-all">
              <Stars value={r.rating} size={16} />
              <blockquote className="mt-4 text-slate-700 leading-relaxed flex-1">“{r.comment}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3"><Avatar name={r.mentee?.full_name ?? '?'} className="w-10 h-10 text-xs" /><div className="text-sm"><b className="text-slate-900 block">{r.mentee?.full_name}</b><span className="text-slate-400">{r.mentee?.headline}</span></div></figcaption>
            </figure>
          ))}</div>
        </div>
      </section>

      {/* Mentor + teams CTAs */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-24 grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
          <div className="absolute -end-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
          <span className="relative inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-300"><Handshake size={16} />{t('For experts', 'للخبراء')}</span>
          <h2 className="relative text-3xl font-extrabold mt-3 tracking-tight">{t('Become a mentor', 'كن مرشدًا')}</h2>
          <p className="relative text-indigo-100 mt-3 max-w-md">{t('Share your experience, set your own plans and prices, and manage mentees with powerful tools.', 'شارك خبرتك، وحدد باقاتك وأسعارك، وأدر متدربيك بأدوات احترافية.')}</p>
          <Link to="/become-a-mentor" className="relative inline-flex items-center gap-2 mt-8 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 font-bold shadow-xl">{t('Apply now', 'قدّم الآن')} <ArrowRight size={18} className="rtl:rotate-180" /></Link>
        </div>
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute -end-16 -bottom-16 w-64 h-64 rounded-full bg-orange-50" />
          <span className="relative inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500"><Building2 size={16} />{t('For organizations', 'للمؤسسات')}</span>
          <h2 className="relative text-3xl font-extrabold mt-3 tracking-tight text-slate-900">{t('Mentorship programs for teams', 'برامج إرشاد للفرق')}</h2>
          <p className="relative text-slate-500 mt-3 max-w-md">{t('Run cohorts with supervisors, program dashboards, risk alerts and impact reports.', 'أدر دفعات مع مشرفين ولوحات برامج وتنبيهات تعثر وتقارير أثر.')}</p>
          <div className="relative mt-6 flex flex-wrap gap-3 text-sm text-slate-600">{[t('Program dashboards', 'لوحات البرامج'), t('Supervisor follow-up', 'متابعة المشرفين'), t('Impact reports', 'تقارير الأثر')].map((x) => <span key={x} className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-500" />{x}</span>)}</div>
          <Link to="/pricing" className="relative inline-flex items-center gap-2 mt-8 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-200">{t('See team plans', 'باقات الفرق')} <ArrowRight size={18} className="rtl:rotate-180" /></Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-24">
          <SectionTitle kicker={t('Questions', 'أسئلة')} title={t('Frequently asked', 'الأسئلة الشائعة')} center />
          <FAQ limit={5} />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20 text-center">
        <MessagesSquare size={40} className="mx-auto text-indigo-600" />
        <h2 className="text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">{t('Your next career step starts here', 'خطوتك المهنية القادمة تبدأ هنا')}</h2>
        <p className="text-slate-500 mt-3">{t('Create a free account, take the assessment and meet your mentor.', 'أنشئ حسابًا مجانيًا، وأكمل التقييم، وتعرّف على مرشدك.')}</p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link to="/register" className="px-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-200">{t('Create free account', 'أنشئ حسابًا مجانيًا')}</Link>
          <Link to="/mentors" className="px-7 py-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 flex items-center gap-2"><Search size={18} />{t('Browse mentors', 'تصفح المرشدين')}</Link>
        </div>
      </section>
    </SiteShell>
  );
}
