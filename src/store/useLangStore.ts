import { create } from 'zustand';

type Lang = 'tr' | 'en';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = 'en';
}

export const useLangStore = create<LangStore>((set) => ({
  lang: 'en',
  setLang: (lang) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    set({ lang });
  },
  toggleLang: () =>
    set((state) => {
      const next: Lang = state.lang === 'tr' ? 'en' : 'tr';
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
      }
      return { lang: next };
    }),
}));
