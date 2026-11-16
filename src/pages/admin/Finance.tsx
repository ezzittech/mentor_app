import { useState } from 'react';
import { Coins, Percent, Receipt, Wallet } from 'lucide-react';
import { Page, PageHero, Spinner, StatCard, StatusPill, Tabs, act } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { fmtDate, money } from '../../lib/format';
import { useT } from '../../lib/i18n';
import type { PaymentStatus } from '../../lib/types';

export default function Finance() {
  const t = useT();
  const q = useAsync(() => api.listOrders('all'));
  const [f, setF] = useState<'all' | PaymentStatus>('all');
  const all = q.data ?? [];
  const paid = all.filter((o) => o.status === 'paid');
  const list = all.filter((o) => f === 'all' || o.status === f);
  return (
    <Page wide>
      <PageHero badge={t('Finance', 'المالية')} badgeColor="green" title={t('Payments & commission', 'المدفوعات والعمولات')} subtitle={t('Manual confirmation (e.g. bank transfer) goes through a protected database function and is audited. Online payments will be confirmed by a verified webhook.', 'يتم التأكيد اليدوي (مثل التحويل البنكي) عبر دالة محمية في قاعدة البيانات ويُسجَّل في التدقيق. وسيُؤكَّد الدفع الإلكتروني عبر Webhook موثّق.')} illus="earnings" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Coins size={22} />} label={t('Gross paid', 'إجمالي المدفوع')} value={money(paid.reduce((a, o) => a + Number(o.amount), 0))} tone="green" />
        <StatCard icon={<Percent size={22} />} label={t('Commission', 'العمولة')} value={money(paid.reduce((a, o) => a + Number(o.commission_amount), 0))} tone="orange" />
        <StatCard icon={<Wallet size={22} />} label={t('Owed to mentors', 'مستحقات المرشدين')} value={money(paid.reduce((a, o) => a + Number(o.amount) - Number(o.commission_amount), 0))} />
        <StatCard icon={<Receipt size={22} />} label={t('Pending', 'معلقة')} value={all.filter((o) => o.status === 'pending').length} tone="amber" />
      </div>
      <div className="mb-4"><Tabs value={f} onChange={setF} tabs={(['all', 'pending', 'paid', 'refunded', 'failed'] as const).map((s) => ({ id: s, label: s === 'all' ? t('All', 'الكل') : <StatusPill status={s} /> }))} /></div>
      {q.loading ? <Spinner /> : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto"><table className="w-full text-sm min-w-[900px]">
          <thead><tr className="text-[11px] uppercase text-slate-400 border-b border-slate-100">{['#', t('Mentee', 'المتدرب'), t('Mentor', 'المرشد'), t('Plan', 'الباقة'), t('Date', 'التاريخ'), t('Amount', 'المبلغ'), t('Commission', 'العمولة'), t('Status', 'الحالة'), t('Action', 'إجراء')].map((h) => <th key={h} className="text-start px-5 py-4">{h}</th>)}</tr></thead>
          <tbody>{list.map((o) => (
            <tr key={o.id} className="border-b border-slate-50 last:border-0">
              <td className="px-5 py-4 font-mono font-bold">{o.id}</td><td className="px-5 py-4">{o.mentee?.full_name}</td><td className="px-5 py-4">{o.mentor?.full_name}</td><td className="px-5 py-4">{o.package?.name}</td><td className="px-5 py-4 text-slate-500">{fmtDate(o.created_at)}</td>
              <td className="px-5 py-4 font-black">{money(o.amount, o.currency)}</td><td className="px-5 py-4 text-orange-600">{money(o.commission_amount, o.currency)} <span className="text-[10px] text-slate-400">({Math.round(o.commission_rate * 100)}%)</span></td>
              <td className="px-5 py-4"><StatusPill status={o.status} /></td>
              <td className="px-5 py-4">{o.status === 'pending' ? <button onClick={() => act(() => api.setOrderStatus(o.id, 'paid'), t('Marked as paid', 'تم التأكيد كمدفوع')).then(q.reload)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">{t('Confirm paid', 'تأكيد الدفع')}</button>
                : o.status === 'paid' ? <button onClick={() => act(() => api.setOrderStatus(o.id, 'refunded'), t('Refunded', 'تم الاسترداد')).then(q.reload)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">{t('Refund', 'استرداد')}</button> : '—'}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Page>
  );
}
