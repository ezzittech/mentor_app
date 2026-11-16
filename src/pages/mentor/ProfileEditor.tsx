import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Loader2, Pencil, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { Card, Confirm, Field, Modal, Page, PageHero, Spinner, StatusPill, act, btnAccent, btnGhost, btnPrimary, btnSm, inputCls } from '../../components/ui';
import { LANG_NAME } from '../../components/MentorCard';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../lib/auth';
import { mentorSlug, money, slugify } from '../../lib/format';
import { useLang, useT } from '../../lib/i18n';
import type { Mentor, Package } from '../../lib/types';

function PackageForm({ pkg, onClose, onSaved }: { pkg?: Package; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const [p, setP] = useState<Partial<Package>>(pkg ?? { billing: 'monthly', currency: 'USD', calls_per_month: 2, call_minutes: 45, chat_support: true, response_hours: 24, features: [], trial_days: 7, is_active: true });
  const [feat, setFeat] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={pkg ? t('Edit plan', 'تعديل الباقة') : t('New plan', 'باقة جديدة')} wide>
      <form className="grid sm:grid-cols-2 gap-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); if (await act(() => api.savePackage(p), t('Plan saved', 'تم حفظ الباقة'))) { onSaved(); onClose(); } setBusy(false); }}>
        <Field label={t('Name *', 'الاسم *')}><input required value={p.name ?? ''} onChange={(e) => setP({ ...p, name: e.target.value })} className={inputCls} placeholder="Standard" /></Field>
        <Field label={t('Type', 'النوع')}><select value={p.billing} onChange={(e) => setP({ ...p, billing: e.target.value as Package['billing'] })} className={inputCls}><option value="monthly">{t('Monthly subscription', 'اشتراك شهري')}</option><option value="one_off">{t('Single session', 'جلسة واحدة')}</option></select></Field>
        <Field label={t('Price', 'السعر')}><input required type="number" min={0} value={p.price ?? ''} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} className={inputCls} /></Field>
        <Field label={t('Currency', 'العملة')}><select value={p.currency} onChange={(e) => setP({ ...p, currency: e.target.value })} className={inputCls}>{['USD', 'SAR', 'AED', 'MYR', 'EGP', 'EUR'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        {p.billing === 'monthly' && <Field label={t('Calls per month', 'مكالمات شهريًا')}><input type="number" min={0} value={p.calls_per_month ?? 0} onChange={(e) => setP({ ...p, calls_per_month: Number(e.target.value) })} className={inputCls} /></Field>}
        <Field label={t('Call length (min)', 'مدة المكالمة (دقيقة)')}><input type="number" min={15} step={15} value={p.call_minutes ?? 45} onChange={(e) => setP({ ...p, call_minutes: Number(e.target.value) })} className={inputCls} /></Field>
        <Field label={t('Chat response time (h)', 'وقت الرد على المحادثة (ساعة)')}><input type="number" min={1} value={p.response_hours ?? 24} onChange={(e) => setP({ ...p, response_hours: Number(e.target.value) })} className={inputCls} /></Field>
        <Field label={t('Free trial (days)', 'التجربة المجانية (أيام)')}><input type="number" min={0} max={14} value={p.trial_days ?? 0} onChange={(e) => setP({ ...p, trial_days: Number(e.target.value) })} className={inputCls} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={!!p.chat_support} onChange={(e) => setP({ ...p, chat_support: e.target.checked })} className="accent-indigo-600 w-4 h-4" />{t('Includes chat between sessions', 'يشمل المحادثة بين الجلسات')}</label>
        <Field label={t('Features', 'المزايا')} className="sm:col-span-2">
          <div className="flex gap-2"><input value={feat} onChange={(e) => setFeat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (feat.trim()) { setP({ ...p, features: [...(p.features ?? []), feat.trim()] }); setFeat(''); } } }} className={inputCls} placeholder={t('Type and press Enter', 'اكتب واضغط Enter')} /></div>
          <div className="flex flex-wrap gap-2 mt-2">{(p.features ?? []).map((f, i) => <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">{f}<button type="button" onClick={() => setP({ ...p, features: p.features!.filter((_, j) => j !== i) })}><X size={12} /></button></span>)}</div>
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnGhost}>{t('Cancel', 'إلغاء')}</button><button disabled={busy} className={btnPrimary}>{t('Save', 'حفظ')}</button></div>
      </form>
    </Modal>
  );
}

