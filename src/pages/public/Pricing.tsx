import { Link } from 'react-router-dom';
import { Building2, Check, Sparkles, User, Users } from 'lucide-react';
import { SiteShell } from './Site';
import { useT } from '../../lib/i18n';
import { BRAND } from '../../lib/brand';

export default function Pricing() {
  const t = useT();
  const tiers = [
    { i: User, name: t('Individuals', 'الأفراد'), price: t('Mentor’s price', 'حسب المرشد'), sub: t('Typically $60–$400 / month', 'عادة 60–400 دولار شهريًا'), cta: t('Find a mentor', 'ابحث عن مرشد'), to: '/mentors', features: [t('Choose any vetted mentor', 'اختر أي مرشد معتمد'), t('7-day free trial on most plans', 'تجربة مجانية 7 أيام لمعظم الباقات'), t('Full development plan toolkit', 'أدوات خطة التطوير الكاملة'), t('Cancel anytime', 'إلغاء في أي وقت')] },
    { i: Users, name: t('Teams', 'الفرق'), price: t('Custom', 'حسب الطلب'), sub: t('From 5 mentees', 'ابتداءً من 5 متدربين'), cta: t('Contact us', 'تواصل معنا'), to: `mailto:${BRAND.email}`, featured: true, features: [t('Mentor matching for each employee', 'مطابقة مرشد لكل موظف'), t('Dedicated supervisor', 'مشرف مخصص'), t('Program dashboard & risk alerts', 'لوحة برنامج وتنبيهات تعثر'), t('Monthly impact reports', 'تقارير أثر شهرية'), t('One invoice', 'فاتورة موحدة')] },
    { i: Building2, name: t('Enterprise', 'المؤسسات'), price: t('Custom', 'حسب الطلب'), sub: t('Cohorts & internal mentors', 'دفعات ومرشدون داخليون'), cta: t('Book a demo', 'احجز عرضًا'), to: `mailto:${BRAND.email}`, features: [t('Use your own internal mentors', 'استخدم مرشديك الداخليين'), t('Program managers & cohorts', 'مديرو برامج ودفعات'), t('SSO & data export', 'دخول موحد وتصدير البيانات'), t('Learning provider integrations', 'تكامل مع مزودي التعلم')] },
  ];
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 start-1/4 w-[500px] h-[500px] rounded-full bg-orange-100/60 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-5 pt-20 pb-12 text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">{t('Pricing', 'الأسعار')}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-3 tracking-tight">{t('Simple, transparent pricing', 'أسعار واضحة وبسيطة')}</h1>
          <p className="text-lg text-slate-500 mt-4">{t('Mentors set their own prices. No subscription fee for mentees.', 'يحدد المرشدون أسعارهم بأنفسهم، ولا توجد رسوم اشتراك على المتدربين.')}</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 pb-20 grid md:grid-cols-3 gap-6 items-start">
        {tiers.map(({ i: I, name, price, sub, cta, to, features, featured }) => (
          <div key={name} className={`relative rounded-[2.5rem] p-8 ${featured ? 'bg-navy text-white shadow-2xl md:-translate-y-4' : 'bg-white border border-slate-100 shadow-sm'}`}>
            {featured && <span className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-black"><Sparkles size={12} />{t('Most popular', 'الأكثر طلبًا')}</span>}
            <span className={`w-12 h-12 rounded-2xl grid place-items-center ${featured ? 'bg-white/10 text-orange-400' : 'bg-indigo-50 text-indigo-600'}`}><I size={22} /></span>
            <h2 className="text-xl font-extrabold mt-5">{name}</h2>
            <p className="text-3xl font-black mt-2">{price}</p>
            <p className={`text-sm ${featured ? 'text-slate-300' : 'text-slate-400'}`}>{sub}</p>
            <ul className="mt-6 space-y-3">{features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />{f}</li>)}</ul>
            {to.startsWith('mailto') ? <a href={to} className={`mt-8 block text-center py-3.5 rounded-2xl font-bold ${featured ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{cta}</a>
              : <Link to={to} className={`mt-8 block text-center py-3.5 rounded-2xl font-bold ${featured ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{cta}</Link>}
          </div>
        ))}
      </section>
      <section className="max-w-4xl mx-auto px-5 pb-24">
        <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="text-5xl font-black text-indigo-600">{Math.round(BRAND.commissionRate * 100)}%</div>
          <div><h3 className="font-extrabold text-slate-900 text-lg">{t('For mentors: one simple commission', 'للمرشدين: عمولة واحدة بسيطة')}</h3><p className="text-slate-500 text-sm mt-1">{t('No listing fee. The platform keeps a commission on each successful payment to cover payments, tooling and support. The exact rate is configured by the admin.', 'لا توجد رسوم إدراج. تقتطع المنصة عمولة من كل دفعة ناجحة لتغطية الدفع والأدوات والدعم، ويحدد المسؤول النسبة الفعلية.')}</p></div>
        </div>
      </section>
    </SiteShell>
  );
}
