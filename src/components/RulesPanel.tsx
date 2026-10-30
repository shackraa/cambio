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
      id: 'low',
      cards: 'A / 2–6',
      suitIcon: '♠♥',
      value: '1 – 6 pt',
      power: null,
      note: lang === 'tr' ? 'Düşük puanlı güvenli kartlar' : 'Low point safe cards',
      color: '#a7f3d0',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      activeMatch: false,
    },
    {
      id: 'peek_own',
      cards: '7 – 8',
      suitIcon: '👁️',
      value: '7 – 8 pt',
      power: t.power_7_8,
      color: '#c4b5fd',
      badgeBg: 'rgba(139, 92, 246, 0.2)',
      activeMatch: phase === 'power' && activePower === 'peek_own',
    },
    {
      id: 'peek_other',
      cards: '9 – 10',
      suitIcon: '🔍',
      value: '9 – 10 pt',
      power: t.power_9_10,
      color: '#6ee7b7',
      badgeBg: 'rgba(52, 211, 153, 0.2)',
      activeMatch: phase === 'power' && activePower === 'peek_other',
    },
    {
      id: 'blind_swap',
      cards: 'J – Q',
      suitIcon: '🔀',
      value: '10 pt',
      power: t.power_J_Q,
      color: '#fdba74',
      badgeBg: 'rgba(251, 146, 60, 0.2)',
      activeMatch: phase === 'power' && activePower === 'blind_swap',
    },
    {
      id: 'spy_swap',
      cards: 'K ♠♣',
      suitIcon: '🕵️',
      value: '10 pt',
      power: t.power_K_black,
      color: '#fca5a5',
      badgeBg: 'rgba(248, 113, 113, 0.2)',
      activeMatch: phase === 'power' && activePower === 'spy_swap',
    },
    {
      id: 'red_king',
      cards: 'K ♥♦',
      suitIcon: '👑',
      value: '−1 pt',
      power: null,
      note: t.note_valuable,
      color: '#fde047',
      badgeBg: 'rgba(250, 204, 21, 0.22)',
      activeMatch: false,
    },
    {
      id: 'joker',
      cards: 'Joker',
      suitIcon: '🃏',
      value: '0 pt',
      power: null,
      note: t.note_zero,
      color: '#e879f9',
      badgeBg: 'rgba(217, 70, 239, 0.2)',
      activeMatch: false,
    },
  ];

  const RULES = [
    { icon: '🎯', title: lang === 'tr' ? 'Hedef' : 'Goal', text: t.rule_1 },
    { icon: '👁️', title: lang === 'tr' ? 'Başlangıç' : 'Start', text: t.rule_2 },
    { icon: '🔄', title: lang === 'tr' ? 'Sıra Akışı' : 'Turn Flow', text: t.rule_3 },
    { icon: '⚡', title: lang === 'tr' ? 'Yapıştırma' : 'Sticking', text: t.rule_5 },
    { icon: '⚠️', title: lang === 'tr' ? 'Ceza Kuralı' : 'Penalty', text: t.rule_6 },
    { icon: '🏆', title: 'CAMBIO!', text: t.rule_4 },
  ];

  return (
    <div
      className="flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden shadow-lg"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 62, 43, 0.78) 0%, rgba(7, 38, 26, 0.85) 100%)',
        border: '1px solid rgba(212, 168, 67, 0.22)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Başlık + Sekme Geçişi */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-2 shrink-0 bg-emerald-950/45"
        style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.15)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 rounded-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">
            {lang === 'tr' ? 'Oyun Rehberi' : 'Game Guide'}
          </h3>
        </div>

        {/* Sekme Butonları */}
        <div className="flex bg-emerald-950/80 p-0.5 rounded-xl border border-emerald-400/15">
          <button
            type="button"
            onClick={() => setActiveTab('powers')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'powers'
                ? 'bg-[var(--gold)] text-black shadow-sm'
                : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            ⚡ {t.powersSubtitle}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-[var(--gold)] text-black shadow-sm'
                : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            📖 {t.howToPlaySubtitle}
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin">
        <AnimatePresence mode="wait">
          {activeTab === 'powers' ? (
            <motion.div
              key="powers"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {CARD_POWERS.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${
                    row.activeMatch
                      ? 'bg-[var(--gold)]/20 border-[var(--gold)] shadow-[0_0_16px_rgba(212,168,67,0.35)] scale-[1.01]'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/40 border-emerald-400/10'
                  }`}
                >
                  {/* Mini Kart İkonu */}
                  <div
                    className="w-11 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border border-white/15 shadow-xs"
                    style={{ background: row.badgeBg }}
                  >
                    <span className="text-xs font-black leading-none" style={{ color: row.color }}>
                      {row.cards}
                    </span>
                    <span className="text-xs mt-1 leading-none">{row.suitIcon}</span>
                  </div>

                  {/* Açıklama */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white">
                        {row.power ?? row.note}
                      </span>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: row.badgeBg,
                          color: row.color,
                          border: `1px solid ${row.color}40`,
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-100/55 mt-0.5">
                      {row.power
                        ? lang === 'tr'
                          ? 'Desteden çekip çöpe atınca aktif olur'
                          : 'Activates when drawn from deck & discarded'
                        : lang === 'tr'
                          ? 'Özel güç yok — el puanını düşürür'
                          : 'No active power — lowers hand score'}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {RULES.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-400/10 hover:bg-emerald-900/35 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {rule.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--gold)]">
                        {i + 1}. {rule.title}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-50/85 font-medium leading-relaxed mt-0.5">
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
