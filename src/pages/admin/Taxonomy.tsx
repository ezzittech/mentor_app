import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Page, PageHero, Spinner, act, btnPrimary, inputCls } from '../../components/ui';
import { CAT_ICON } from '../../components/MentorCard';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { slugify } from '../../lib/format';
import { useT } from '../../lib/i18n';

export default function Taxonomy() {
  const t = useT();
  const q = useAsync(async () => ({ cats: await api.listCategories(), skills: await api.listSkills() }));
  const [c, setC] = useState({ name_en: '', name_ar: '', icon: 'Code2' });
  const [s, setS] = useState('');
  if (!q.data) return <Page><Spinner /></Page>;
  return (
    <Page>
      <PageHero badge={t('Configuration', 'الإعدادات')} badgeColor="slate" title={t('Categories & skills', 'التصنيفات والمهارات')} subtitle={t('Used for mentor profiles, search filters and matching.', 'تُستخدم في ملفات المرشدين وفلاتر البحث والمطابقة.')} illus="tags" />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card title={t('Categories', 'التصنيفات')}>
          <form className="grid grid-cols-2 gap-2 mb-5" onSubmit={async (e) => { e.preventDefault(); if (await act(() => api.saveCategory({ ...c, slug: slugify(c.name_en), color: 'indigo' }), t('Added', 'تمت الإضافة'))) { setC({ name_en: '', name_ar: '', icon: 'Code2' }); q.reload(); } }}>
            <input required value={c.name_en} onChange={(e) => setC({ ...c, name_en: e.target.value })} className={inputCls} placeholder="English name" dir="ltr" />
            <input required value={c.name_ar} onChange={(e) => setC({ ...c, name_ar: e.target.value })} className={inputCls} placeholder="الاسم بالعربية" dir="rtl" />
            <select value={c.icon} onChange={(e) => setC({ ...c, icon: e.target.value })} className={inputCls}>{Object.keys(CAT_ICON).map((k) => <option key={k}>{k}</option>)}</select>
            <button className={btnPrimary}><Plus size={16} />{t('Add', 'إضافة')}</button>
          </form>
          <div className="space-y-2">{q.data.cats.map((x) => { const I = CAT_ICON[x.icon ?? ''] ?? Plus; return (
            <div key={x.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 group"><span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center"><I size={16} /></span><div className="flex-1"><p className="font-bold text-sm">{x.name_en}</p><p className="text-xs text-slate-400">{x.name_ar}</p></div>
              <button onClick={() => act(() => api.deleteCategory(x.id), t('Deleted', 'تم الحذف')).then(q.reload)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500" aria-label="delete"><Trash2 size={16} /></button></div>
          ); })}</div>
        </Card>
        <Card title={t('Skills', 'المهارات')}>
          <form className="flex gap-2 mb-5" onSubmit={async (e) => { e.preventDefault(); if (await act(() => api.saveSkill(s.trim()), t('Added', 'تمت الإضافة'))) { setS(''); q.reload(); } }}><input required value={s} onChange={(e) => setS(e.target.value)} className={inputCls} placeholder={t('New skill', 'مهارة جديدة')} /><button className={btnPrimary}><Plus size={16} /></button></form>
          <div className="flex flex-wrap gap-2">{q.data.skills.map((x) => <span key={x.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700">{x.name}<button onClick={() => act(() => api.deleteSkill(x.id)).then(q.reload)} className="text-slate-300 hover:text-red-500" aria-label="delete"><Trash2 size={12} /></button></span>)}</div>
        </Card>
      </div>
    </Page>
  );
}
