import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Lock, Mail, MailCheck } from 'lucide-react';
import AuthShell, { authBtn, authInput } from './AuthShell';
import { hasSupabase, supabase } from '../../lib/supabase';
import { useT } from '../../lib/i18n';
import { toast } from '../../components/ui';

export function ForgotPassword() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!hasSupabase) return toast.err('Supabase not connected');
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}${import.meta.env.BASE_URL}reset-password` });
    setBusy(false);
    if (error) toast.err(error.message); else setSent(true);
  };
  return (
    <AuthShell>
      {sent ? <div className="text-center"><span className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mb-5"><MailCheck size={30} /></span><h2 className="text-2xl font-extrabold">{t('Check your email', 'تحقق من بريدك')}</h2><p className="text-slate-500 mt-2">{t('We sent you a link to reset your password.', 'أرسلنا لك رابطًا لإعادة تعيين كلمة المرور.')}</p></div> : <>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{t('Forgot password?', 'نسيت كلمة المرور؟')}</h2>
        <p className="text-slate-500 mb-8">{t('Enter your email and we’ll send you a reset link.', 'أدخل بريدك وسنرسل لك رابط إعادة التعيين.')}</p>
        <form onSubmit={submit} className="space-y-4">
          <div className={authInput}><Mail size={18} className="text-slate-400" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="flex-1 outline-none text-sm bg-transparent text-start" placeholder="you@example.com" /></div>
          <button disabled={busy} className={authBtn}>{busy ? <Loader2 className="animate-spin" size={18} /> : <>{t('Send reset link', 'إرسال الرابط')}<ArrowRight size={18} className="rtl:rotate-180" /></>}</button>
        </form></>}
      <p className="text-sm text-center mt-6"><Link to="/login" className="font-bold text-indigo-600">{t('Back to sign in', 'العودة لتسجيل الدخول')}</Link></p>
    </AuthShell>
  );
}

export function ResetPassword() {
  const t = useT();
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.err(error.message); else { toast.ok(t('Password updated', 'تم تحديث كلمة المرور')); nav('/app'); }
  };
  return (
    <AuthShell>
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">{t('Set a new password', 'تعيين كلمة مرور جديدة')}</h2>
      <form onSubmit={submit} className="space-y-4">
        <div className={authInput}><Lock size={18} className="text-slate-400" /><input required minLength={8} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className="flex-1 outline-none text-sm bg-transparent" /></div>
        <button disabled={busy} className={authBtn}>{busy ? <Loader2 className="animate-spin" size={18} /> : t('Save password', 'حفظ كلمة المرور')}</button>
      </form>
    </AuthShell>
  );
}
