import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, CircleHelp, LogOut, Repeat } from 'lucide-react';
import { NAV, ROLE_HOME, ROLE_LABEL } from '../../lib/nav';
import { useAuth } from '../../lib/auth';
import { useLang, useT } from '../../lib/i18n';
import { Avatar, BrandMark } from '../media';

export default function Sidebar({ open, collapsed, onClose, onCollapse }: { open: boolean; collapsed: boolean; onClose: () => void; onCollapse: () => void }) {
  const user = useAuth((s) => s.user)!;
  const active = useAuth((s) => s.active) ?? user.roles[0];
  const setActive = useAuth((s) => s.setActive);
  const signOut = useAuth((s) => s.signOut);
  const lang = useLang((s) => s.lang);
  const t = useT();
  const nav = useNavigate();
  const groups = NAV[active];
  const mini = collapsed;

  return (
    <div className={`transition-all duration-300 ease-in-out h-screen sticky top-0 shrink-0 w-0 ${mini ? 'lg:w-24' : 'lg:w-72'}`}>
      <aside className={`fixed inset-y-0 start-0 z-50 bg-navy border-e border-white/5 text-gray-300 transform transition-all duration-300 ease-in-out ${mini ? 'lg:w-24' : 'lg:w-72'} w-72 ${open ? 'translate-x-0' : 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'}`}>
        <div className="flex flex-col h-screen">
          <div className={`p-6 shrink-0 flex items-start ${mini ? 'flex-col items-center gap-3' : 'justify-between'}`}>
            <button className="group flex flex-col items-start" onClick={() => nav('/')} aria-label="Home">
              <BrandMark className="h-10 w-10 mb-2" />
              {!mini && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">{ROLE_LABEL[active][lang]}</span>}
            </button>
            <button onClick={onCollapse} className="hidden lg:flex items-center justify-center rounded-lg text-gray-400 bg-white/5 hover:text-white hover:bg-white/10 transition-all border border-white/5 w-8 h-8 mt-1" title={t('Collapse sidebar', 'طي القائمة')}>
              <ChevronLeft size={18} className={`transition-transform ${mini ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'}`} />
            </button>
          </div>

          {user.roles.length > 1 && (
            <div className={`px-4 pb-4 shrink-0 ${mini ? 'hidden' : ''}`}>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                <Repeat size={14} className="text-orange-400 shrink-0" />
                <select value={active} onChange={(e) => { const r = e.target.value as typeof active; setActive(r); nav(ROLE_HOME[r]); }} className="flex-1 bg-transparent text-white font-semibold outline-none [&>option]:text-slate-900" aria-label={t('Switch workspace', 'تبديل مساحة العمل')}>
                  {user.roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r][lang]}</option>)}
                </select>
              </label>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto min-h-0 px-4 space-y-6 sidebar-scrollbar pb-4">
            {groups.map((g) => (
              <div key={g.en}>
                {!mini && <p className="px-4 pb-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{g[lang]}</p>}
                <div className="space-y-1">
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} title={mini ? item[lang] : undefined}
                        className={({ isActive }) => `relative w-full flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${mini ? 'justify-center px-0' : 'px-4'} ${isActive ? 'bg-orange-500/10 text-orange-500' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        {({ isActive }) => <>
                          {isActive && <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-e-full shadow-[0_0_8px_#e9a823]" />}
                          <span className={isActive ? 'text-orange-500' : 'text-gray-500 group-hover:text-white'}><Icon size={20} /></span>
                          {!mini && <span className="flex-1 text-start">{item[lang]}</span>}
                        </>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5 bg-navy-2/50 shrink-0">
            <div className="flex flex-col gap-3">
              {!mini && <button onClick={() => nav('/how-it-works')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-200 border border-indigo-500/10 transition-all px-4">
                <CircleHelp size={16} /><span>{t('Help & guide', 'المساعدة والدليل')}</span>
              </button>}
              <div className={`flex items-center gap-3 py-2 rounded-lg px-2 ${mini ? 'justify-center' : ''}`}>
                <Avatar name={user.name} className="w-9 h-9 text-xs" />
                {!mini && <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{user.name}</p><p className="text-xs text-gray-500 truncate">{user.email}</p></div>}
              </div>
              <button onClick={async () => { await signOut(); nav('/login'); }} title={t('Sign out', 'تسجيل الخروج')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide text-white/70 bg-red-500/10 hover:bg-red-500/20 hover:text-red-400 border border-red-500/10 transition-all px-4">
                <LogOut size={16} className="rtl:rotate-180" />{!mini && <span>{t('Sign out', 'تسجيل الخروج')}</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
    </div>
  );
}
