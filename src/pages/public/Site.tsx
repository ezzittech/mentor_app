import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Mail, Menu, MessageCircle, X } from 'lucide-react';
import { BrandLockup } from '../../components/media';
import { LangToggle } from '../../components/layout/PortalLayout';
import { useAuth } from '../../lib/auth';
import { ROLE_HOME } from '../../lib/nav';
import { useLang, useT } from '../../lib/i18n';
import { BRAND } from '../../lib/brand';

function useLinks() {
  const t = useT();
  return [
    { to: '/mentors', label: t('Find a mentor', 'ابحث عن مرشد') },
    { to: '/how-it-works', label: t('How it works', 'كيف تعمل المنصة') },
    { to: '/pricing', label: t('Pricing & teams', 'الأسعار والفرق') },
    { to: '/become-a-mentor', label: t('Become a mentor', 'كن مرشدًا') },
  ];
}

export function SiteNav() {
  const user = useAuth((s) => s.user);
  const active = useAuth((s) => s.active);
  const t = useT();
  const links = useLinks();
  const [open, setOpen] = useState(false);
  const portal = user ? ROLE_HOME[active ?? user.roles[0]] : '/login';
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between gap-6">
        <Link to="/" aria-label="Home"><BrandLockup /></Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'text-orange-600 bg-orange-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <LangToggle />
          {user ? <Link to={portal} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-200">{t('My workspace', 'مساحتي')}</Link> : <>
            <Link to="/login" className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">{t('Sign in', 'دخول')}</Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-200">{t('Get started', 'ابدأ الآن')}</Link>
          </>}
        </div>
        <div className="lg:hidden flex items-center gap-2"><LangToggle /><button onClick={() => setOpen(!open)} className="p-2 rounded-xl border border-slate-200" aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button></div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-1 animate__animated animate__fadeIn animate__faster">
          {links.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">{l.label}</Link>)}
          <div className="grid grid-cols-2 gap-2 pt-3">
            {user ? <Link to={portal} className="col-span-2 text-center py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold">{t('My workspace', 'مساحتي')}</Link> : <>
              <Link to="/login" className="text-center py-3 rounded-xl border border-slate-200 text-sm font-bold">{t('Sign in', 'دخول')}</Link>
              <Link to="/register" className="text-center py-3 rounded-xl bg-orange-500 text-white text-sm font-bold">{t('Get started', 'ابدأ الآن')}</Link></>}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const links = useLinks();
  return (
    <footer className="bg-navy text-slate-300">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <BrandLockup dark />
          <p className="mt-5 text-sm leading-relaxed max-w-sm text-slate-400">{t('Find the right mentor, build a personal development plan and track real progress — all in one place.', 'اعثر على المرشد المناسب، وابنِ خطة تطوير شخصية، وتابع تقدمك الحقيقي — كل ذلك في مكان واحد.')} {BRAND.tagline[lang]}.</p>
          <div className="flex gap-2 mt-5">
            <a href={`mailto:${BRAND.email}`} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-orange-500 grid place-items-center transition-colors" aria-label="Email"><Mail size={18} /></a>
            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500 grid place-items-center transition-colors" aria-label="WhatsApp"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white mb-4">{t('Explore', 'استكشف')}</p>
          <ul className="space-y-2 text-sm">{links.map((l) => <li key={l.to}><Link to={l.to} className="hover:text-orange-400">{l.label}</Link></li>)}</ul>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white mb-4">{t('Account', 'الحساب')}</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-orange-400">{t('Sign in', 'تسجيل الدخول')}</Link></li>
            <li><Link to="/register" className="hover:text-orange-400">{t('Create account', 'إنشاء حساب')}</Link></li>
            <li><Link to="/register?as=mentor" className="hover:text-orange-400">{t('Apply as mentor', 'التقديم كمرشد')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} {BRAND.name[lang]}. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}</div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#fafafa] flex flex-col"><SiteNav /><main className="flex-1">{children}</main><SiteFooter /></div>;
}

export function SectionTitle({ kicker, title, sub, center }: { kicker: string; title: ReactNode; sub?: string; center?: boolean }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto mb-14' : 'mb-10'}>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">{kicker}</p>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">{title}</h2>
      {sub && <p className="text-slate-500 mt-3">{sub}</p>}
    </div>
  );
}
