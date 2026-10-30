import { motion } from 'framer-motion';
import { memo } from 'react';
import type { Card } from '../types/game';
import { GameCard } from './GameCard';
import { useLangStore } from '../store/useLangStore';

interface CardGridProps {
  cards: Card[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  canInteract?: boolean;
  onCardClick?: (position: number) => void;
  highlightPositions?: number[];
  peekPositions?: number[]; // peek fazında veya güç kullanımında bakılan kart pozisyonları
  swapHighlightPositions?: number[]; // takas öncesi/sırasında parlayan slotlar
  direction?: 'horizontal' | 'vertical';
  isDealing?: boolean;
  seatIndex?: number;
  isHighlighting?: boolean;
  playerPosition?: 'bottom' | 'top' | 'left' | 'right';
}

export const CardGrid = memo(function CardGrid({
  cards,
  size = 'md',
  canInteract,
  onCardClick,
  highlightPositions = [],
  peekPositions = [],
  swapHighlightPositions = [],
  direction = 'horizontal',
  isDealing = false,
  seatIndex = 0,
  isHighlighting = false,
  playerPosition = 'bottom',
}: CardGridProps) {
  const lang = useLangStore((s) => s.lang);
  const isSidePlayer = playerPosition === 'left' || playerPosition === 'right';

  const gridClass =
    direction === 'vertical'
      ? 'flex flex-col justify-center items-center gap-1.5 sm:gap-2.5'
      : 'flex flex-row justify-center items-center gap-1.5 sm:gap-3';

  // Masanın merkezindeki desteden oyuncunun eline doğru doğal dağıtım vektörü
  const dealOrigin =
    playerPosition === 'bottom'
      ? { opacity: 0, x: 0, y: -90, scale: 0.78 }
      : playerPosition === 'top'
        ? { opacity: 0, x: 0, y: 90, scale: 0.78 }
        : playerPosition === 'left'
          ? { opacity: 0, x: 90, y: 0, scale: 0.78 }
          : { opacity: 0, x: -90, y: 0, scale: 0.78 };

  return (
    <div className={gridClass}>
      {cards.map((card, i) => {
        const isSwapHighlighted = swapHighlightPositions.includes(i);
        const isPeeked = peekPositions.includes(i);
        const isSelectedMode = isHighlighting;

        const peekOffset = isPeeked
          ? playerPosition === 'bottom'
            ? { x: 0, y: -4 }
            : playerPosition === 'top'
              ? { x: 0, y: 4 }
              : playerPosition === 'left'
                ? { x: 4, y: 0 }
                : { x: -4, y: 0 }
          : { x: 0, y: 0 };

        const outsideBadgePos =
          playerPosition === 'bottom'
            ? '-top-6 inset-x-0 flex justify-center'
            : playerPosition === 'top'
              ? '-bottom-6 inset-x-0 flex justify-center'
              : playerPosition === 'left'
                ? 'left-[calc(100%+6px)] inset-y-0 flex items-center'
                : 'right-[calc(100%+6px)] inset-y-0 flex items-center';

        // Dağıtım sırası: masada sırayla 16 kart yağ gibi akarak dağıtılır
        const dealDelay = (i * 4 + seatIndex) * 0.06;

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
              disableLayout={isDealing}
              initial={isDealing ? dealOrigin : false}
              animate={{
                opacity: 1,
                scale: 1,
                x: peekOffset.x,
                y: peekOffset.y,
              }}
              transition={
                isDealing
                  ? {
                      duration: 0.44,
                      delay: dealDelay,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : undefined
              }
              whileHover={
                canInteract
                  ? isSidePlayer
                    ? {
                        x: playerPosition === 'left' ? 8 : -8,
                        scale: 1.04,
                        zIndex: 100,
                      }
                    : {
                        y: playerPosition === 'top' ? 8 : -10,
                        scale: 1.05,
                        zIndex: 100,
                      }
                  : {}
              }
            />

            {/* Takas edilen slotun yumuşak kehribar ışık halesi */}
            {isSwapHighlighted && (
              <motion.div
                className="absolute -inset-1 rounded-[11px] pointer-events-none z-25"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.65, 1],
                  scale: [1, 1.025],
                }}
                transition={{
                  duration: 0.55,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: [0.45, 0, 0.55, 1],
                }}
                style={{
                  boxShadow:
                    '0 0 20px 3px rgba(240, 201, 108, 0.5), inset 0 0 10px rgba(240, 201, 108, 0.25)',
                  background:
                    'radial-gradient(circle, rgba(240,201,108,0.14) 0%, rgba(212,168,67,0.02) 70%)',
                  border: '1.5px solid rgba(250, 225, 156, 0.75)',
                }}
              />
            )}

            {/* Bakılan veya seçilen kartın üzerindeki yumuşak hale */}
            {isPeeked && (
              <motion.div
                className="absolute -inset-1 rounded-[11px] pointer-events-none z-25"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.65, 0.95],
                  scale: [1, 1.015],
                  x: peekOffset.x,
                  y: peekOffset.y,
                }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: [0.45, 0, 0.55, 1],
                }}
                style={{
                  border: isSelectedMode
                    ? '1.5px solid rgba(253, 246, 227, 0.8)'
                    : '1.5px solid rgba(243, 212, 124, 0.7)',
                  boxShadow: isSelectedMode
                    ? '0 0 14px 2px rgba(253, 246, 227, 0.3)'
                    : '0 0 16px 2px rgba(212, 168, 67, 0.38)',
                }}
              />
            )}

            {/* Kartın ÜZERİNİ KAPATMAYAN (dış kenarında duran) "Seçili" & "İnceliyor" Göstergesi */}
            {isPeeked && (
              <div className={`absolute pointer-events-none z-50 ${outsideBadgePos}`}>
                {isSelectedMode ? (
                  <motion.div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background:
                        'linear-gradient(180deg, #fdf8eb 0%, #f2e4c6 100%)',
                      boxShadow:
                        '0 3px 10px rgba(0,0,0,0.3), 0 0 0 1px rgba(180, 138, 62, 0.5)',
                    }}
                    animate={{ y: -2 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: 'mirror',
                      duration: 1.2,
                      ease: [0.45, 0, 0.55, 1],
                    }}
                  >
                    <span className="text-amber-800 text-[8px] font-black leading-none">
                      ✓
                    </span>
                    <span className="text-[8.5px] font-bold text-[#3d280a] tracking-wide leading-none">
                      {lang === 'tr' ? 'Seçili' : 'Selected'}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: 'rgba(15, 38, 29, 0.92)',
                      boxShadow:
                        '0 4px 12px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(243, 212, 124, 0.45)',
                    }}
                    animate={{ y: -2 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: 'mirror',
                      duration: 1.1,
                      ease: [0.45, 0, 0.55, 1],
                    }}
                  >
                    <svg
                      className="w-2.5 h-2.5 text-[#f7dfa0] shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                    <span className="text-[8.5px] font-semibold text-[#fdf6e3] tracking-wide leading-none">
                      {lang === 'tr' ? 'İnceliyor' : 'Peeking'}
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
