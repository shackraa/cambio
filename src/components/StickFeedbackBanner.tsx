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

function MiniCardBadge({ rank, suit }: { rank: string; suit: string }) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const displayRank = rank === 'Joker' ? 'JKR' : rank;
  return (
    <div
      className={`w-9 h-12 rounded-lg bg-[#fffdf9] border-2 flex flex-col items-center justify-center shadow-md shrink-0 select-none ${
        isRed ? 'border-red-300 text-[#c81e1e]' : 'border-slate-300 text-[#14171f]'
      }`}
    >
      <span className="text-xs font-black leading-none tracking-tighter">
        {displayRank}
      </span>
      <span className="text-xs leading-none mt-0.5">
        {SUIT_SYMBOL[suit] ?? '♠'}
      </span>
    </div>
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
          initial={{ opacity: 0, y: 12, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24 }}
          className="pointer-events-none z-[120]"
        >
          <div
            className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-[0_14px_36px_rgba(0,0,0,0.5)] ${
              feedback.success
                ? 'bg-emerald-950/95 border-emerald-400/60'
                : 'bg-[#2b0c10]/95 border-red-400/60'
            }`}
          >
            {/* İki Kartın Görsel Karşılaştırması */}
            <div className="flex items-center gap-1.5">
              <MiniCardBadge
                rank={feedback.selectedCard.rank}
                suit={feedback.selectedCard.suit}
              />
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  feedback.success
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                    : 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                }`}
              >
                {feedback.success ? '=' : '≠'}
              </div>
              <MiniCardBadge
                rank={feedback.discardCard.rank}
                suit={feedback.discardCard.suit}
              />
            </div>

            {/* Açıklama ve Sonuç Rozeti */}
            <div className="flex flex-col text-left pr-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white">
                  {formatPlayerName(feedback.playerName, lang)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    feedback.success
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                      : 'bg-red-500/25 text-red-200 border border-red-400/45'
                  }`}
                >
                  {feedback.success
                    ? lang === 'tr'
                      ? '✓ KART ELENDİ (-1)'
                      : '✓ CARD STUCK (-1)'
                    : lang === 'tr'
                      ? '+1 CEZA KARTI'
                      : '+1 PENALTY CARD'}
                </span>
              </div>
              <span
                className={`text-[11px] font-semibold mt-0.5 ${
                  feedback.success ? 'text-emerald-200/85' : 'text-red-200/85'
                }`}
              >
                {feedback.success
                  ? lang === 'tr'
                    ? 'Aynı değerdeki kart başarıyla ortaya yapıştırıldı!'
                    : 'Matching card successfully stuck to the center!'
                  : lang === 'tr'
                    ? 'Kartlar eşleşmedi, desteden 1 ceza kartı eklendi.'
                    : 'Cards did not match, 1 penalty card added from deck.'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
