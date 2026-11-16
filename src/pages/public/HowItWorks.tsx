import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Eye, Flag, Handshake, ListChecks, Lock, MessagesSquare, Route, ShieldCheck, Users } from 'lucide-react';
import { SectionTitle, SiteShell } from './Site';
import { FAQ } from './Home';
import { useT } from '../../lib/i18n';

export default function HowItWorks() {
  const t = useT();
  const steps = [
    { i: ClipboardList, c: 'from-indigo-500 to-indigo-700', t: t('1. Sign up & assessment', '1. التسجيل والتقييم'), d: t('Create your account, choose language and time zone, then complete a short assessment: goal, field, current level, strengths, gaps, weekly time and target date. It is a planning tool — not a test or judgement.', 'أنشئ حسابك واختر اللغة والمنطقة الزمنية، ثم أكمل تقييمًا قصيرًا: الهدف والمجال والمستوى الحالي ونقاط القوة والفجوات والوقت الأسبوعي والتاريخ المستهدف. إنه أداة تخطيط — لا اختبار ولا حكم.') },
    { i: Handshake, c: 'from-orange-400 to-orange-600', t: t('2. Choose a mentor & apply', '2. اختر مرشدًا وقدّم طلبك'), d: t('Browse vetted mentors, compare plans and send an application describing your goal. The mentor accepts or declines — you only pay after acceptance.', 'تصفح المرشدين المعتمدين وقارن الباقات وأرسل طلبًا يصف هدفك. يقبل المرشد أو يعتذر — ولا تدفع إلا بعد القبول.') },
    { i: Route, c: 'from-sky-500 to-indigo-600', t: t('3. Build your development plan', '3. بناء خطة التطوير'), d: t('Your mentor reviews the assessment and drafts a plan: goals, milestones, tasks, dates and success criteria. You review and approve it. Every change is versioned.', 'يراجع مرشدك التقييم ويصيغ خطة: أهداف ومراحل ومهام ومواعيد ومعايير نجاح. تراجعها وتعتمدها، وكل تعديل محفوظ بإصدار.') },
    { i: ListChecks, c: 'from-emerald-500 to-teal-600', t: t('4. Learn by doing', '4. تعلّم بالتطبيق'), d: t('Work on exercises, projects and resources linked to each goal. Submit your work and receive feedback — approved, or changes requested.', 'نفّذ تمارين ومشاريع وموارد مرتبطة بكل هدف. سلّم عملك واحصل على تغذية راجعة — اعتماد أو طلب تعديل.') },
    { i: MessagesSquare, c: 'from-purple-500 to-indigo-600', t: t('5. Sessions & chat', '5. الجلسات والمحادثة'), d: t('Book 1:1 video sessions (Zoom / Google Meet links), with agendas and shared notes. Chat with your mentor between sessions.', 'احجز جلسات فيديو فردية (روابط Zoom / Google Meet) مع جدول أعمال وملاحظات مشتركة، وتواصل مع مرشدك بين الجلسات.') },
    { i: Eye, c: 'from-amber-500 to-orange-600', t: t('6. Supervisor follow-up', '6. متابعة المشرف'), d: t('A supervisor follows execution: overdue tasks, missed sessions and inactivity. They send reminders, log interventions and request plan revisions when needed.', 'يتابع المشرف التنفيذ: المهام المتأخرة والجلسات الفائتة وعدم النشاط، ويرسل التذكيرات ويسجل التدخلات ويطلب تعديل الخطة عند الحاجة.') },
    { i: Flag, c: 'from-indigo-600 to-navy', t: t('7. Final review', '7. المراجعة الختامية'), d: t('Compare results with your starting point, complete a self-assessment and receive a closing summary with recommendations for what’s next.', 'قارن النتائج بنقطة البداية، وأكمل تقييمًا ذاتيًا، واحصل على ملخص ختامي وتوصيات للمرحلة التالية.') },
  ];
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -end-40 w-[500px] h-[500px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-10 text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">{t('How it works', 'كيف تعمل المنصة')}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-3 tracking-tight">{t('From goal to measurable result', 'من الهدف إلى نتيجة قابلة للقياس')}</h1>
          <p className="text-lg text-slate-500 mt-4">{t('Registration → assessment → personal plan → tasks & resources → sessions → supervisor follow-up → final review.', 'تسجيل ← تقييم أولي ← خطة شخصية ← مهام وموارد ← جلسات ← متابعة المشرف ← مراجعة ختامية.')}</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-5 pb-20">
        <ol className="relative border-s-2 border-dashed border-indigo-100 ms-6 space-y-8">
          {steps.map(({ i: I, c, t: title, d }) => (
            <li key={title} className="relative ps-10">
              <span className={`absolute -start-[27px] top-0 w-[52px] h-[52px] rounded-2xl bg-gradient-to-br ${c} text-white grid place-items-center shadow-lg`}><I size={24} /></span>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow"><h2 className="text-xl font-extrabold text-slate-900">{title}</h2><p className="text-slate-500 mt-2 leading-relaxed">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
          <SectionTitle kicker={t('Roles', 'الأدوار')} title={t('Everyone has a clear role', 'لكل طرف دور واضح')} center />
          <div className="grid md:grid-cols-3 gap-6">{[
            [Users, t('Mentee', 'المتدرب'), t('Owns the goal. Completes the assessment, approves the plan, does the tasks, books sessions.', 'صاحب الهدف. يكمل التقييم ويعتمد الخطة وينفذ المهام ويحجز الجلسات.')],
            [Handshake, t('Mentor', 'المرشد'), t('The expert. Builds the plan, reviews submissions, runs sessions and gives feedback.', 'الخبير. يبني الخطة ويراجع التسليمات ويدير الجلسات ويقدم التغذية الراجعة.')],
            [Eye, t('Supervisor', 'المشرف'), t('Follows execution and quality — not the specialist advice. Spots risks early.', 'يتابع التنفيذ والجودة — لا الإرشاد التخصصي — ويرصد المخاطر مبكرًا.')],
          ].map(([I, title, d]) => { const Icon = I as typeof Users; return <div key={title as string} className="p-8 rounded-4xl bg-[#fafafa] border border-slate-100"><Icon size={28} className="text-indigo-600" /><h3 className="text-xl font-extrabold text-slate-900 mt-4">{title as string}</h3><p className="text-slate-500 mt-2">{d as string}</p></div>; })}</div>
          <div className="mt-8 flex items-start gap-3 p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm max-w-3xl mx-auto"><Lock size={18} className="shrink-0 mt-0.5" /><p>{t('Privacy by design: private messages and sensitive notes are visible only to the people involved. Supervisors do not read private chats by default.', 'الخصوصية أساس التصميم: الرسائل الخاصة والملاحظات الحساسة مرئية فقط للأطراف المعنية، ولا يطّلع المشرف على المحادثات الخاصة افتراضيًا.')}</p></div>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-5 py-20">
        <SectionTitle kicker={t('Questions', 'أسئلة')} title={t('Frequently asked', 'الأسئلة الشائعة')} center />
        <FAQ />
        <div className="text-center mt-12"><Link to="/register" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-200"><ShieldCheck size={18} />{t('Start your journey', 'ابدأ رحلتك')}<ArrowRight size={18} className="rtl:rotate-180" /></Link></div>
      </section>
    </SiteShell>
  );
}
