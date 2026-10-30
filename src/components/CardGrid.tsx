import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '../types/game';
import { GameCard } from './GameCard';
import { useLangStore } from '../store/useLangStore';

interface CardGridProps {
  cards: Card[];
  size?: 'sm' | 'md' | 'lg';
  canInteract?: boolean;
  onCardClick?: (position: number) => void;
  highlightPositions?: number[];
  peekPositions?: number[];   // peek fazında veya güç kullanımında bakılan kart pozisyonları
  swapHighlightPositions?: number[]; // takas öncesi/sırasında parlayan slotlar
  direction?: 'horizontal' | 'vertical';
  isDealing?: boolean;
  isHighlighting?: boolean;
  playerPosition?: 'bottom' | 'top' | 'left' | 'right';
}

export function CardGrid({
  cards,
  size = 'md',
  canInteract,
  onCardClick,
  highlightPositions = [],
  peekPositions = [],
  swapHighlightPositions = [],
  direction = 'horizontal',
  isDealing = false,
  isHighlighting = false,
  playerPosition = 'bottom',
}: CardGridProps) {
  const lang = useLangStore((s) => s.lang);
  const isSidePlayer = playerPosition === 'left' || playerPosition === 'right';

  // Sol/sağ oyuncuların kartları tek sıra dikey (alt alta) dizilir ve her kart yan (landscape: w-28 h-20) durur!
  const gridClass = direction === 'vertical'
    ? 'flex flex-col justify-center items-center gap-2.5'
    : 'flex flex-row justify-center items-center gap-3';

  return (
    <div className={gridClass}>
      {cards.map((card, i) => {
        const isSwapHighlighted = swapHighlightPositions.includes(i);
        const isPeeked = peekPositions.includes(i);

        // "Bakıyor" rozeti konumu: kartın hemen kenarına zarifçe oturur, ortadaki yazılara veya yanındaki karta asla çarpmaz
        const badgePosClass =
          playerPosition === 'bottom'
            ? '-top-3.5 left-1/2 -translate-x-1/2'
            : playerPosition === 'top'
              ? '-bottom-3.5 left-1/2 -translate-x-1/2'
              : playerPosition === 'left'
                ? 'left-[calc(100%+6px)] top-1/2 -translate-y-1/2'
                : 'right-[calc(100%+6px)] top-1/2 -translate-y-1/2';

        return (
          <div
            key={card.id}
            className="relative"
            style={{ zIndex: isSwapHighlighted || isPeeked ? 40 : i + 1 }}
          >
            <GameCard
              card={card}
              size={size}
              orientation={isSidePlayer ? 'landscape' : 'portrait'}
              canInteract={canInteract}
              onClick={() => onCardClick?.(i)}
              highlight={highlightPositions.includes(i)}
              initial={isDealing ? { opacity: 0, scale: 0.85, y: -18 } : false}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              whileHover={
                canInteract
                  ? isSidePlayer
                    ? { x: playerPosition === 'left' ? 10 : -10, scale: 1.04, zIndex: 100 }
                    : { y: playerPosition === 'top' ? 10 : -12, scale: 1.05, zIndex: 100 }
                  : {}
              }
            />

            {/* Takas edilen / seçilen slotun yumuşak altın ışık halesi (Önce parlar, sonra kart uçar) */}
            <AnimatePresence>
              {isSwapHighlighted && (
                <motion.div
                  className="absolute -inset-1 rounded-[13px] pointer-events-none z-25"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    scale: 1.03,
                  }}
                  exit={{ opacity: 0, scale: 1.06 }}
                  transition={{
                    duration: 0.55,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: [0.45, 0, 0.55, 1],
                  }}
                  style={{
                    willChange: 'transform, opacity',
                    boxShadow: '0 0 24px 4px rgba(240, 201, 108, 0.55), inset 0 0 12px rgba(240, 201, 108, 0.3)',
                    background: 'radial-gradient(circle, rgba(240,201,108,0.18) 0%, rgba(212,168,67,0.04) 70%)',
                    border: '1.5px solid rgba(250, 225, 156, 0.75)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Bakılan kartın üzerindeki yumuşak, keskin olmayan altın ışık halesi */}
            <AnimatePresence>
              {isPeeked && (
                <motion.div
                  className="absolute -inset-1 rounded-[12px] pointer-events-none z-25"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: [0.7, 1], scale: [1, 1.02] }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: [0.45, 0, 0.55, 1],
                  }}
                  style={{
                    willChange: 'transform, opacity',
                    border: '1.5px solid rgba(250, 225, 156, 0.65)',
                    boxShadow: '0 0 18px 2px rgba(212, 168, 67, 0.42), inset 0 0 8px rgba(240, 201, 108, 0.2)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* 60 FPS Akıcı, Kompakt ve Yumuşak "İnceliyor / Peeking" Göstergesi */}
            <AnimatePresence>
              {isPeeked && (
                <motion.div
                  className={`absolute flex items-center pointer-events-none ${badgePosClass} z-50`}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-md"
                    style={{
                      willChange: 'transform',
                      transform: 'translateZ(0)',
                      background: 'linear-gradient(135deg, rgba(16, 46, 34, 0.94) 0%, rgba(7, 23, 16, 0.96) 100%)',
                      border: '1px solid rgba(243, 212, 124, 0.65)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.38), 0 0 10px rgba(212,168,67,0.28)',
                    }}
                    animate={{ y: -3 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: 'mirror',
                      duration: 1.1,
                      ease: [0.45, 0, 0.55, 1],
                    }}
                  >
                    <svg className="w-2.5 h-2.5 text-[var(--gold-light)] shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                    <span className="text-[8.5px] font-semibold text-amber-100/95 tracking-wide leading-none">
                      {isHighlighting
                        ? lang === 'tr' ? 'Seçildi' : 'Selected'
                        : lang === 'tr' ? 'İnceliyor' : 'Peeking'}
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
