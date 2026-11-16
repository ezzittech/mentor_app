import { Receipt, ShieldCheck } from 'lucide-react';
import { Empty, Page, PageHero, Spinner, StatusPill } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { fmtDate, money } from '../../lib/format';
import { useT } from '../../lib/i18n';

export default function Payments() {
  const t = useT();
  const q = useAsync(() => api.listOrders('mentee'));
  return (
    <Page>
      <PageHero badge={t('Payments', 'المدفوعات')} badgeColor="green" title={t('Payments & invoices', 'المدفوعات والفواتير')} subtitle={t('Payment status is confirmed only by the payment provider or the finance team — never by the browser.', 'تُؤكَّد حالة الدفع فقط من مزود الدفع أو فريق المالية — وليس من المتصفح.')} illus="payments" />
      <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm"><ShieldCheck size={18} className="shrink-0" />{t('We never store card details. Online checkout will be enabled once a payment provider is approved.', 'لا نخزن بيانات البطاقات. سيُفعّل الدفع الإلكتروني بعد اعتماد مزود دفع.')}</div>
      {q.loading ? <Spinner /> : !q.data?.length ? <Empty icon={<Receipt size={26} />} title={t('No payments yet', 'لا توجد مدفوعات بعد')} /> : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-start text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">{[t('Invoice', 'الفاتورة'), t('Mentor', 'المرشد'), t('Plan', 'الباقة'), t('Date', 'التاريخ'), t('Amount', 'المبلغ'), t('Status', 'الحالة')].map((h) => <th key={h} className="text-start font-bold px-5 py-4">{h}</th>)}</tr></thead>
            <tbody>{q.data.map((o) => <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"><td className="px-5 py-4 font-mono font-bold text-slate-700">#{o.id}</td><td className="px-5 py-4">{o.mentor?.full_name}</td><td className="px-5 py-4">{o.package?.name}</td><td className="px-5 py-4 text-slate-500">{fmtDate(o.created_at)}</td><td className="px-5 py-4 font-black">{money(o.amount, o.currency)}</td><td className="px-5 py-4"><StatusPill status={o.status} /></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
