import { motion, AnimatePresence } from 'framer-motion';
import {
  useCustomizationStore,
  type CardBackSkin,
  type CardFrontStyle,
  type TableTheme,
} from '../store/useCustomizationStore';
import { useLangStore } from '../store/useLangStore';
import { GameCard } from './GameCard';
import type { Card } from '../types/game';

const PREVIEW_BACK_CARD: Card = {
  id: 'preview-back',
  suit: 'spades',
  rank: 'A',
  value: 1,
  isRevealed: false,
  isPenalty: false,
};

const PREVIEW_FRONT_CARD: Card = {
  id: 'preview-front',
  suit: 'hearts',
  rank: 'K',
  value: -1,
  isRevealed: true,
  isPenalty: false,
};

export function CustomizationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const lang = useLangStore(s => s.lang);
  const {
    cardBack,
    cardFront,
    tableTheme,
    setCardBack,
    setCardFront,
    setTableTheme,
  } = useCustomizationStore();

  const BACK_OPTIONS: { id: CardBackSkin; labelTr: string; labelEn: string; tagTr: string; tagEn: string }[] = [
    {
      id: 'classic_red',
      labelTr: 'Klasik İskambil (Kırmızı)',
      labelEn: 'Classic Playing Card (Red)',
      tagTr: 'Varsayılan',
      tagEn: 'Default',
    },
    {
      id: 'classic_blue',
      labelTr: 'Klasik İskambil (Mavi)',
      labelEn: 'Classic Playing Card (Blue)',
      tagTr: 'Klasik',
      tagEn: 'Classic',
    },
    {
      id: 'royal_compass',
      labelTr: 'Gece Pusulası',
      labelEn: 'Midnight Compass',
      tagTr: 'Özel Seri',
      tagEn: 'Special',
    },
    {
      id: 'emerald_botanical',
      labelTr: 'Zümrüt Botanik',
      labelEn: 'Emerald Lattice',
      tagTr: 'Özel Seri',
      tagEn: 'Special',
    },
  ];

  const FRONT_OPTIONS: { id: CardFrontStyle; labelTr: string; labelEn: string }[] = [
    { id: 'classic', labelTr: 'Saf Beyaz İskambil', labelEn: 'Crisp White Playing Card' },
    { id: 'vintage', labelTr: 'Krem Parşömen', labelEn: 'Warm Vintage Cream' },
  ];

  const TABLE_OPTIONS: { id: TableTheme; labelTr: string; labelEn: string; previewColor: string }[] = [
    { id: 'emerald', labelTr: 'Klasik Yeşil Çuha', labelEn: 'Classic Green Felt', previewColor: '#246b53' },
    { id: 'ocean', labelTr: 'Okyanus Mavisi', labelEn: 'Royal Ocean Blue', previewColor: '#1e4e6e' },
    { id: 'burgundy', labelTr: 'Bordo Kadife', labelEn: 'Velvet Burgundy', previewColor: '#5c202e' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl rounded-3xl luxury-panel overflow-hidden flex flex-col max-h-[88dvh]"
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Başlık */}
            <div className="luxury-panel-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-300/35 flex items-center justify-center text-lg">
                  🎨
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                    {lang === 'tr' ? 'KART & MASA TASARIMI' : 'CARD & TABLE CUSTOMIZATION'}
                  </h2>
                  <p className="text-[11px] text-emerald-100/65 font-medium">
                    {lang === 'tr'
                      ? 'Kart görünümünü ve masa rengini kendine göre özelleştir'
                      : 'Personalize your playing cards and table mat'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* İçerik */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* 1. KART ARKASI SEÇİMİ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#f7e2ab]">
                    {lang === 'tr' ? '1. Kart Sırtı Tasarımı' : '1. Card Back Design'}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    {lang === 'tr' ? 'Ücretsiz Koleksiyon' : 'Free Collection'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {BACK_OPTIONS.map((opt) => {
                    const active = cardBack === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCardBack(opt.id)}
                        className={`flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400/15 border-[#f7e2ab] shadow-[0_0_20px_rgba(232,196,104,0.25)]'
                            : 'bg-black/25 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="pointer-events-none">
                          <GameCard
                            card={{ ...PREVIEW_BACK_CARD, id: `preview-${opt.id}` }}
                            size="sm"
                            overrideBackSkin={opt.id}
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-[11px] font-bold text-white leading-tight">
                            {lang === 'tr' ? opt.labelTr : opt.labelEn}
                          </div>
                          <span className="text-[9px] font-semibold text-emerald-200/60">
                            {lang === 'tr' ? opt.tagTr : opt.tagEn}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. KART ÖN YÜZÜ STİLİ */}
              <div>
                <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-[#f7e2ab] mb-3">
                  {lang === 'tr' ? '2. Kart Ön Yüzü Kağıt Rengi' : '2. Card Face Paper Style'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {FRONT_OPTIONS.map((opt) => {
                    const active = cardFront === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCardFront(opt.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400/15 border-[#f7e2ab]'
                            : 'bg-black/25 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="pointer-events-none shrink-0">
                          <GameCard
                            card={{ ...PREVIEW_FRONT_CARD, id: `preview-front-${opt.id}` }}
                            size="xs"
                          />
                        </div>
                        <span className="text-xs font-bold text-white text-left">
                          {lang === 'tr' ? opt.labelTr : opt.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. MASA ÖRTÜSÜ RENGİ */}
              <div>
                <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-[#f7e2ab] mb-3">
                  {lang === 'tr' ? '3. Masa Rengi' : '3. Table Mat Color'}
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {TABLE_OPTIONS.map((opt) => {
                    const active = tableTheme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTableTheme(opt.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400/15 border-[#f7e2ab]'
                            : 'bg-black/25 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-xl border border-white/25 shadow-inner"
                          style={{ backgroundColor: opt.previewColor }}
                        />
                        <span className="text-[11px] font-bold text-white text-center">
                          {lang === 'tr' ? opt.labelTr : opt.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Alt Buton */}
            <div className="px-6 py-4 bg-black/30 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-gold-3d px-6 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider cursor-pointer"
              >
                {lang === 'tr' ? 'Tamam & Uygula' : 'Apply & Done'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
