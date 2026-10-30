import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { formatPlayerName } from '../utils/formatPlayerName';

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  joker: '★',
};

function MiniCardChip({ rank, suit }: { rank: string; suit: string }) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const displayRank = rank === 'Joker' ? 'J' : rank;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#fffdf9] border text-[11px] font-black leading-none shadow-xs select-none ${
        isRed
          ? 'border-red-300 text-[#d91b24]'
          : 'border-slate-300 text-[#111827]'
      }`}
    >
      <span>{displayRank}</span>
      <span className="text-[10px]">{SUIT_SYMBOL[suit] ?? '♠'}</span>
    </span>
  );
}

export function StickFeedbackBanner() {
  const feedback = useGameStore((s) => s.lastStickFeedback);
  const lang = useLangStore((s) => s.lang);

  return (
    <AnimatePresence mode="wait">
      {feedback && (
        <motion.div
          key={feedback.id}
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.94 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none z-[120]"
        >
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-[0_8px_24px_rgba(0,0,0,0.45)] whitespace-nowrap ${
              feedback.success
                ? 'bg-emerald-950/95 border-emerald-400/60'
                : 'bg-[#2b0c10]/95 border-red-400/60'
            }`}
          >
            {/* Oyuncu Adı */}
            <span className="text-xs font-extrabold text-white">
              {formatPlayerName(feedback.playerName, lang)}
            </span>

            {/* İki Kartın Kompakt Karşılaştırması */}
            <div className="flex items-center gap-1">
              <MiniCardChip
                rank={feedback.selectedCard.rank}
                suit={feedback.selectedCard.suit}
              />
              <span
                className={`text-xs font-black px-0.5 ${
                  feedback.success ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {feedback.success ? '=' : '≠'}
              </span>
              <MiniCardChip
                rank={feedback.discardCard.rank}
                suit={feedback.discardCard.suit}
              />
            </div>

            {/* Kısa ve Öz Sonuç Etiketi */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                feedback.success
                  ? 'bg-emerald-400/25 text-emerald-200 border border-emerald-400/40'
                  : 'bg-red-500/30 text-red-200 border border-red-400/45'
              }`}
            >
              {feedback.success
                ? lang === 'tr'
                  ? '✓ Elendi'
                  : '✓ Stuck'
                : lang === 'tr'
                  ? '+1 Ceza'
                  : '+1 Penalty'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
