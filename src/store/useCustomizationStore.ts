import { create } from 'zustand';

export type CardBackSkin = 'classic_red' | 'classic_blue' | 'royal_compass' | 'emerald_botanical';
export type CardFrontStyle = 'classic' | 'vintage';
export type TableTheme = 'emerald' | 'ocean' | 'burgundy';

interface CustomizationStore {
  cardBack: CardBackSkin;
  cardFront: CardFrontStyle;
  tableTheme: TableTheme;
  setCardBack: (skin: CardBackSkin) => void;
  setCardFront: (style: CardFrontStyle) => void;
  setTableTheme: (theme: TableTheme) => void;
}

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return (val as T) || fallback;
  } catch {
    return fallback;
  }
}

export const useCustomizationStore = create<CustomizationStore>((set) => ({
  cardBack: loadSaved<CardBackSkin>('cambio_card_back', 'classic_red'),
  cardFront: loadSaved<CardFrontStyle>('cambio_card_front', 'classic'),
  tableTheme: loadSaved<TableTheme>('cambio_table_theme', 'emerald'),
  setCardBack: (cardBack) => {
    try { localStorage.setItem('cambio_card_back', cardBack); } catch {}
    set({ cardBack });
  },
  setCardFront: (cardFront) => {
    try { localStorage.setItem('cambio_card_front', cardFront); } catch {}
    set({ cardFront });
  },
  setTableTheme: (tableTheme) => {
    try { localStorage.setItem('cambio_table_theme', tableTheme); } catch {}
    set({ tableTheme });
  },
}));
