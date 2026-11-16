import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, GraduationCap, Loader2, Lock, Mail, MailCheck, Presentation, User } from 'lucide-react';
import AuthShell, { authBtn, authInput } from './AuthShell';
import { hasSupabase, supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useLang, useT } from '../../lib/i18n';
import { browserTz } from '../../lib/format';
import { ROLE_HOME } from '../../lib/nav';

export default function Register() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [sp] = useSearchParams();
  const [intent, setIntent] = useState<'mentee' | 'mentor'>(sp.get('as') === 'mentor' ? 'mentor' : 'mentee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) { setError(t('Supabase is not connected yet. See docs/SUPABASE_SETUP.md.', 'لم يتم ربط Supabase بعد. راجع docs/SUPABASE_SETUP.md.')); return; }
    setError(''); setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name, intent, timezone: browserTz(), locale: lang }, emailRedirectTo: `${location.origin}${import.meta.env.BASE_URL}login` },
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      await useAuth.getState().load();
      const s = useAuth.getState();
      nav(intent === 'mentor' ? '/app/mentor/profile' : from ?? (s.user ? ROLE_HOME[s.active ?? s.user.roles[0]] : '/app'));
    } else setSent(true);
  };

  if (sent) return (
    <AuthShell>
      <div className="text-center"><span className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mb-5"><MailCheck size={30} /></span>
        <h2 className="text-2xl font-extrabold text-slate-900">{t('Check your inbox', 'تحقق من بريدك')}</h2>
        <p className="text-slate-500 mt-2">{t(`We sent a confirmation link to ${email}.`, `أرسلنا رابط التأكيد إلى ${email}.`)}</p>
        <Link to="/login" className={`${authBtn} mt-8`}>{t('Go to sign in', 'الذهاب لتسجيل الدخول')}</Link></div>
    </AuthShell>
  );

  return (
    <AuthShell>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{t('Create your account', 'أنشئ حسابك')}</h2>
      <p className="text-slate-500 mb-6">{t('Free forever for mentees. It takes a minute.', 'مجاني للمتدربين، ويستغرق دقيقة واحدة.')}</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {([['mentee', GraduationCap, t('I want a mentor', 'أبحث عن مرشد')], ['mentor', Presentation, t('I want to mentor', 'أريد أن أكون مرشدًا')]] as const).map(([k, I, l]) => (
          <button type="button" key={k} onClick={() => setIntent(k)} className={`p-4 rounded-2xl border-2 text-start transition-all ${intent === k ? 'border-indigo-600 bg-indigo-50/60' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
            <I size={22} className={intent === k ? 'text-indigo-600' : 'text-slate-400'} /><p className="font-bold text-sm text-slate-800 mt-2">{l}</p>
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Full name', 'الاسم الكامل')}</span>
          <div className={authInput}><User size={18} className="text-slate-400" /><input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="flex-1 outline-none text-sm bg-transparent" /></div></label>
        <label className="block"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Email', 'البريد الإلكتروني')}</span>
          <div className={authInput}><Mail size={18} className="text-slate-400" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" dir="ltr" className="flex-1 outline-none text-sm bg-transparent text-start" /></div></label>
        <label className="block"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Password', 'كلمة المرور')}</span>
          <div className={authInput}><Lock size={18} className="text-slate-400" /><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder={t('At least 8 characters', '8 أحرف على الأقل')} className="flex-1 outline-none text-sm bg-transparent" /></div></label>
        {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
        <button disabled={busy} className={authBtn}>{busy ? <Loader2 className="animate-spin" size={18} /> : <>{t('Create account', 'إنشاء الحساب')} <ArrowRight size={18} className="rtl:rotate-180" /></>}</button>
        <p className="text-[11px] text-slate-400 text-center">{t(`Time zone detected: ${browserTz()}`, `المنطقة الزمنية: ${browserTz()}`)}</p>
      </form>
      <p className="text-sm text-slate-500 text-center mt-6">{t('Already have an account?', 'لديك حساب؟')} <Link to="/login" className="font-bold text-indigo-600 hover:text-orange-500">{t('Sign in', 'سجّل الدخول')}</Link></p>
    </AuthShell>
  );
}
