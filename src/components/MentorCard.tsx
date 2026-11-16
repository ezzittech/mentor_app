import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Boxes, BrainCircuit, Briefcase, Clock, Code2, Crown, Languages, Megaphone, PenTool, Rocket, Sparkles, Star,
  TrendingUp, Users, type LucideIcon,
} from 'lucide-react';
import { Avatar } from './media';
import { minPrice } from '../lib/api';
import { money } from '../lib/format';
import { useLang, useT } from '../lib/i18n';
import type { Mentor } from '../lib/types';

export const CAT_ICON: Record<string, LucideIcon> = { Code2, BrainCircuit, Boxes, PenTool, Crown, TrendingUp, Megaphone, Rocket, Briefcase };
export const LANG_NAME: Record<string, { en: string; ar: string }> = {
  ar: { en: 'Arabic', ar: 'العربية' }, en: { en: 'English', ar: 'الإنجليزية' }, fr: { en: 'French', ar: 'الفرنسية' },
  ur: { en: 'Urdu', ar: 'الأردية' }, ms: { en: 'Malay', ar: 'الملايوية' }, tr: { en: 'Turkish', ar: 'التركية' }, es: { en: 'Spanish', ar: 'الإسبانية' },
};

export function MentorCard({ m }: { m: Mentor }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const price = minPrice(m);
  const full = !m.accepting || m.spots_left <= 0;
  return (
    <Link to={`/mentors/${m.slug}`} className="group relative bg-white rounded-4xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      <div className="relative h-24 bg-gradient-to-br from-indigo-600 via-indigo-800 to-navy overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-30" />
        <div className="absolute -end-6 -top-10 w-32 h-32 rounded-full bg-orange-400/30 blur-xl group-hover:scale-125 transition-transform duration-700" />
        {m.featured && <span className="absolute top-4 start-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider border border-white/20"><Sparkles size={12} className="text-orange-300" />{t('Top mentor', 'مرشد مميز')}</span>}
        <span className={`absolute top-4 end-4 px-2.5 py-1 rounded-full text-[10px] font-black ${full ? 'bg-slate-900/40 text-white/80' : 'bg-emerald-400/90 text-emerald-950'}`}>
          {full ? t('Fully booked', 'مكتمل العدد') : m.spots_left === 1 ? t('1 spot left', 'مقعد واحد متبقٍ') : t(`${m.spots_left} spots left`, `${m.spots_left} مقاعد متاحة`)}
        </span>
      </div>
      <div className="relative z-10 px-6 -mt-10 flex items-end justify-between">
        <Avatar name={m.full_name} src={m.avatar_url} className="w-20 h-20 text-2xl" ring />
        <span className="flex items-center gap-1 text-sm font-black text-slate-800 mb-1"><Star size={16} className="fill-orange-400 text-orange-400" />{m.rating_avg.toFixed(1)}<span className="text-slate-400 font-semibold text-xs">({m.reviews_count})</span></span>
      </div>
      <div className="px-6 pt-3 pb-6 flex-1 flex flex-col">
        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-700 flex items-center gap-1.5">{m.full_name}<BadgeCheck size={18} className="text-indigo-500" /></h3>
        <p className="text-xs font-bold text-orange-600">{m.job_title}{m.company && <span className="text-slate-400"> · {m.company}</span>}</p>
        <p className="text-sm text-slate-500 mt-2 line-clamp-2 flex-1">{m.headline}</p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {m.skills.slice(0, 3).map((s) => <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-600">{s}</span>)}
          {m.skills.length > 3 && <span className="px-2 py-1 text-[11px] font-semibold text-slate-400">+{m.skills.length - 3}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[11px] font-semibold text-slate-400 [&>span]:whitespace-nowrap">
          <span className="flex items-center gap-1"><Users size={13} />{m.mentees_count} {t('mentees', 'متدرب')}</span>
          <span className="flex items-center gap-1"><Clock size={13} />{t(`replies in ${m.response_hours}h`, `يرد خلال ${m.response_hours} س`)}</span>
          <span className="flex items-center gap-1"><Languages size={13} />{m.languages.map((l) => LANG_NAME[l]?.[lang] ?? l).slice(0, 2).join('، ')}</span>
        </div>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
          <span>{Number.isFinite(price) ? <><span className="text-[11px] text-slate-400 font-semibold">{t('from', 'يبدأ من')} </span><span className="font-black text-slate-900 text-lg">{money(price)}</span><span className="text-xs text-slate-400">/{t('month', 'شهر')}</span></> : <span className="text-sm text-slate-400">—</span>}</span>
          <span className="text-xs font-black uppercase text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">{t('View profile', 'عرض الملف')}<ArrowRight size={14} className="rtl:rotate-180" /></span>
        </div>
      </div>
    </Link>
  );
}
