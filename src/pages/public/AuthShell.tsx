import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { BrandLockup } from '../../components/media';
import { LangToggle } from '../../components/layout/PortalLayout';
import { useT } from '../../lib/i18n';

export default function AuthShell({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="min-h-screen bg-[#fafafa] grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-navy text-white p-14 flex-col justify-between">
        <div className="absolute inset-0 grid-dots opacity-20" />
        <div className="absolute -end-24 -top-24 w-96 h-96 rounded-full bg-indigo-500/20" />
        <div className="absolute -start-20 bottom-10 w-72 h-72 rounded-full bg-orange-500/10" />
        <Link to="/" className="relative"><BrandLockup dark /></Link>
        <div className="relative">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-orange-300 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {t('Mentorship platform', 'منصة الإرشاد')}
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-4">{t('Your growth,', 'تطورك،')}<br /><span className="text-orange-400">{t('guided by experts', 'بإرشاد الخبراء')}</span></h1>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed">{t('One place for mentees, mentors, supervisors and administrators.', 'مكان واحد للمتدربين والمرشدين والمشرفين والإدارة.')}</p>
          <ul className="mt-8 space-y-3 text-slate-300">{[t('Personal development plans', 'خطط تطوير شخصية'), t('Tasks with real feedback', 'مهام مع تغذية راجعة حقيقية'), t('Progress you can measure', 'تقدم يمكنك قياسه')].map((x) => <li key={x} className="flex items-center gap-2"><CircleCheck size={18} className="text-emerald-400" />{x}</li>)}</ul>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()}</p>
      </div>
      <div className="flex flex-col p-6 sm:p-12">
        <div className="flex justify-between items-center"><Link to="/" className="lg:invisible"><BrandLockup /></Link><LangToggle /></div>
        <div className="flex-1 flex items-center justify-center py-10"><div className="w-full max-w-md animate__animated animate__fadeIn">{children}</div></div>
      </div>
    </div>
  );
}

export const authInput = 'mt-2 flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50';
export const authBtn = 'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-60';