export default function ProfileEditor() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const user = useAuth((s) => s.user)!;
  const q = useAsync(async () => ({ m: await api.myMentorProfile(), cats: await api.listCategories(), skills: await api.listSkills() }));
  const [m, setM] = useState<Partial<Mentor>>({});
  const [catIds, setCatIds] = useState<number[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skill, setSkill] = useState('');
  const [busy, setBusy] = useState(false);
  const [pkg, setPkg] = useState<Package | 'new' | null>(null);
  const [del, setDel] = useState<number | null>(null);
  useEffect(() => {
    const x = q.data?.m;
    setM(x ?? { full_name: user.name, slug: mentorSlug(user.name), languages: [lang], accepting: true, years_experience: 3, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    setCatIds(x?.categories.map((c) => c.id) ?? []); setSkills(x?.skills ?? []);
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (q.loading || !q.data) return <Page><Spinner /></Page>;
  const set = (k: keyof Mentor, v: unknown) => setM((p) => ({ ...p, [k]: v }));
  const status = q.data.m?.status ?? 'draft';
  const save = async () => { setBusy(true); await act(() => api.saveMentorProfile(m, catIds, skills), t('Profile saved', 'تم حفظ الملف')); setBusy(false); q.reload(); };

  return (
    <Page>
      <PageHero badge={t('Mentor profile', 'ملف المرشد')} title={t('Profile & plans', 'الملف والباقات')} subtitle={t('This is what mentees see in the directory. Contact details and verification documents are never public.', 'هذا ما يراه المتدربون في الدليل. بيانات التواصل ووثائق التحقق لا تُنشر أبدًا.')} illus="star">
        <div className="flex flex-wrap items-center gap-2"><StatusPill status={status} />
          {m.slug && status === 'approved' && <Link to={`/mentors/${m.slug}`} target="_blank" className={btnGhost}><ExternalLink size={16} />{t('View public profile', 'عرض الملف العام')}</Link>}
          {['draft', 'rejected'].includes(status) && q.data.m && <button onClick={() => act(api.submitMentorForReview, t('Submitted for review', 'أُرسل للمراجعة')).then(q.reload)} className={btnAccent}><Send size={16} className="rtl:rotate-180" />{t('Submit for review', 'إرسال للمراجعة')}</button>}
        </div>
      </PageHero>
      <div className="grid xl:grid-cols-[1fr_400px] gap-6 items-start">
        <Card title={t('Public profile', 'الملف العام')}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('Display name', 'الاسم الظاهر')}><input value={m.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)} className={inputCls} /></Field>
            <Field label={t('Profile URL', 'رابط الملف')} hint={`/mentors/${m.slug ?? ''}`}><input value={m.slug ?? ''} onChange={(e) => set('slug', slugify(e.target.value))} className={inputCls} dir="ltr" /></Field>
            <Field label={t('Headline *', 'العنوان التعريفي *')} className="sm:col-span-2"><input value={m.headline ?? ''} onChange={(e) => set('headline', e.target.value)} className={inputCls} placeholder={t('e.g. Staff engineer helping developers reach senior level', 'مثال: مهندس أول يساعد المطورين على الترقي')} /></Field>
            <Field label={t('Job title', 'المسمى الوظيفي')}><input value={m.job_title ?? ''} onChange={(e) => set('job_title', e.target.value)} className={inputCls} /></Field>
            <Field label={t('Company', 'الشركة')}><input value={m.company ?? ''} onChange={(e) => set('company', e.target.value)} className={inputCls} /></Field>
            <Field label={t('Years of experience', 'سنوات الخبرة')}><input type="number" min={0} value={m.years_experience ?? 0} onChange={(e) => set('years_experience', Number(e.target.value))} className={inputCls} /></Field>
            <Field label={t('Country', 'الدولة')}><input value={m.country ?? ''} onChange={(e) => set('country', e.target.value)} className={inputCls} /></Field>
            <Field label={t('About you', 'نبذة عنك')} className="sm:col-span-2"><textarea rows={6} value={m.bio ?? ''} onChange={(e) => set('bio', e.target.value)} className={inputCls} /></Field>
            <Field label="LinkedIn"><input value={m.linkedin_url ?? ''} onChange={(e) => set('linkedin_url', e.target.value)} className={inputCls} dir="ltr" /></Field>
            <Field label={t('Intro video URL', 'رابط فيديو تعريفي')}><input value={m.video_url ?? ''} onChange={(e) => set('video_url', e.target.value)} className={inputCls} dir="ltr" /></Field>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mt-8 mb-3">{t('Mentoring languages', 'لغات الإرشاد')}</h3>
          <div className="flex flex-wrap gap-2">{Object.keys(LANG_NAME).map((l) => { const on = m.languages?.includes(l); return <button key={l} type="button" onClick={() => set('languages', on ? m.languages!.filter((x) => x !== l) : [...(m.languages ?? []), l])} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${on ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-600'}`}>{LANG_NAME[l][lang]}</button>; })}</div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mt-6 mb-3">{t('Fields', 'المجالات')}</h3>
          <div className="flex flex-wrap gap-2">{q.data.cats.map((c) => { const on = catIds.includes(c.id); return <button key={c.id} type="button" onClick={() => setCatIds(on ? catIds.filter((x) => x !== c.id) : [...catIds, c.id])} className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 ${on ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 text-slate-600'}`}>{on && <Check size={12} />}{lang === 'ar' ? c.name_ar : c.name_en}</button>; })}</div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mt-6 mb-3">{t('Skills', 'المهارات')}</h3>
          <div className="flex gap-2"><input list="skill-list" value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && skill.trim()) { e.preventDefault(); setSkills([...new Set([...skills, skill.trim()])]); setSkill(''); } }} className={inputCls} placeholder={t('Add a skill and press Enter', 'أضف مهارة واضغط Enter')} /><datalist id="skill-list">{q.data.skills.map((s) => <option key={s.id} value={s.name} />)}</datalist></div>
          <div className="flex flex-wrap gap-2 mt-3">{skills.map((s) => <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold">{s}<button onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label="remove"><X size={12} /></button></span>)}</div>
          <label className="flex items-center gap-3 mt-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-100"><input type="checkbox" checked={!!m.accepting} onChange={(e) => set('accepting', e.target.checked)} className="w-4 h-4 accent-emerald-600" /><span className="text-sm font-bold text-emerald-800">{t('Accepting new mentees', 'أستقبل متدربين جدد')}</span></label>
          <div className="flex justify-end mt-6"><button disabled={busy} onClick={save} className={btnPrimary}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{t('Save profile', 'حفظ الملف')}</button></div>
        </Card>

        <Card title={t('Plans & prices', 'الباقات والأسعار')} action={<button onClick={() => setPkg('new')} className={`${btnSm} bg-indigo-600 text-white`}><Plus size={14} />{t('Add', 'إضافة')}</button>}>
          {!q.data.m?.packages.length ? <p className="text-sm text-slate-400">{t('Save your profile, then add at least one plan.', 'احفظ ملفك ثم أضف باقة واحدة على الأقل.')}</p> : (
            <div className="space-y-3">{q.data.m.packages.filter((p) => p.is_active).map((p) => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-100 group">
                <div className="flex items-center justify-between"><p className="font-extrabold text-slate-900">{p.name}</p><p className="font-black">{money(p.price, p.currency)}<span className="text-xs text-slate-400 font-semibold">{p.billing === 'monthly' ? `/${t('mo', 'شهر')}` : ''}</span></p></div>
                <p className="text-xs text-slate-400 mt-1">{p.billing === 'monthly' ? t(`${p.calls_per_month} calls × ${p.call_minutes} min`, `${p.calls_per_month} مكالمات × ${p.call_minutes} دقيقة`) : t(`${p.call_minutes}-min session`, `جلسة ${p.call_minutes} دقيقة`)}{p.trial_days > 0 && ` · ${t(`${p.trial_days}-day trial`, `تجربة ${p.trial_days} أيام`)}`}</p>
                <div className="flex gap-2 mt-3"><button onClick={() => setPkg(p)} className={`${btnSm} bg-slate-100 text-slate-600`}><Pencil size={12} />{t('Edit', 'تعديل')}</button><button onClick={() => setDel(p.id)} className={`${btnSm} bg-red-50 text-red-500`}><Trash2 size={12} /></button></div>
              </div>
            ))}</div>
          )}
        </Card>
      </div>
      {pkg && <PackageForm pkg={pkg === 'new' ? undefined : pkg} onClose={() => setPkg(null)} onSaved={q.reload} />}
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={t('Archive this plan?', 'أرشفة هذه الباقة؟')} text={t('Existing mentees keep their plan.', 'يحتفظ المتدربون الحاليون بباقتهم.')} onConfirm={async () => { await act(() => api.deletePackage(del!)); q.reload(); }} />
    </Page>
  );
}
