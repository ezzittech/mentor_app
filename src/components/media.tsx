import type { CSSProperties } from 'react';
import {
  Award, BarChart3, BookOpenCheck, CalendarClock, ClipboardList, Coins, Compass, FolderKanban, Gauge, Inbox, LayoutDashboard,
  ListChecks, MessagesSquare, Route, ScrollText, Settings2, ShieldCheck, Star, Tags, UserCog, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import { useLang } from '../lib/i18n';
import { BRAND } from '../lib/brand';
import { initials } from '../lib/format';

/** The mark: an "M" path climbing to a gold star — growth guided by a mentor. */
export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1f66c8" /><stop offset="1" stopColor="#0a2852" /></linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#bm)" />
      <path d="M14 46V22l18 15 18-15v24" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="14" r="5.5" fill="#e9a823" />
    </svg>
  );
}

export function BrandLockup({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const lang = useLang((s) => s.lang);
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className={`font-brand font-extrabold tracking-[0.12em] text-[17px] ${dark ? 'text-white' : 'text-indigo-800'}`}>{lang === 'ar' ? BRAND.name.ar : BRAND.name.en.toUpperCase()}</span>
        <span className="font-brand font-bold tracking-[0.28em] text-[10px] text-orange-500 mt-1">{lang === 'ar' ? 'MURSHID' : 'مُرشد'}</span>
      </span>
    </span>
  );
}

const GRADS = [
  ['#1f66c8', '#0a2852'], ['#e9a823', '#c2410c'], ['#0ea5e9', '#4338ca'], ['#10b981', '#0f766e'],
  ['#8b5cf6', '#be185d'], ['#f43f5e', '#9a3412'], ['#14b8a6', '#1d4ed8'], ['#f59e0b', '#b45309'],
];
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Avatar: photo if available, otherwise a deterministic gradient with initials. */
export function Avatar({ name, src, className = 'w-12 h-12 text-base', ring }: { name: string; src?: string | null; className?: string; ring?: boolean }) {
  const [a, b] = GRADS[hash(name || '?') % GRADS.length];
  const style: CSSProperties = { backgroundImage: `linear-gradient(135deg, ${a}, ${b})` };
  return src
    ? <img src={src} alt={name} className={`${className} rounded-full object-cover ${ring ? 'ring-4 ring-white' : ''}`} />
    : <span style={style} className={`${className} rounded-full inline-grid place-items-center text-white font-bold shrink-0 ${ring ? 'ring-4 ring-white' : ''}`} aria-label={name}>{initials(name)}</span>;
}

const ILLUS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, assessment: ClipboardList, plan: Route, tasks: ListChecks, sessions: CalendarClock, mentors: Users,
  payments: Wallet, messages: MessagesSquare, profile: UserCog, inbox: Inbox, reviews: BookOpenCheck, star: Star, earnings: Coins,
  gauge: Gauge, admin: BarChart3, shield: ShieldCheck, folder: FolderKanban, tags: Tags, settings: Settings2, audit: ScrollText,
  award: Award, compass: Compass,
};
/** Header illustration: brand-styled artwork around a lucide icon (inline SVG, no extra runtime). */
export function Illus({ name, className = '' }: { name: string; className?: string }) {
  const Icon = ILLUS[name] ?? Compass;
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden style={{ width: 'auto', height: '13rem' }}>
      <defs>
        <linearGradient id={`ig-${name}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1f66c8" /><stop offset="1" stopColor="#0a2852" /></linearGradient>
        <linearGradient id={`io-${name}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3c74d" /><stop offset="1" stopColor="#e9a823" /></linearGradient>
      </defs>
      <circle cx="200" cy="150" r="128" fill="#eef4fc" />
      <circle cx="318" cy="64" r="22" fill="#fbeec6" />
      <circle cx="78" cy="236" r="14" fill="#d9e6f8" />
      <rect x="120" y="78" width="160" height="150" rx="34" fill={`url(#ig-${name})`} />
      <rect x="150" y="226" width="100" height="14" rx="7" fill={`url(#io-${name})`} />
      <path d="M70 92 l10 -18 l10 18 z" fill="#e9a823" opacity=".8" />
      <rect x="300" y="200" width="26" height="26" rx="6" fill="#4a86d6" opacity=".35" transform="rotate(18 313 213)" />
      <path d="M96 150 q20 -30 40 0" stroke="#b3cdf0" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Icon x={160} y={113} width={80} height={80} color="#ffffff" strokeWidth={1.6} />
    </svg>
  );
}
