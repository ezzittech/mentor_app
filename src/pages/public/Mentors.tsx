import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { SiteShell } from './Site';
import { LANG_NAME, MentorCard } from '../../components/MentorCard';
import { Empty, ErrorBox, SearchInput, SkeletonGrid, inputCls } from '../../components/ui';
import { filterMentors, listCategories, listMentors, listSkills } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useLang, useT } from '../../lib/i18n';

const PAGE = 9;

export default function Mentors() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const [sp, setSp] = useSearchParams();
  const [panel, setPanel] = useState(false);
  const mentors = useAsync(listMentors);
  const cats = useAsync(listCategories);
  const skills = useAsync(listSkills);
  const f = { q: sp.get('q') ?? '', category: sp.get('category') ?? '', skill: sp.get('skill') ?? '', lang: sp.get('lang') ?? '', maxPrice: Number(sp.get('max')) || 0, sort: sp.get('sort') ?? 'recommended', available: sp.get('available') === '1' };
  const page = Number(sp.get('page')) || 1;
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); setSp(n, { replace: true }); };
  const list = useMemo(() => filterMentors(mentors.data ?? [], f), [mentors.data, sp]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = list.slice(0, page * PAGE);
  const active = [f.category, f.skill, f.lang, f.maxPrice ? '1' : '', f.available ? '1' : ''].filter(Boolean).length;
  const langs = [...new Set((mentors.data ?? []).flatMap((m) => m.languages))];

  const Filters = (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">{t('Category', 'المجال')}</p>
        <div className="space-y-1">
          <button onClick={() => set('category', '')} className={`w-full text-start px-3 py-2 rounded-xl text-sm font-semibold ${!f.category ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>{t('All fields', 'كل المجالات')}</button>
          {(cats.data ?? []).map((c) => <button key={c.id} onClick={() => set('category', c.slug)} className={`w-full text-start px-3 py-2 rounded-xl text-sm font-semibold ${f.category === c.slug ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>{lang === 'ar' ? c.name_ar : c.name_en}</button>)}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">{t('Skill', 'المهارة')}</p>
        <select value={f.skill} onChange={(e) => set('skill', e.target.value)} className={inputCls}><option value="">{t('Any skill', 'أي مهارة')}</option>{(skills.data ?? []).map((s) => <option key={s.id}>{s.name}</option>)}</select>
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">{t('Mentoring language', 'لغة الإرشاد')}</p>
        <div className="flex flex-wrap gap-2">{langs.map((l) => <button key={l} onClick={() => set('lang', f.lang === l ? '' : l)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${f.lang === l ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>{LANG_NAME[l]?.[lang] ?? l}</button>)}</div>
      </div>
      <div>
        <div className="flex justify-between mb-3"><p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t('Max monthly price', 'أقصى سعر شهري')}</p><span className="text-xs font-black text-indigo-600">{f.maxPrice ? `$${f.maxPrice}` : t('Any', 'الكل')}</span></div>
        <input type="range" min={0} max={500} step={10} value={f.maxPrice} onChange={(e) => set('max', e.target.value === '0' ? '' : e.target.value)} className="w-full accent-orange-500" aria-label={t('Max price', 'أقصى سعر')} />
      </div>
      <label className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 cursor-pointer">
        <input type="checkbox" checked={f.available} onChange={(e) => set('available', e.target.checked ? '1' : '')} className="w-4 h-4 accent-emerald-600" />
        <span className="text-sm font-bold text-emerald-700">{t('Has open spots', 'لديه مقاعد متاحة')}</span>
      </label>
      {active > 0 && <button onClick={() => setSp(f.q ? { q: f.q } : {}, { replace: true })} className="w-full py-2.5 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100">{t('Clear filters', 'مسح الفلاتر')}</button>}
    </div>
  );

  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 grid-dots opacity-20" />
        <div className="absolute -end-32 -top-32 w-96 h-96 rounded-full bg-orange-500/20 blur-2xl" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-14">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">{t('Mentor directory', 'دليل المرشدين')}</p>
          <h1 className="text-4xl font-extrabold mt-3 tracking-tight">{t('Find your perfect mentor', 'اعثر على مرشدك المثالي')}</h1>
          <p className="text-slate-300 mt-2">{t('Every mentor is vetted. Filter by field, skill, language and budget.', 'كل المرشدين معتمدون. صفِّ حسب المجال والمهارة واللغة والميزانية.')}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-3xl">
            <div className="flex-1 [&_input]:bg-white [&_input]:py-3.5"><SearchInput className="w-full" value={f.q} onChange={(v) => set('q', v)} placeholder={t('Search by name, skill, company…', 'ابحث بالاسم أو المهارة أو الشركة…')} /></div>
            <select value={f.sort} onChange={(e) => set('sort', e.target.value)} className="px-4 py-3.5 rounded-xl bg-white text-slate-800 text-sm font-semibold" aria-label={t('Sort', 'ترتيب')}>
              <option value="recommended">{t('Recommended', 'الأكثر ملاءمة')}</option>
              <option value="rating">{t('Highest rated', 'الأعلى تقييمًا')}</option>
              <option value="reviews">{t('Most reviews', 'الأكثر تقييمات')}</option>
              <option value="price_asc">{t('Price: low to high', 'السعر: من الأقل')}</option>
              <option value="price_desc">{t('Price: high to low', 'السعر: من الأعلى')}</option>
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block"><div className="sticky top-28 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">{Filters}</div></aside>
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500"><b className="text-slate-900">{list.length}</b> {t('mentors found', 'مرشد مطابق')}</p>
            <button onClick={() => setPanel(true)} className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold"><SlidersHorizontal size={16} />{t('Filters', 'الفلاتر')}{active > 0 && <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] grid place-items-center">{active}</span>}</button>
          </div>
          {mentors.error ? <ErrorBox error={mentors.error} onRetry={mentors.reload} /> : mentors.loading ? <SkeletonGrid className="h-96" /> : !list.length ? (
            <Empty icon={<SearchX size={28} />} title={t('No mentors match', 'لا يوجد مرشدون مطابقون')} text={t('Try removing a filter or searching for something broader.', 'جرّب إزالة أحد الفلاتر أو البحث بكلمة أعم.')} />
          ) : (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">{shown.map((m) => <MentorCard key={m.id} m={m} />)}</div>
              {shown.length < list.length && <div className="text-center mt-10"><button onClick={() => set('page', String(page + 1))} className="px-6 py-3 rounded-2xl bg-white border border-slate-200 font-bold text-slate-700 hover:border-orange-300">{t('Load more', 'عرض المزيد')}</button></div>}
            </>
          )}
        </div>
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/40" onClick={() => setPanel(false)}>
          <div className="absolute inset-y-0 end-0 w-[85%] max-w-sm bg-white p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><p className="font-extrabold text-lg">{t('Filters', 'الفلاتر')}</p><button onClick={() => setPanel(false)} aria-label="Close"><X size={20} /></button></div>
            {Filters}
          </div>
        </div>
      )}
    </SiteShell>
  );
}
