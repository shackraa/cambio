import { create } from 'zustand';

type Lang = 'tr' | 'en';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

export const useLangStore = create<LangStore>((set) => ({
  lang: 'en',
  setLang: (lang) => set({ lang }),
  toggleLang: () => set((state) => ({ lang: state.lang === 'tr' ? 'en' : 'tr' })),
}));
