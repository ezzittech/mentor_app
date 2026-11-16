import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCheck, Loader2, MessageSquareWarning, Save } from 'lucide-react';
import { Card, Page, PageHero, Spinner, StatusPill, act, btnAccent, btnGhost, btnPrimary, inputCls } from '../../components/ui';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useLang, useT } from '../../lib/i18n';
import { fmtDate } from '../../lib/format';
import type { Question } from '../../lib/types';

export function AnswerView({ q, v }: { q: Question; v: unknown }) {
  const lang = useLang((s) => s.lang);
  if (v === undefined || v === null || v === '') return <span className="text-slate-300">—</span>;
  if (q.kind === 'single') return <>{q.options?.[v as number]?.[lang]}</>;
  if (q.kind === 'multi') return <div className="flex flex-wrap gap-1.5">{(v as number[]).map((i) => <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">{q.options?.[i]?.[lang]}</span>)}</div>;
  if (q.kind === 'scale') return <span className="font-black text-indigo-700">{String(v)} / 5</span>;
  if (q.kind === 'date') return <>{fmtDate(String(v))}</>;
  return <span className="whitespace-pre-line">{String(v)}</span>;
}

export default function Assessment() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const q = useAsync(async () => ({ questions: await api.assessmentQuestions(), mine: await api.myAssessment() }));
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data?.mine) setAnswers(q.data.mine.answers ?? {}); }, [q.data?.mine]);

  const sections = useMemo(() => {
    const qs = q.data?.questions ?? [];
    return [...new Set(qs.map((x) => x.section))].map((s) => ({ id: s, qs: qs.filter((x) => x.section === s) }));
  }, [q.data]);
  const SECTION_LABEL: Record<string, string> = { goal: t('Your goal', 'هدفك'), background: t('Background', 'خلفيتك'), gaps: t('Strengths & gaps', 'القوة والفجوات'), logistics: t('Time & timeline', 'الوقت والإطار الزمني') };

  if (q.loading || !q.data) return <Page><Spinner /></Page>;
  const mine = q.data.mine;
  const tplId = q.data.questions[0]?.template_id ?? 1;
  const set = (id: number, v: unknown) => setAnswers((a) => ({ ...a, [id]: v }));
  const missing = (qs: Question[]) => qs.filter((x) => x.required && (answers[x.id] === undefined || answers[x.id] === '' || (Array.isArray(answers[x.id]) && !(answers[x.id] as unknown[]).length)));
  const save = async (submit: boolean) => { setBusy(true); if (await act(() => api.saveAssessment(answers, submit, tplId), submit ? t('Assessment submitted 🎉', 'تم إرسال التقييم 🎉') : t('Draft saved', 'تم حفظ المسودة'))) { setEditing(false); q.reload(); } setBusy(false); };

  const readOnly = mine && mine.status !== 'draft' && mine.status !== 'needs_info' && !editing;
  if (readOnly || (mine && ['submitted', 'reviewed'].includes(mine.status) && !editing)) {
    return (
      <Page>
        <PageHero badge={t('Initial assessment', 'التقييم الأولي')} badgeColor="green" title={t('Your assessment', 'تقييمك')} subtitle={t('This is a planning tool to support discussion with your mentor — not a test or a judgement.', 'هذه أداة تخطيط لدعم النقاش مع مرشدك — وليست اختبارًا أو حكمًا.')} illus="assessment">
          <div className="flex flex-wrap items-center gap-3"><StatusPill status={mine!.status} />{mine!.submitted_at && <span className="text-sm text-slate-400">{t('Submitted', 'أُرسل في')} {fmtDate(mine!.submitted_at)}</span>}
            {mine!.status === 'submitted' && <button onClick={() => setEditing(true)} className={btnGhost}>{t('Edit answers', 'تعديل الإجابات')}</button>}</div>
        </PageHero>
        {mine!.review_note && <div className="mb-6 flex gap-3 p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-800"><ClipboardCheck className="shrink-0" /><div><p className="font-bold">{t('Mentor’s review', 'مراجعة المرشد')}</p><p className="text-sm mt-1">{mine!.review_note}</p></div></div>}
        <div className="grid md:grid-cols-2 gap-6">{sections.map((s) => (
          <Card key={s.id} title={SECTION_LABEL[s.id] ?? s.id}>
            <dl className="space-y-4">{s.qs.map((x) => <div key={x.id}><dt className="text-xs font-bold text-slate-400">{lang === 'ar' ? x.prompt_ar : x.prompt_en}</dt><dd className="text-sm text-slate-800 mt-1"><AnswerView q={x} v={mine!.answers[x.id]} /></dd></div>)}</dl>
          </Card>
        ))}</div>
      </Page>
    );
  }

  const sec = sections[step];
  const last = step === sections.length - 1;
  return (
    <Page>
      <PageHero badge={t('Initial assessment', 'التقييم الأولي')} title={t('Let’s understand your goal', 'لنفهم هدفك')} subtitle={t('About 5 minutes. Your answers help your mentor build a plan that fits you. You can save and continue later.', 'حوالي 5 دقائق. تساعد إجاباتك مرشدك على بناء خطة تناسبك، ويمكنك الحفظ والمتابعة لاحقًا.')} illus="assessment" />
      {mine?.status === 'needs_info' && <div className="mb-6 flex gap-3 p-5 rounded-3xl bg-orange-50 border border-orange-100 text-orange-800"><MessageSquareWarning className="shrink-0" /><div><p className="font-bold">{t('More information requested', 'مطلوب معلومات إضافية')}</p><p className="text-sm mt-1">{mine.review_note}</p></div></div>}

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
        <nav className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-1 lg:sticky lg:top-28">
          {sections.map((s, i) => {
            const done = !missing(s.qs).length && i < step;
            return (
              <button key={s.id} onClick={() => setStep(i)} className={`w-full flex items-center gap-3 p-3 rounded-2xl text-start text-sm font-bold transition-all ${i === step ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className={`w-7 h-7 rounded-full grid place-items-center text-xs ${done ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{done ? <Check size={14} /> : i + 1}</span>{SECTION_LABEL[s.id] ?? s.id}
              </button>
            );
          })}
          <div className="h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden"><div className="h-full bg-orange-500 transition-all" style={{ width: `${((step + 1) / sections.length) * 100}%` }} /></div>
        </nav>

        <Card className="animate__animated animate__fadeIn" key={sec.id}>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">{SECTION_LABEL[sec.id]}</h2>
          <div className="space-y-8">{sec.qs.map((x) => (
            <fieldset key={x.id}>
              <legend className="font-bold text-slate-800 mb-3">{lang === 'ar' ? x.prompt_ar : x.prompt_en}{x.required && <span className="text-orange-500"> *</span>}</legend>
              {x.kind === 'single' && <div className="grid sm:grid-cols-2 gap-2">{x.options!.map((o, i) => (
                <button type="button" key={i} onClick={() => set(x.id, i)} className={`p-3.5 rounded-2xl border-2 text-start text-sm font-semibold transition-all ${answers[x.id] === i ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}>{o[lang]}</button>
              ))}</div>}
              {x.kind === 'multi' && <div className="flex flex-wrap gap-2">{x.options!.map((o, i) => {
                const arr = (answers[x.id] as number[] | undefined) ?? [];
                const on = arr.includes(i);
                return <button type="button" key={i} onClick={() => set(x.id, on ? arr.filter((a) => a !== i) : [...arr, i])} className={`px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${on ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>{on && <CheckCircle2 size={14} />}{o[lang]}</button>;
              })}</div>}
              {x.kind === 'scale' && <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => set(x.id, n)} className={`flex-1 py-4 rounded-2xl border-2 font-black text-lg transition-all ${answers[x.id] === n ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{n}</button>
              ))}</div>}
              {x.kind === 'short' && <input value={(answers[x.id] as string) ?? ''} onChange={(e) => set(x.id, e.target.value)} className={inputCls} />}
              {x.kind === 'long' && <textarea rows={4} value={(answers[x.id] as string) ?? ''} onChange={(e) => set(x.id, e.target.value)} className={inputCls} />}
              {x.kind === 'date' && <input type="date" value={(answers[x.id] as string) ?? ''} onChange={(e) => set(x.id, e.target.value)} className={`${inputCls} max-w-xs`} />}
            </fieldset>
          ))}</div>
          <div className="flex flex-wrap justify-between gap-3 mt-10 pt-6 border-t border-slate-100">
            <button disabled={step === 0} onClick={() => setStep(step - 1)} className={btnGhost}><ArrowLeft size={16} className="rtl:rotate-180" />{t('Back', 'السابق')}</button>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => save(false)} className={btnGhost}><Save size={16} />{t('Save draft', 'حفظ كمسودة')}</button>
              {!last ? <button onClick={() => setStep(step + 1)} className={btnPrimary}>{t('Next', 'التالي')}<ArrowRight size={16} className="rtl:rotate-180" /></button>
                : <button disabled={busy || sections.some((s) => missing(s.qs).length)} onClick={() => save(true)} className={btnAccent}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{t('Review & submit', 'إرسال التقييم')}</button>}
            </div>
          </div>
          {last && sections.some((s) => missing(s.qs).length) && <p className="text-xs text-orange-600 mt-3 text-end">{t('Please answer all required questions (*) first.', 'يرجى الإجابة عن جميع الأسئلة الإلزامية (*) أولًا.')}</p>}
        </Card>
      </div>
    </Page>
  );
}
