import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lock, MessagesSquare, Send } from 'lucide-react';
import { Empty, Page, Spinner, toast } from '../../components/ui';
import { Avatar } from '../../components/media';
import * as api from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../lib/auth';
import { fmtTime, fmtDate } from '../../lib/format';
import { useT } from '../../lib/i18n';
import type { Message, Mentorship } from '../../lib/types';

function Thread({ ms, onBack }: { ms: Mentorship; onBack: () => void }) {
  const t = useT();
  const me = useAuth((s) => s.user)!;
  const [list, setList] = useState<Message[] | null>(null);
  const [body, setBody] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const other = me.id === ms.mentor_id ? ms.mentee : ms.mentor;
  useEffect(() => {
    let alive = true;
    api.listMessages(ms.id).then((m) => alive && setList(m)).catch(toast.err);
    api.markMessagesRead(ms.id);
    const off = api.subscribeMessages(ms.id, (m) => setList((l) => (l && !l.some((x) => x.id === m.id) ? [...l, m] : l)));
    return () => { alive = false; off(); };
  }, [ms.id]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [list?.length]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); const text = body.trim(); if (!text) return;
    setBody('');
    try { const m = await api.sendMessage(ms.id, text); setList((l) => (l && !l.some((x) => x.id === m.id) ? [...l, m] : l)); } catch (err) { toast.err(err); setBody(text); }
  };
  let lastDay = '';
  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <button onClick={onBack} className="md:hidden p-1" aria-label="Back"><ArrowLeft size={20} className="rtl:rotate-180" /></button>
        <Avatar name={other?.full_name ?? '?'} className="w-10 h-10 text-xs" />
        <div className="flex-1"><p className="font-extrabold text-slate-900">{other?.full_name}</p><p className="text-[11px] text-slate-400 flex items-center gap-1"><Lock size={10} />{t('Private — only the two of you', 'خاصة — بينكما فقط')}</p></div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-2 bg-[#fafafa]">
        {!list ? <Spinner /> : !list.length ? <p className="text-center text-sm text-slate-400 py-10">{t('Say hello 👋', 'ابدأ المحادثة 👋')}</p> : list.map((m) => {
          const mine = m.sender_id === me.id;
          const day = fmtDate(m.created_at);
          const sep = day !== lastDay; lastDay = day;
          return (
            <div key={m.id}>
              {sep && <p className="text-center text-[10px] font-bold text-slate-400 my-3">{day}</p>}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${mine ? 'bg-indigo-600 text-white rounded-ee-md' : 'bg-white text-slate-800 border border-slate-100 rounded-es-md'}`}>
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-indigo-200' : 'text-slate-400'}`}>{fmtTime(m.created_at)}{mine && m.read_at && ' ✓✓'}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('Write a message…', 'اكتب رسالة…')} className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-100" aria-label="message" />
        <button className="w-12 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white grid place-items-center shadow-lg shadow-orange-200" aria-label={t('Send', 'إرسال')}><Send size={18} className="rtl:rotate-180" /></button>
      </form>
    </div>
  );
}

export default function Messages() {
  const t = useT();
  const user = useAuth((s) => s.user)!;
  const active = useAuth((s) => s.active) ?? user.roles[0];
  const role = active === 'mentor' ? 'mentor' : 'mentee';
  const q = useAsync(() => api.mentorshipsAs(role), [role]);
  const [sel, setSel] = useState<number | null>(null);
  const list = (q.data ?? []).filter((m) => m.status !== 'cancelled');
  const cur = list.find((m) => m.id === sel) ?? (typeof window !== 'undefined' && window.innerWidth >= 768 ? list[0] : undefined);
  if (['supervisor', 'admin', 'program_manager', 'support'].includes(active)) return <Page><Empty icon={<Lock size={26} />} title={t('Private conversations', 'محادثات خاصة')} text={t('Mentor–mentee chats are private. Supervisors use notes and interventions instead.', 'محادثات المرشد والمتدرب خاصة. يستخدم المشرف الملاحظات والتدخلات بدلًا منها.')} /></Page>;
  return (
    <Page>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">{t('Messages', 'الرسائل')}</h1>
      {q.loading ? <Spinner /> : !list.length ? <Empty icon={<MessagesSquare size={26} />} title={t('No conversations yet', 'لا توجد محادثات بعد')} text={t('A conversation opens automatically when a mentorship starts.', 'تُفتح المحادثة تلقائيًا عند بدء علاقة الإرشاد.')} /> : (
        <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden grid md:grid-cols-[300px_1fr]">
          <aside className={`border-e border-slate-100 ${cur ? 'hidden md:block' : ''}`}>
            {list.map((m) => { const o = role === 'mentor' ? m.mentee : m.mentor; return (
              <button key={m.id} onClick={() => setSel(m.id)} className={`w-full text-start flex items-center gap-3 px-5 py-4 border-b border-slate-50 ${cur?.id === m.id ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}>
                <Avatar name={o?.full_name ?? '?'} className="w-11 h-11 text-xs" /><div className="min-w-0"><p className="font-bold text-slate-800 truncate">{o?.full_name}</p><p className="text-xs text-slate-400 truncate">{o?.headline}</p></div>
              </button>
            ); })}
          </aside>
          {cur ? <Thread key={cur.id} ms={cur} onBack={() => setSel(-1)} /> : <div className="hidden md:grid place-items-center text-slate-400">{t('Select a conversation', 'اختر محادثة')}</div>}
        </div>
      )}
    </Page>
  );
}
