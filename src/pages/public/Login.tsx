import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, GraduationCap, Loader2, Lock, Mail, Presentation, ShieldCheck } from 'lucide-react';
import AuthShell, { authBtn, authInput } from './AuthShell';
import { DEMO_USERS, useAuth } from '../../lib/auth';
import { ROLE_HOME } from '../../lib/nav';
import { demoEnabled, hasSupabase, supabase } from '../../lib/supabase';
import { useT } from '../../lib/i18n';

export default function Login() {
  const t = useT();
  const signInDemo = useAuth((s) => s.signInDemo);
  const load = useAuth((s) => s.load);
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ROLES = [
    { key: 'mentee', label: t('Mentee', 'متدرب'), icon: GraduationCap, desc: t('Plan, tasks, sessions', 'الخطة والمهام والجلسات') },
    { key: 'mentor', label: t('Mentor', 'مرشد'), icon: Presentation, desc: t('Applications, mentees, reviews', 'الطلبات والمتدربون والمراجعات') },
    { key: 'supervisor', label: t('Supervisor', 'مشرف'), icon: Eye, desc: t('Follow-up & risk alerts', 'المتابعة وتنبيهات التعثر') },
    { key: 'admin', label: t('Admin', 'الإدارة'), icon: ShieldCheck, desc: t('Full platform control', 'تحكم كامل بالمنصة') },
  ] as const;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) { setError(t('Supabase is not connected yet — use a preview below.', 'لم يتم ربط Supabase بعد — استخدم المعاينة بالأسفل.')); return; }
    setError(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setBusy(false); setError(error.message === 'Invalid login credentials' ? t('Incorrect email or password.', 'البريد أو كلمة المرور غير صحيحة.') : error.message); return; }
    await load();
    const s = useAuth.getState();
    setBusy(false);
    nav(from ?? (s.user ? ROLE_HOME[s.active ?? s.user.roles[0]] : '/'));
  };

  return (
    <AuthShell>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{t('Welcome back 👋', 'أهلًا بعودتك 👋')}</h2>
      <p className="text-slate-500 mb-8">{t('Sign in to continue to your workspace.', 'سجّل الدخول للمتابعة إلى مساحة عملك.')}</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Email', 'البريد الإلكتروني')}</span>
          <div className={authInput}><Mail size={18} className="text-slate-400" /><input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" dir="ltr" className="flex-1 outline-none text-sm bg-transparent text-start" /></div>
        </label>
        <label className="block">
          <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Password', 'كلمة المرور')}</span>
            <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-orange-500">{t('Forgot password?', 'نسيت كلمة المرور؟')}</Link></div>
          <div className={authInput}><Lock size={18} className="text-slate-400" /><input required value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" className="flex-1 outline-none text-sm bg-transparent" /></div>
        </label>
        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
        <button disabled={busy} className={authBtn}>{busy ? <Loader2 className="animate-spin" size={18} /> : <>{t('Sign in', 'تسجيل الدخول')} <ArrowRight size={18} className="rtl:rotate-180" /></>}</button>
      </form>
      <p className="text-sm text-slate-500 text-center mt-6">{t('New here?', 'جديد على المنصة؟')} <Link to="/register" className="font-bold text-indigo-600 hover:text-orange-500">{t('Create an account', 'أنشئ حسابًا')}</Link></p>

      {demoEnabled && <>
        <div className="flex items-center gap-4 my-8"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">{t('Preview workspaces', 'معاينة مساحات العمل')}</span><div className="h-px flex-1 bg-slate-200" /></div>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ key, label, icon: Icon, desc }) => (
            <button key={key} onClick={() => { signInDemo(DEMO_USERS[key]); nav(ROLE_HOME[key]); }} className="text-start p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
              <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center mb-3 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors"><Icon size={20} /></span>
              <p className="font-bold text-slate-800 text-sm">{label}</p><p className="text-xs text-slate-400">{desc}</p>
            </button>
          ))}
        </div>
      </>}
    </AuthShell>
  );
}
