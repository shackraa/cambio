import { motion, AnimatePresence } from 'framer-motion';
import { GameCard } from './GameCard';
import type { Card } from '../types/game';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

interface CenterAreaProps {
  deckCount: number;
  topDeckCard?: Card;
  discardPile: Card[];
  onDrawFromDeck?: () => void;
  onDrawFromDiscard?: () => void;
  canDraw?: boolean;
  myPlayerId?: string;
}

// Kart id'sinden deterministik rotasyon üret — re-render'da titreme yapmaz
function stableRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return ((hash % 17) - 8); // -8 ile +8 derece arası
}

export function CenterArea({
  deckCount,
  topDeckCard,
  discardPile,
  onDrawFromDeck,
  onDrawFromDiscard,
  canDraw,
  myPlayerId,
}: CenterAreaProps) {
  const topDiscard = discardPile[discardPile.length - 1] ?? null;

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <div className="flex items-center gap-6 relative z-10">
        {/* Deste (Deck) */}
        <motion.div
          className={`flex flex-col items-center gap-1 ${canDraw ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
          whileHover={canDraw ? { scale: 1.05 } : {}}
          whileTap={canDraw ? { scale: 0.95 } : {}}
          onClick={canDraw ? onDrawFromDeck : undefined}
        >
          <div className="relative w-20 h-28">
            {/* Deste derinliği efekti (Alttaki statik kartlar) */}
            {[2, 1].map((offset) => (
              <div
                key={offset}
                className="absolute card-back rounded-[10px] border-2 border-[var(--gold)]/50"
                style={{
                  width: '100%',
                  height: '100%',
                  top: -offset * 2,
                  left: offset * 1,
                  background: 'linear-gradient(135deg, #1e2d5a 0%, #0f1a3d 100%)',
                  zIndex: 3 - offset,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                }}
              />
            ))}
            {/* EN ÜSTTEKİ KART (Layout Animasyonu İçin) */}
            {topDeckCard && (
              <div className="absolute top-0 left-0 w-full h-full z-10" style={{ transform: 'translate(0px, 0px)' }}>
                <GameCard card={{ ...topDeckCard, isRevealed: false }} size="lg" />
              </div>
            )}
          </div>
          <span className="text-xs text-white/60 mt-1">
            📦 {t.cardCount(deckCount)}
          </span>
        </motion.div>

        {/* Çöp destesi */}
        <motion.div
          className={`flex flex-col items-center gap-1 ${canDraw && topDiscard ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
          whileHover={canDraw && topDiscard ? { scale: 1.05 } : {}}
          whileTap={canDraw && topDiscard ? { scale: 0.95 } : {}}
          onClick={canDraw && topDiscard ? onDrawFromDiscard : undefined}
        >
          <div className="relative w-20 h-28">
            <AnimatePresence mode="wait">
              {topDiscard ? (
                <motion.div
                  key={topDiscard.id}
                  className="absolute inset-0"
                  initial={{ scale: 0.4, y: -80, rotate: -25, opacity: 0 }}
                  animate={{ scale: 1, rotate: stableRotation(topDiscard.id), opacity: 1, y: 0 }}
                  exit={{ scale: 0.6, rotate: 20, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22, duration: 0.4 }}
                >
                  <GameCard card={topDiscard} size="lg" />
                </motion.div>
              ) : (
                <div className="w-20 h-28 border-2 border-dashed border-white/20 rounded-[10px] flex items-center justify-center bg-black/10">
                  <span className="text-white/30 text-2xl">🗑️</span>
                </div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-xs text-white/60 mt-1">🗑 {t.discardPile}</span>
        </motion.div>
      </div>
    </div>
  );
}
