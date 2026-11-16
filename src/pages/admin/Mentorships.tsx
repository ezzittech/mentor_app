import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Page, PageHero, SearchInput, Spinner, StatusPill, act } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { fmtDate } from '../../lib/format';
import { useT } from '../../lib/i18n';

export default function AdminMentorships() {
  const t = useT();
  const q = useAsync(async () => ({ ms: await api.mentorshipsAs('admin'), users: await api.listUsers() }));
  const [s, setS] = useState('');
  const sups = (q.data?.users ?? []).filter((u) => u.roles.includes('supervisor') || u.roles.includes('program_manager'));
  const list = (q.data?.ms ?? []).filter((m) => !s || `${m.mentee?.full_name} ${m.mentor?.full_name}`.toLowerCase().includes(s.toLowerCase()));
  return (
    <Page wide>
      <PageHero badge={t('Programs', 'البرامج')} title={t('Mentorships', 'علاقات الإرشاد')} subtitle={t('Assign supervisors and monitor every mentor–mentee relationship.', 'أسند المشرفين وتابع كل علاقة إرشاد.')} illus="folder"><SearchInput value={s} onChange={setS} placeholder={t('Search…', 'بحث…')} /></PageHero>
      {q.loading ? <Spinner /> : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto"><table className="w-full text-sm min-w-[860px]">
          <thead><tr className="text-[11px] uppercase text-slate-400 border-b border-slate-100">{[t('Mentee', 'المتدرب'), t('Mentor', 'المرشد'), t('Plan', 'الباقة'), t('Since', 'منذ'), t('Supervisor', 'المشرف'), t('Status', 'الحالة'), ''].map((h, i) => <th key={i} className="text-start px-5 py-4">{h}</th>)}</tr></thead>
          <tbody>{list.map((m) => (
            <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
              <td className="px-5 py-4"><div className="flex items-center gap-2"><Avatar name={m.mentee?.full_name ?? '?'} className="w-8 h-8 text-[10px]" /><b>{m.mentee?.full_name}</b></div></td>
              <td className="px-5 py-4">{m.mentor?.full_name}</td><td className="px-5 py-4">{m.package?.name}</td><td className="px-5 py-4 text-slate-500">{fmtDate(m.started_at)}</td>
              <td className="px-5 py-4"><select value={m.supervisor_id ?? ''} onChange={(e) => act(() => api.assignSupervisor(m.id, e.target.value || null), t('Supervisor assigned', 'تم إسناد المشرف')).then(q.reload)} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"><option value="">— {t('none', 'بدون')} —</option>{sups.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select></td>
              <td className="px-5 py-4"><StatusPill status={m.status} /></td>
              <td className="px-5 py-4"><Link to={`/app/admin/mentorships/${m.id}`} className="text-indigo-600"><ArrowRight size={16} className="rtl:rotate-180" /></Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Page>
  );
}
