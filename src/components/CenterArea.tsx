import { motion, AnimatePresence } from 'framer-motion';
import { GameCard } from './GameCard';
import type { Card } from '../types/game';

interface CenterAreaProps {
  deckCount: number;
  discardPile: Card[];
  onDrawFromDeck?: () => void;
  onDrawFromDiscard?: () => void;
  canDraw?: boolean;
  roomCode: string;
}

export function CenterArea({
  deckCount,
  discardPile,
  onDrawFromDeck,
  onDrawFromDiscard,
  canDraw,
  roomCode,
}: CenterAreaProps) {
  const topDiscard = discardPile[discardPile.length - 1] ?? null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Oda kodu */}
      <div className="px-4 py-1 bg-black/40 border border-[var(--gold)]/30 rounded-full">
        <span className="text-[var(--gold)] text-xs font-bold tracking-widest">{roomCode}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Deste (Deck) */}
        <motion.div
          className="flex flex-col items-center gap-1 cursor-pointer"
          whileHover={canDraw ? { scale: 1.05 } : {}}
          whileTap={canDraw ? { scale: 0.95 } : {}}
          onClick={onDrawFromDeck}
        >
          <div className="relative w-16 h-24">
            {/* Deste derinliği efekti */}
            {[2, 1, 0].map((offset) => (
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
          </div>
          <span className="text-xs text-white/60 mt-1">
            📦 {deckCount} kart
          </span>
        </motion.div>

        {/* Çöp destesi */}
        <motion.div
          className="flex flex-col items-center gap-1 cursor-pointer"
          whileHover={canDraw && topDiscard ? { scale: 1.05 } : {}}
          whileTap={canDraw && topDiscard ? { scale: 0.95 } : {}}
          onClick={topDiscard ? onDrawFromDiscard : undefined}
        >
          <AnimatePresence mode="popLayout">
            {topDiscard ? (
              <motion.div
                key={topDiscard.id}
                initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: Math.random() * 10 - 5, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <GameCard card={topDiscard} size="md" />
              </motion.div>
            ) : (
              <div className="w-16 h-24 rounded-[10px] border-2 border-dashed border-white/20 flex items-center justify-center">
                <span className="text-white/30 text-2xl">🗑</span>
              </div>
            )}
          </AnimatePresence>
          <span className="text-xs text-white/60 mt-1">🗑 Çöp</span>
        </motion.div>
      </div>
    </div>
  );
}
