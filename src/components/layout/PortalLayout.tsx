import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, ChevronRight, Globe, Home, LogOut, Menu, UserCog } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../lib/auth';
import { useLang, useT } from '../../lib/i18n';
import { NAV, ROLE_HOME, ROLE_LABEL } from '../../lib/nav';
import { Avatar, BrandLockup } from '../media';
import { DemoNotice, Spinner } from '../ui';
import { listNotifications, markNotification } from '../../lib/api';
import { ago } from '../../lib/format';
import type { Notification } from '../../lib/types';

export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors ${dark ? 'border-white/10 text-white/80 hover:bg-white/10' : 'text-slate-600 hover:text-orange-500 bg-slate-50 hover:bg-orange-50 border-slate-200'}`} aria-label="Switch language">
      <Globe size={16} /> {lang === 'ar' ? 'English' : 'العربية'}
    </button>
  );
}

function Notifications() {
  const t = useT();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const [list, setList] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const load = () => listNotifications().then(setList).catch(() => {});
  useEffect(() => { load(); const i = setInterval(load, 60000); return () => clearInterval(i); }, [user?.id]);
  useEffect(() => { const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false); document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const unread = list.filter((n) => !n.read).length;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label={t('Notifications', 'الإشعارات')} className="relative p-2.5 text-slate-600 hover:text-orange-500 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all">
        <Bell size={20} />
        {unread > 0 && <span className="absolute -top-1 -end-1 bg-orange-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-bold">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 mt-3 w-[340px] max-w-[90vw] bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden z-50 animate__animated animate__fadeIn animate__faster">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><p className="font-extrabold text-slate-900">{t('Notifications', 'الإشعارات')}</p>
            {unread > 0 && <button onClick={async () => { await markNotification('all'); load(); }} className="text-xs font-bold text-indigo-600 flex items-center gap-1"><CheckCheck size={14} />{t('Mark all read', 'تحديد الكل كمقروء')}</button>}</div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {!list.length ? <p className="p-8 text-center text-sm text-slate-400">{t('You are all caught up.', 'لا توجد إشعارات جديدة.')}</p> : list.map((n) => (
              <button key={n.id} className={`w-full text-start flex gap-3 px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50 ${n.read ? '' : 'bg-orange-50/40'}`}
                onClick={async () => { await markNotification(n.id); setOpen(false); load(); if (n.link) nav(n.link); }}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-orange-500'}`} />
                <span className="flex-1 min-w-0"><span className="block text-sm font-bold text-slate-800">{n.title}</span>{n.body && <span className="block text-xs text-slate-500 line-clamp-2">{n.body}</span>}<span className="block text-[10px] text-slate-400 mt-1">{ago(n.created_at)}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const user = useAuth((s) => s.user)!;
  const active = useAuth((s) => s.active) ?? user.roles[0];
  const signOut = useAuth((s) => s.signOut);
  const lang = useLang((s) => s.lang);
  const t = useT();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false); document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 ps-1.5 pe-1.5 sm:pe-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all group">
        <span className="relative"><Avatar name={user.name} className="h-9 w-9 text-sm" /><span className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" /></span>
        <span className="text-start hidden sm:block">
          <span className="block text-xs font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{user.name}</span>
          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">{ROLE_LABEL[active][lang]}</span>
        </span>
        <ChevronDown size={14} className={`text-gray-300 hidden sm:block transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute end-0 mt-3 w-56 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 z-50 animate__animated animate__fadeIn animate__faster">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><Home size={16} />{t('Public website', 'الموقع العام')}</Link>
          <Link to="/app/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><UserCog size={16} />{t('Account settings', 'إعدادات الحساب')}</Link>
          <button onClick={async () => { await signOut(); nav('/login'); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50"><LogOut size={16} className="rtl:rotate-180" />{t('Sign out', 'تسجيل الخروج')}</button>
        </div>
      )}
    </div>
  );
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const user = useAuth((s) => s.user)!;
  const active = useAuth((s) => s.active) ?? user.roles[0];
  const lang = useLang((s) => s.lang);
  const items = NAV[active].flatMap((g) => g.items);
  const hit = [...items].sort((a, b) => b.to.length - a.to.length).find((i) => pathname.startsWith(i.to));
  if (!hit || hit.to === ROLE_HOME[active]) return null;
  const deeper = pathname !== hit.to;
  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 -mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
      <Link to={ROLE_HOME[active]} className="hover:text-orange-500">{ROLE_LABEL[active][lang]}</Link>
      <ChevronRight size={12} className="rtl:rotate-180" />
      {deeper ? <Link to={hit.to} className="hover:text-orange-500">{hit[lang]}</Link> : <span className="text-slate-600">{hit[lang]}</span>}
      {deeper && <><ChevronRight size={12} className="rtl:rotate-180" /><span className="text-slate-600">{lang === 'ar' ? 'التفاصيل' : 'Details'}</span></>}
    </nav>
  );
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('murshid-sb') === '1'; } catch { return false; } });
  const user = useAuth((s) => s.user)!;
  const active = useAuth((s) => s.active) ?? user.roles[0];
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem('murshid-sb', c ? '0' : '1'); } catch { /* ignore */ } return !c; });
  return (
    <div className="flex min-h-screen w-full bg-[#fafafa] font-sans">
      <Sidebar open={open} collapsed={collapsed} onClose={() => setOpen(false)} onCollapse={toggle} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 px-4 sm:px-6 py-4 lg:px-10 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600" aria-label="Menu"><Menu size={20} /></button>
            <Link to={ROLE_HOME[active]} className="hidden sm:flex"><BrandLockup /></Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <LangToggle />
            <Notifications />
            <ProfileMenu />
          </div>
        </header>
        <Breadcrumbs />
        {user.demo && <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 -mb-6"><DemoNotice /></div>}
        <Suspense fallback={<Spinner />}><div key={pathname} className="animate__animated animate__fadeIn animate__faster">{children}</div></Suspense>
      </div>
    </div>
  );
}
