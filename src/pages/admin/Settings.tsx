import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card, Field, Page, PageHero, Spinner, act, btnPrimary, inputCls } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useT } from '../../lib/i18n';

export default function Settings() {
  const t = useT();
  const q = useAsync(api.getSettings);
  const [s, setS] = useState<Record<string, unknown>>({});
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  if (!q.data) return <Page><Spinner /></Page>;
  const save = () => act(() => Promise.all(Object.entries(s).filter(([k, v]) => q.data![k] !== v).map(([k, v]) => api.setSetting(k, v))), t('Settings saved', 'تم حفظ الإعدادات')).then(q.reload);
  const Toggle = ({ k, label, hint }: { k: string; label: string; hint: string }) => (
    <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-50"><input type="checkbox" checked={!!s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} className="mt-1 w-4 h-4 accent-indigo-600" /><span><span className="block font-bold text-slate-800 text-sm">{label}</span><span className="block text-xs text-slate-400 mt-0.5">{hint}</span></span></label>
  );
  return (
    <Page>
      <PageHero badge={t('Configuration', 'الإعدادات')} badgeColor="slate" title={t('Platform settings', 'إعدادات المنصة')} subtitle={t('Commission, currency, trials and integrations (feature flags).', 'العمولة والعملة والتجارب المجانية والتكاملات (مفاتيح الميزات).')} illus="settings" />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card title={t('Business', 'الأعمال')}>
          <div className="space-y-4">
            <Field label={t('Platform commission (%)', 'عمولة المنصة (%)')} hint={t('Applied to new orders only. Stored per order for history.', 'تُطبَّق على الطلبات الجديدة فقط، وتُحفظ مع كل طلب.')}><input type="number" min={0} max={50} step={0.5} value={Number(s.commission_rate ?? 0) * 100} onChange={(e) => setS({ ...s, commission_rate: Number(e.target.value) / 100 })} className={inputCls} /></Field>
            <Field label={t('Default currency', 'العملة الافتراضية')}><select value={String(s.default_currency ?? 'USD')} onChange={(e) => setS({ ...s, default_currency: e.target.value })} className={inputCls}>{['USD', 'SAR', 'AED', 'MYR', 'EGP', 'EUR'].map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label={t('Default free trial (days)', 'التجربة المجانية الافتراضية (أيام)')}><input type="number" min={0} max={30} value={Number(s.trial_days ?? 0)} onChange={(e) => setS({ ...s, trial_days: Number(e.target.value) })} className={inputCls} /></Field>
          </div>
        </Card>
        <Card title={t('Integrations & privacy', 'التكاملات والخصوصية')}>
          <div className="space-y-3">
            <Toggle k="payments_enabled" label={t('Online payments', 'الدفع الإلكتروني')} hint={t('Keep off until a provider + webhook Edge Function is approved.', 'أبقه معطلًا حتى اعتماد مزود دفع ووظيفة Webhook.')} />
            <Field label={t('Meeting provider', 'مزود الاجتماعات')}><select value={String(s.meeting_provider ?? 'manual')} onChange={(e) => setS({ ...s, meeting_provider: e.target.value })} className={inputCls}><option value="manual">{t('Manual links (default)', 'روابط يدوية (افتراضي)')}</option><option value="zoom" disabled>Zoom (soon)</option><option value="google_meet" disabled>Google Meet (soon)</option></select></Field>
            <Toggle k="supervisor_can_read_messages" label={t('Supervisors can read private chats', 'السماح للمشرفين بقراءة المحادثات الخاصة')} hint={t('Off by default. Requires a matching RLS policy change.', 'معطّل افتراضيًا ويتطلب تعديل سياسة RLS المقابلة.')} />
          </div>
        </Card>
      </div>
      <div className="flex justify-end mt-6"><button onClick={save} className={btnPrimary}><Save size={16} />{t('Save settings', 'حفظ الإعدادات')}</button></div>
    </Page>
  );
}
