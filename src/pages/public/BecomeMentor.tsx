import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarClock, Coins, Globe2, HeartHandshake, ListChecks, ShieldCheck, Sparkles } from 'lucide-react';
import { SectionTitle, SiteShell } from './Site';
import { useT } from '../../lib/i18n';

export default function BecomeMentor() {
  const t = useT();
  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 grid-dots opacity-20" />
        <div className="absolute -end-24 -top-24 w-[500px] h-[500px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -start-24 bottom-0 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold text-orange-300 border border-white/10"><Sparkles size={14} />{t('For experienced professionals', 'للمحترفين أصحاب الخبرة')}</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mt-6 tracking-tight leading-tight">{t('Share what you know. ', 'شارك خبرتك. ')}<span className="text-orange-400">{t('Change careers.', 'غيّر مسيرات.')}</span></h1>
            <p className="text-lg text-slate-300 mt-5 max-w-lg">{t('Mentor on your own schedule, set your own prices and get professional tools to run long-term mentorships.', 'أرشد وفق جدولك، وحدد أسعارك، واحصل على أدوات احترافية لإدارة علاقات إرشاد طويلة المدى.')}</p>
            <Link to="/register?as=mentor" className="inline-flex items-center gap-2 mt-8 px-7 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 font-bold shadow-xl">{t('Apply as a mentor', 'قدّم كمرشد')}<ArrowRight size={18} className="rtl:rotate-180" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[[Coins, '$2.4k', t('avg. monthly earnings', 'متوسط الدخل الشهري')], [HeartHandshake, '92%', t('mentee satisfaction', 'رضا المتدربين')], [Globe2, '30+', t('countries', 'دولة')], [CalendarClock, '3h', t('per week on average', 'أسبوعيًا في المتوسط')]].map(([I, v, l], i) => {
              const Icon = I as typeof Coins;
              return <div key={i} className={`p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur ${i % 2 ? 'translate-y-6' : ''}`}><Icon className="text-orange-400" /><p className="text-3xl font-black mt-3">{v as string}</p><p className="text-sm text-slate-300">{l as string}</p></div>;
            })}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-24">
        <SectionTitle kicker={t('Your toolkit', 'أدواتك')} title={t('Everything to mentor at your best', 'كل ما تحتاجه لتكون مرشدًا متميزًا')} center />
        <div className="grid md:grid-cols-3 gap-6">{[
          [ListChecks, t('Plan builder', 'باني الخطط'), t('Turn assessments into goals, milestones and tasks in minutes.', 'حوّل التقييمات إلى أهداف ومراحل ومهام خلال دقائق.')],
          [BarChart3, t('Mentee dashboards', 'لوحات المتدربين'), t('See progress, overdue tasks and what needs your review.', 'شاهد التقدم والمهام المتأخرة وما يحتاج مراجعتك.')],
          [ShieldCheck, t('Payments handled', 'المدفوعات مُدارة'), t('Invoices, commission and payouts tracked for you.', 'الفواتير والعمولات والمستحقات محسوبة لك.')],
        ].map(([I, title, d]) => { const Icon = I as typeof Coins; return <div key={title as string} className="p-8 rounded-4xl bg-white border border-slate-100 shadow-sm"><span className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 grid place-items-center"><Icon size={24} /></span><h3 className="text-xl font-extrabold text-slate-900 mt-5">{title as string}</h3><p className="text-slate-500 mt-2">{d as string}</p></div>; })}</div>
        <div className="mt-16 bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-xl font-extrabold text-slate-900 mb-6">{t('How to join', 'كيف تنضم')}</h3>
          <div className="grid md:grid-cols-4 gap-6">{[t('Create an account', 'أنشئ حسابًا'), t('Complete your mentor profile & plans', 'أكمل ملفك وباقاتك'), t('Our team reviews it (2–5 days)', 'يراجعه فريقنا (2–5 أيام)'), t('Get published & receive applications', 'يُنشر ملفك وتستقبل الطلبات')].map((s, i) => <div key={s} className="flex gap-3"><span className="w-8 h-8 rounded-full bg-orange-500 text-white font-black grid place-items-center shrink-0">{i + 1}</span><p className="font-semibold text-slate-700">{s}</p></div>)}</div>
        </div>
      </section>
    </SiteShell>
  );
}
