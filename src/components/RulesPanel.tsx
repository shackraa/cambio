import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function RulesPanel() {
  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];
  const activePower = useGameStore(s => s.activePower);
  const phase = useGameStore(s => s.phase);

  const [activeTab, setActiveTab] = useState<'powers' | 'rules'>('powers');

  const CARD_POWERS = [
    {
      id: 'red_king',
      cards: 'K ♥♦',
      value: '−1 pt',
      title: t.note_valuable,
      desc: lang === 'tr' ? 'Oyundaki en düşük puanlı kart' : 'Lowest point card in the deck',
      accent: '#fbbf24',
      activeMatch: false,
    },
    {
      id: 'joker',
      cards: 'JOKER',
      value: '0 pt',
      title: t.note_zero,
      desc: lang === 'tr' ? 'Hiç puan eklemez' : 'Adds zero points to hand',
      accent: '#c084fc',
      activeMatch: false,
    },
    {
      id: 'low',
      cards: 'A – 6',
      value: '1–6 pt',
      title: lang === 'tr' ? 'Standart Kartlar' : 'Standard Cards',
      desc: lang === 'tr' ? 'Sayı değeri kadar puan yazar' : 'Worth their face value',
      accent: '#94a3b8',
      activeMatch: false,
    },
    {
      id: 'peek_own',
      cards: '7 – 8',
      value: '7–8 pt',
      title: t.power_7_8,
      desc: lang === 'tr' ? 'Desteden çekip çöpe atınca aktif' : 'Draw from deck & discard to use',
      accent: '#a78bfa',
      activeMatch: phase === 'power' && activePower === 'peek_own',
    },
    {
      id: 'peek_other',
      cards: '9 – 10',
      value: '9–10 pt',
      title: t.power_9_10,
      desc: lang === 'tr' ? 'Desteden çekip çöpe atınca aktif' : 'Draw from deck & discard to use',
      accent: '#34d399',
      activeMatch: phase === 'power' && activePower === 'peek_other',
    },
    {
      id: 'blind_swap',
      cards: 'J – Q',
      value: '10 pt',
      title: t.power_J_Q,
      desc: lang === 'tr' ? 'Bakmadan iki kartın yerini değiştir' : 'Swap 2 cards without looking',
      accent: '#fb923c',
      activeMatch: phase === 'power' && activePower === 'blind_swap',
    },
    {
      id: 'spy_swap',
      cards: 'K ♠♣',
      value: '10 pt',
      title: t.power_K_black,
      desc: lang === 'tr' ? 'Önce rakip kartı gör, istersen takasla' : 'Look at opponent card, then swap',
      accent: '#f87171',
      activeMatch: phase === 'power' && activePower === 'spy_swap',
    },
  ];

  const RULES = [
    { step: '01', title: lang === 'tr' ? 'Amaç' : 'Objective', text: t.rule_1 },
    { step: '02', title: lang === 'tr' ? 'İlk Bakış' : 'Initial Peek', text: t.rule_2 },
    { step: '03', title: lang === 'tr' ? 'Sıra Akışı' : 'Turn Action', text: t.rule_3 },
    { step: '04', title: lang === 'tr' ? 'Yapıştırma' : 'Sticking Cards', text: t.rule_5 },
    { step: '05', title: lang === 'tr' ? 'Hatalı Yapıştırma' : 'Wrong Stick', text: t.rule_6 },
    { step: '06', title: 'CAMBIO', text: t.rule_4 },
  ];

  return (
    <div
      className="flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8, 36, 25, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28)',
      }}
    >
      {/* Başlık + Sekme Geçişi */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 shrink-0 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          <h3 className="text-white/90 font-bold text-xs uppercase tracking-[0.12em]">
            {lang === 'tr' ? 'REHBER' : 'GUIDE'}
          </h3>
        </div>

        {/* Sekme Butonları */}
        <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveTab('powers')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'powers'
                ? 'bg-[var(--gold)] text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.powersSubtitle}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-[var(--gold)] text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.howToPlaySubtitle}
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <AnimatePresence mode="wait">
          {activeTab === 'powers' ? (
            <motion.div
              key="powers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-1.5"
            >
              {CARD_POWERS.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all border ${
                    row.activeMatch
                      ? 'bg-[var(--gold)]/15 border-[var(--gold)] shadow-[0_0_16px_rgba(212,168,67,0.3)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06]'
                  }`}
                >
                  {/* Kart Sembol Kutusu */}
                  <div
                    className="w-13 h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-xs tracking-tight border"
                    style={{
                      backgroundColor: row.accent + '15',
                      borderColor: row.accent + '40',
                      color: row.accent,
                    }}
                  >
                    {row.cards}
                  </div>

                  {/* Açıklama */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {row.title}
                      </span>
                      <span className="text-[10px] font-bold text-white/55 font-mono shrink-0">
                        {row.value}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/45 truncate mt-0.5">
                      {row.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="rules"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {RULES.map((rule) => (
                <div
                  key={rule.step}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <span className="text-[11px] font-black font-mono text-[var(--gold)] bg-[var(--gold)]/15 border border-[var(--gold)]/30 rounded-md px-1.5 py-0.5 shrink-0 mt-0.5">
                    {rule.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">
                      {rule.title}
                    </div>
                    <p className="text-[11px] text-white/65 leading-relaxed mt-0.5">
                      {rule.text}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
