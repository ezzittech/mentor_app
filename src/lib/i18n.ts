import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'ar' | 'en';

type LangState = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };

function apply(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'ar',
      setLang: (lang) => { apply(lang); set({ lang }); },
      toggle: () => get().setLang(get().lang === 'ar' ? 'en' : 'ar'),
    }),
    { name: 'murshid-lang', onRehydrateStorage: () => (s) => apply(s?.lang ?? 'ar') },
  ),
);
apply(useLang.getState().lang);

/** Inline bilingual strings: t('Find a mentor', 'ابحث عن مرشد'). */
export function useT() {
  const lang = useLang((s) => s.lang);
  return (en: string, ar: string) => (lang === 'ar' ? ar : en);
}
export const tNow = (en: string, ar: string) => (useLang.getState().lang === 'ar' ? ar : en);
export const pick = (o: { en: string; ar: string }, lang: Lang) => o[lang];
