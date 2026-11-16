import { Coins, Percent, Receipt, Wallet } from 'lucide-react';
import { Card, Empty, Page, PageHero, Spinner, StatCard, StatusPill } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { fmtDate, money } from '../../lib/format';
import { useLang, useT } from '../../lib/i18n';

export default function Earnings() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const q = useAsync(() => api.listOrders('mentor'));
  const paid = (q.data ?? []).filter((o) => o.status === 'paid');
  const gross = paid.reduce((a, o) => a + Number(o.amount), 0);
  const fee = paid.reduce((a, o) => a + Number(o.commission_amount), 0);
  const pending = (q.data ?? []).filter((o) => o.status === 'pending').reduce((a, o) => a + Number(o.amount) - Number(o.commission_amount), 0);
  // last 6 months bar chart
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7); });
  const byMonth = months.map((m) => paid.filter((o) => o.created_at.startsWith(m)).reduce((a, o) => a + Number(o.amount) - Number(o.commission_amount), 0));
  const max = Math.max(...byMonth, 1);
  return (
    <Page>
      <PageHero badge={t('Earnings', 'الأرباح')} badgeColor="green" title={t('Your earnings', 'أرباحك')} subtitle={t('Net amounts after platform commission. Payouts are processed by the finance team.', 'المبالغ الصافية بعد عمولة المنصة. يتولى فريق المالية صرف المستحقات.')} illus="earnings" />
      {q.loading ? <Spinner /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Wallet size={22} />} label={t('Net earned', 'الصافي')} value={money(gross - fee)} tone="green" />
          <StatCard icon={<Coins size={22} />} label={t('Gross', 'الإجمالي')} value={money(gross)} />
          <StatCard icon={<Percent size={22} />} label={t('Commission', 'العمولة')} value={money(fee)} tone="orange" />
          <StatCard icon={<Receipt size={22} />} label={t('Pending', 'معلق')} value={money(pending)} tone="amber" />
        </div>
        <Card title={t('Last 6 months (net)', 'آخر 6 أشهر (صافي)')} className="mb-6">
          <div className="flex items-end gap-3 h-48" role="img" aria-label="earnings chart">{byMonth.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{money(v)}</span>
              <div className="w-full max-w-14 rounded-t-xl bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-orange-500 group-hover:to-orange-300 transition-all" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
              <span className="text-[11px] font-bold text-slate-400">{new Date(`${months[i]}-01`).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { month: 'short' })}</span>
            </div>
          ))}</div>
        </Card>
        {!q.data?.length ? <Empty icon={<Receipt size={26} />} title={t('No transactions yet', 'لا توجد معاملات بعد')} /> : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase text-slate-400 border-b border-slate-100">{[t('Invoice', 'الفاتورة'), t('Mentee', 'المتدرب'), t('Plan', 'الباقة'), t('Date', 'التاريخ'), t('Gross', 'الإجمالي'), t('Commission', 'العمولة'), t('Net', 'الصافي'), t('Status', 'الحالة')].map((h) => <th key={h} className="text-start font-bold px-5 py-4">{h}</th>)}</tr></thead>
            <tbody>{q.data.map((o) => <tr key={o.id} className="border-b border-slate-50 last:border-0"><td className="px-5 py-4 font-mono font-bold">#{o.id}</td><td className="px-5 py-4">{o.mentee?.full_name}</td><td className="px-5 py-4">{o.package?.name}</td><td className="px-5 py-4 text-slate-500">{fmtDate(o.created_at)}</td><td className="px-5 py-4">{money(o.amount)}</td><td className="px-5 py-4 text-orange-600">−{money(o.commission_amount)}</td><td className="px-5 py-4 font-black">{money(o.amount - o.commission_amount)}</td><td className="px-5 py-4"><StatusPill status={o.status} /></td></tr>)}</tbody>
          </table></div>
        )}
      </>}
    </Page>
  );
}
