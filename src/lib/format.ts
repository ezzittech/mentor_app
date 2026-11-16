import { useLang } from './i18n';

const loc = () => (useLang.getState().lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB');

export const money = (n: number | string, cur = 'USD') =>
  // always LTR-friendly "$180" / "SAR 500" so prices read the same in Arabic and English
  '\u2066' + new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(Number(n) || 0) + '\u2069';
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (d?: string | null, tz?: string) =>
  d ? new Date(d).toLocaleString(loc(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: tz || undefined }) : '—';
export const fmtTime = (d: string) => new Date(d).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' });
export const ago = (d: string) => {
  const ar = useLang.getState().lang === 'ar';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return ar ? 'الآن' : 'just now';
  if (s < 3600) return ar ? `منذ ${Math.floor(s / 60)} د` : `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return ar ? `منذ ${Math.floor(s / 3600)} س` : `${Math.floor(s / 3600)} h ago`;
  return fmtDate(d);
};
export const daysUntil = (d?: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);
export const initials = (name: string) => (name || 'U').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
/** URL slug: latin letters, digits and dashes only (matches the DB check). Arabic-only names fall back to "mentor-xxxx". */
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const mentorSlug = (name: string) => slugify(name) || `mentor-${Math.random().toString(36).slice(2, 8)}`;
export const browserTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
