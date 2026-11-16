import { useState } from 'react';
import { Page, PageHero, SearchInput, Spinner } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { fmtDateTime } from '../../lib/format';
import { useT } from '../../lib/i18n';

export default function Audit() {
  const t = useT();
  const q = useAsync(api.listAudit);
  const [s, setS] = useState('');
  const list = (q.data ?? []).filter((a) => !s || `${a.action} ${a.entity} ${a.actor?.full_name}`.toLowerCase().includes(s.toLowerCase()));
  return (
    <Page wide>
      <PageHero badge={t('Security', 'الأمان')} badgeColor="red" title={t('Audit log', 'سجل التدقيق')} subtitle={t('Written by database triggers on sensitive actions. Read-only — nobody can edit or delete entries.', 'تكتبه دوال قاعدة البيانات عند الإجراءات الحساسة، وهو للقراءة فقط — لا يمكن لأحد تعديله أو حذفه.')} illus="audit"><SearchInput value={s} onChange={setS} placeholder={t('Filter…', 'تصفية…')} /></PageHero>
      {q.loading ? <Spinner /> : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto"><table className="w-full text-sm min-w-[800px]">
          <thead><tr className="text-[11px] uppercase text-slate-400 border-b border-slate-100">{[t('When', 'الوقت'), t('Actor', 'المنفذ'), t('Action', 'الإجراء'), t('Entity', 'الكيان'), t('Data', 'البيانات')].map((h) => <th key={h} className="text-start px-5 py-4">{h}</th>)}</tr></thead>
          <tbody>{list.map((a) => <tr key={a.id} className="border-b border-slate-50 last:border-0"><td className="px-5 py-3 text-slate-500 whitespace-nowrap">{fmtDateTime(a.created_at)}</td><td className="px-5 py-3 font-bold">{a.actor?.full_name ?? 'system'}</td><td className="px-5 py-3"><span className="font-mono text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700">{a.action}</span></td><td className="px-5 py-3 text-slate-500">{a.entity} #{a.entity_id}</td><td className="px-5 py-3 font-mono text-[11px] text-slate-400 max-w-xs truncate" dir="ltr">{a.data ? JSON.stringify(a.data) : ''}</td></tr>)}</tbody>
        </table></div>
      )}
    </Page>
  );
}
