import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { GameCard } from './GameCard';

interface PeekPhaseProps {
  myCards: ReturnType<typeof useGameStore.getState>['players'][0]['cards'];
  onDone: () => void;
}

export function PeekPhase({ myCards, onDone }: PeekPhaseProps) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          setTimeout(() => onDone(), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDone]);

  const peekPositions = [0, 1];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6
                 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-[var(--felt-mid)] border border-[var(--gold)]/40 rounded-3xl
                   p-8 flex flex-col items-center gap-6 max-w-lg w-full mx-4"
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="text-[var(--gold)] text-4xl">👀</div>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl">İlk 2 kartına bak!</h2>
          <p className="text-white/50 text-sm mt-1">
            Bu kartları ezberle — artık bir daha göremeyeceksin.
          </p>
        </div>

        {/* 4 kart — bakılanlar açık, diğerleri kapalı */}
        <div className="flex gap-4 items-end">
          {myCards.map((card, i) => {
            const isPeeked = peekPositions.includes(i);
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                {/* Parlama efekti sadece bakılan kartlarda */}
                <motion.div
                  className="relative"
                  animate={isPeeked ? {
                    filter: [
                      'drop-shadow(0 0 8px rgba(212,168,67,0.5))',
                      'drop-shadow(0 0 18px rgba(212,168,67,0.9))',
                      'drop-shadow(0 0 8px rgba(212,168,67,0.5))',
                    ],
                  } : {}}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                >
                  {/* Kart */}
                  <GameCard
                    card={{ ...card, isRevealed: isPeeked }}
                    size="lg"
                  />

                  {/* Kapalı kart üstüne ? overlay */}
                  {!isPeeked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-[10px]
                                    bg-black/20">
                      <span className="text-white/30 text-2xl font-bold">?</span>
                    </div>
                  )}
                </motion.div>

                {/* Etiket */}
                <span
                  className="text-[11px] font-bold"
                  style={{
                    color: isPeeked ? 'rgba(212,168,67,0.95)' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {isPeeked ? `👁 Kart ${i + 1}` : `Kart ${i + 1}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bilgi notu */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(212,168,67,0.1)',
            border: '1px solid rgba(212,168,67,0.2)',
          }}
        >
          <span>💡</span>
          <span className="text-white/60">
            Diğer oyuncular da kendi ilk 2 kartlarına bakıyor. Oyun başlayınca değerleri aklında tut!
          </span>
        </div>

        {/* Timer + Buton */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 bg-[var(--gold)]/20 rounded-full overflow-hidden"
              style={{ width: 140 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--gold)' }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>
            <span className="text-[var(--gold)] font-bold tabular-nums text-sm">{timeLeft}s</span>
          </div>

          <motion.button
            className="px-6 py-2 bg-[var(--gold)] text-black font-bold rounded-xl text-sm w-full"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onDone}
          >
            Ezberledim ✓
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
