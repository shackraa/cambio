import { create } from 'zustand';

type Lang = 'tr' | 'en';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem('cambio_lang');
    if (saved === 'tr' || saved === 'en') return saved;
    const browserLang = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
    return browserLang.startsWith('tr') ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

const initialLang = detectInitialLang();
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

export const useLangStore = create<LangStore>((set) => ({
  lang: initialLang,
  setLang: (lang) => {
    try {
      localStorage.setItem('cambio_lang', lang);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    set({ lang });
  },
  toggleLang: () =>
    set((state) => {
      const next: Lang = state.lang === 'tr' ? 'en' : 'tr';
      try {
        localStorage.setItem('cambio_lang', next);
      } catch {}
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
      }
      return { lang: next };
    }),
}));
