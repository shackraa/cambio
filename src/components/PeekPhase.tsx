import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CardGrid } from './CardGrid';

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

  // Peek için ilk 2 kartı açık göster
  const peekCards = myCards.map((c, i) => ({ ...c, isRevealed: i < 2 }));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6
                 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-[var(--felt-mid)] border border-[var(--gold)]/40 rounded-3xl
                   p-8 flex flex-col items-center gap-5 max-w-sm w-full mx-4"
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="text-[var(--gold)] text-4xl">👀</div>
        <h2 className="text-white font-bold text-xl text-center">
          İlk 2 kartına bak!
        </h2>
        <p className="text-white/60 text-sm text-center">
          Bu kartları ezberle — artık bir daha göremeyeceksin.
        </p>

        <CardGrid cards={peekCards} size="lg" />

        <div className="flex items-center gap-2">
          <div
            className="h-1.5 bg-[var(--gold)]/30 rounded-full overflow-hidden"
            style={{ width: 120 }}
          >
            <motion.div
              className="h-full bg-[var(--gold)] rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
            />
          </div>
          <span className="text-[var(--gold)] font-bold tabular-nums">{timeLeft}s</span>
        </div>

        <motion.button
          className="px-6 py-2 bg-[var(--gold)] text-black font-bold rounded-xl text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDone}
        >
          Ezberledim ✓
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
