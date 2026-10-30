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
      rank: 'K',
      suit: '♥♦',
      isRed: true,
      value: '−1 pt',
      title: t.note_valuable,
      desc: lang === 'tr' ? 'Oyundaki en değerli kart, puanı düşürür' : 'Best card in the game, subtracts 1 pt',
      badgeColor: '#fbbf24',
      activeMatch: false,
    },
    {
      id: 'joker',
      rank: '★',
      suit: 'JKR',
      isRed: false,
      value: '0 pt',
      title: t.note_zero,
      desc: lang === 'tr' ? 'El puanına hiç yük bindirmez' : 'Zero points, safe to keep',
      badgeColor: '#c084fc',
      activeMatch: false,
    },
    {
      id: 'peek_own',
      rank: '7·8',
      suit: '♠♥',
      isRed: false,
      value: '7–8 pt',
      title: t.power_7_8,
      desc: lang === 'tr' ? 'Desteden çekip çöpe atınca 1 kartına bak' : 'Discard from deck to peek 1 own card',
      badgeColor: '#a78bfa',
      activeMatch: phase === 'power' && activePower === 'peek_own',
    },
    {
      id: 'peek_other',
      rank: '9·10',
      suit: '♣♦',
      isRed: true,
      value: '9–10 pt',
      title: t.power_9_10,
      desc: lang === 'tr' ? 'Desteden çekip çöpe atınca rakip kartına bak' : 'Discard from deck to peek opponent card',
      badgeColor: '#34d399',
      activeMatch: phase === 'power' && activePower === 'peek_other',
    },
    {
      id: 'blind_swap',
      rank: 'J·Q',
      suit: '♠♦',
      isRed: false,
      value: '10 pt',
      title: t.power_J_Q,
      desc: lang === 'tr' ? 'Bakmadan kendi kartınla rakip kartını değiştir' : 'Swap your card with an opponent blindly',
      badgeColor: '#fb923c',
      activeMatch: phase === 'power' && activePower === 'blind_swap',
    },
    {
      id: 'spy_swap',
      rank: 'K',
      suit: '♠♣',
      isRed: false,
      value: '10 pt',
      title: t.power_K_black,
      desc: lang === 'tr' ? 'Önce rakip kartını gör, istersen takasla' : 'Look at opponent card first, then swap',
      badgeColor: '#f87171',
      activeMatch: phase === 'power' && activePower === 'spy_swap',
    },
  ];

  const RULES = [
    { step: '01', title: lang === 'tr' ? 'En Düşük Puan Kazanır' : 'Lowest Score Wins', text: t.rule_1 },
    { step: '02', title: lang === 'tr' ? 'İlk 2 Kartı Ezberle' : 'Memorize 2 Cards', text: t.rule_2 },
    { step: '03', title: lang === 'tr' ? 'Çek, Değiştir veya At' : 'Draw, Swap or Discard', text: t.rule_3 },
    { step: '04', title: lang === 'tr' ? 'Aynı Kartı Yapıştır' : 'Stick Matching Cards', text: t.rule_5 },
    { step: '05', title: lang === 'tr' ? 'Ceza Kartına Dikkat' : 'Watch Out for Penalties', text: t.rule_6 },
    { step: '06', title: 'CAMBIO!', text: t.rule_4 },
  ];

  return (
    <div className="luxury-panel flex flex-col flex-1 min-h-0 rounded-[24px] overflow-hidden">
      {/* Lüks Başlık + Sekme Seçici */}
      <div className="luxury-panel-header flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--gold-light)]/25 to-[var(--gold)]/10 border border-[var(--gold)]/45 flex items-center justify-center shadow-inner">
              <svg className="w-4 h-4 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h3 className="text-amber-50 font-extrabold text-xs uppercase tracking-[0.16em] font-['Cinzel']">
                {lang === 'tr' ? 'OYUN REHBERİ' : 'GAME GUIDE'}
              </h3>
              <span className="text-[10px] text-emerald-200/55 font-medium mt-0.5">
                {lang === 'tr' ? 'Kart Güçleri & Kurallar' : 'Powers & Rules'}
              </span>
            </div>
          </div>
        </div>

        {/* Geniş, Ferah Sekme Anahtarı */}
        <div className="grid grid-cols-2 bg-black/40 p-1 rounded-xl border border-[var(--gold)]/25 shadow-inner gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('powers')}
            className={`py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'powers'
                ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black shadow-sm'
                : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            {t.powersSubtitle}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black shadow-sm'
                : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            {t.howToPlaySubtitle}
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 scrollbar-thin">
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
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all border ${
                    row.activeMatch
                      ? 'bg-gradient-to-r from-[var(--gold)]/25 to-emerald-900/50 border-[var(--gold)] shadow-[0_0_22px_rgba(212,168,67,0.35)] scale-[1.01]'
                      : 'bg-black/25 hover:bg-black/35 border-white/[0.07]'
                  }`}
                >
                  {/* Gerçek Minyatür Oyun Kartı İllüstrasyonu */}
                  <div
                    className="w-10 h-14 rounded-lg flex flex-col items-center justify-between p-1.5 shrink-0 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #fffdf7 0%, #f3e5c2 100%)',
                      border: '1.5px solid rgba(212, 168, 67, 0.75)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                    }}
                  >
                    <span
                      className={`text-[9px] font-black leading-none self-start ${
                        row.isRed ? 'text-[#c0392b]' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {row.rank}
                    </span>
                    <span
                      className={`text-[11px] font-black leading-none ${
                        row.isRed ? 'text-[#c0392b]' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {row.suit}
                    </span>
                    <span
                      className="text-[7px] font-black px-1 rounded bg-black/10 text-black/75 font-['JetBrains_Mono']"
                    >
                      {row.value.replace(' pt', '')}
                    </span>
                  </div>

                  {/* Açıklama */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-amber-50 truncate">
                        {row.title}
                      </span>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 font-['JetBrains_Mono']"
                        style={{
                          backgroundColor: `${row.badgeColor}20`,
                          color: row.badgeColor,
                          border: `1px solid ${row.badgeColor}45`,
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100/65 leading-snug mt-0.5 font-medium">
                      {row.desc}
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
              {RULES.map((rule) => (
                <div
                  key={rule.step}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-black/25 hover:bg-black/35 border border-white/[0.07] transition-colors"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#fae19c]/25 to-[#b88728]/15 border border-[var(--gold)]/45 flex items-center justify-center text-[11px] font-black font-['JetBrains_Mono'] text-[var(--gold-light)] shrink-0 mt-0.5 shadow-inner">
                    {rule.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-amber-50">
                      {rule.title}
                    </div>
                    <p className="text-[11px] text-emerald-100/70 leading-relaxed mt-0.5 font-medium">
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
