import { useEffect, useState } from 'react';
import { Loader2, Save, UserPlus } from 'lucide-react';
import { Card, Field, Page, PageHero, Spinner, act, btnGhost, btnPrimary, inputCls } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../lib/auth';
import { useLang, useT } from '../../lib/i18n';
import { ROLE_LABEL } from '../../lib/nav';
import { browserTz } from '../../lib/format';

const TZS = (() => { try { return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone'); } catch { return ['UTC', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuala_Lumpur', 'Africa/Cairo', 'Europe/London']; } })();

export default function Account() {
  const t = useT();
  const { lang, setLang } = useLang();
  const user = useAuth((s) => s.user)!;
  const q = useAsync(api.myProfileRow);
  const [f, setF] = useState({ full_name: '', headline: '', country: '', timezone: browserTz(), locale: lang as string, bio: '', phone: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { const p = q.data; if (p) setF({ full_name: p.full_name ?? '', headline: p.headline ?? '', country: p.country ?? '', timezone: p.timezone || browserTz(), locale: p.locale || lang, bio: p.bio ?? '', phone: p.phone ?? '' }); }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (q.loading) return <Page><Spinner /></Page>;
  return (
    <Page>
      <PageHero badge={t('Account', 'الحساب')} badgeColor="slate" title={t('Account settings', 'إعدادات الحساب')} subtitle={t('Your name, language, time zone and contact details.', 'اسمك ولغتك ومنطقتك الزمنية وبيانات التواصل.')} illus="profile">
        <div className="flex flex-wrap gap-2">{user.roles.map((r) => <span key={r} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">{ROLE_LABEL[r][lang]}</span>)}</div>
      </PageHero>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <Card title={t('Profile', 'الملف الشخصي')}>
          <form className="grid sm:grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); if (await act(() => api.updateMyProfile(f), t('Saved', 'تم الحفظ'))) { setLang(f.locale as 'ar' | 'en'); useAuth.getState().load(); } setBusy(false); }}>
            <Field label={t('Full name', 'الاسم الكامل')}><input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className={inputCls} /></Field>
            <Field label={t('Email', 'البريد')}><input disabled value={user.email} className={`${inputCls} opacity-60`} dir="ltr" /></Field>
            <Field label={t('Headline', 'المسمى / النبذة القصيرة')} className="sm:col-span-2"><input value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} className={inputCls} /></Field>
            <Field label={t('Country', 'الدولة')}><input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} className={inputCls} /></Field>
            <Field label={t('Phone', 'الهاتف')}><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputCls} dir="ltr" /></Field>
            <Field label={t('Time zone (IANA)', 'المنطقة الزمنية')}><select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} className={inputCls}>{TZS.map((z) => <option key={z}>{z}</option>)}</select></Field>
            <Field label={t('Language', 'اللغة')}><select value={f.locale} onChange={(e) => setF({ ...f, locale: e.target.value })} className={inputCls}><option value="ar">العربية</option><option value="en">English</option></select></Field>
            <Field label={t('About you', 'نبذة عنك')} className="sm:col-span-2"><textarea rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className={inputCls} /></Field>
            <div className="sm:col-span-2 flex justify-end"><button disabled={busy} className={btnPrimary}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{t('Save changes', 'حفظ التغييرات')}</button></div>
          </form>
        </Card>
        {!user.roles.includes('mentor') && (
          <Card title={t('Become a mentor', 'كن مرشدًا')}>
            <p className="text-sm text-slate-500 mb-4">{t('Add the mentor role to this account. Your mentor profile will be reviewed before it is published.', 'أضف دور المرشد إلى حسابك، وستتم مراجعة ملفك قبل نشره.')}</p>
            <button onClick={async () => { if (await act(api.becomeMentor, t('Mentor workspace enabled', 'تم تفعيل مساحة المرشد'))) { await useAuth.getState().load(); useAuth.getState().setActive('mentor'); location.assign(`${import.meta.env.BASE_URL}app/mentor/profile`); } }} className={btnGhost}><UserPlus size={16} />{t('Apply as mentor', 'التقديم كمرشد')}</button>
          </Card>
        )}
      </div>
    </Page>
  );
}
