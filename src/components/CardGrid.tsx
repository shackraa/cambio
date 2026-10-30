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
  isHighlighting?: boolean;
  playerPosition?: 'bottom' | 'top' | 'left' | 'right';
}

const SLOT_DIM_MAP: Record<
  'xs' | 'sm' | 'md' | 'lg',
  { portrait: string; landscape: string }
> = {
  xs: { portrait: 'w-11 h-16', landscape: 'w-15 h-10' },
  sm: { portrait: 'w-14 h-20', landscape: 'w-20 h-14' },
  md: { portrait: 'w-16 h-24', landscape: 'w-24 h-16' },
  lg: { portrait: 'w-20 h-28', landscape: 'w-28 h-20' },
};

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
  isHighlighting = false,
  playerPosition = 'bottom',
}: CardGridProps) {
  const lang = useLangStore((s) => s.lang);
  const isSidePlayer = playerPosition === 'left' || playerPosition === 'right';

  // Sol/sağ oyuncuların kartları tek sıra dikey (alt alta) dizilir ve her kart yan (landscape) durur!
  const gridClass =
    direction === 'vertical'
      ? 'flex flex-col justify-center items-center gap-1.5 sm:gap-2.5'
      : 'flex flex-row justify-center items-center gap-1.5 sm:gap-3';

  // Dağıtım sırasında (isDealing) 4 slot sabit boyutta tutulur; böylece her yeni kart desteden uçup geldiğinde
  // önceden gelen kartlar yana kayıp titreme yapmaz (sıfır reflow, 60fps fiziksel uçuş)!
  const totalSlots = isDealing ? Math.max(4, cards.length) : cards.length;
  const placeholderDim = isSidePlayer
    ? SLOT_DIM_MAP[size].landscape
    : SLOT_DIM_MAP[size].portrait;

  // Oyuncunun kart sayısı azalsa bile masa satır/sütun yüksekliğinin sabit kalması için minimum boyut garantisi
  const minTrackDim =
    direction === 'vertical'
      ? size === 'xs'
        ? 'min-w-15 min-h-10'
        : size === 'sm'
          ? 'min-w-20 min-h-14'
          : size === 'md'
            ? 'min-w-24 min-h-16'
            : 'min-w-28 min-h-20'
      : size === 'xs'
        ? 'min-h-16 min-w-11'
        : size === 'sm'
          ? 'min-h-20 min-w-14'
          : size === 'md'
            ? 'min-h-24 min-w-16'
            : 'min-h-28 min-w-20';

  return (
    <div className={`${gridClass} ${minTrackDim}`}>
      {Array.from({ length: totalSlots }).map((_, i) => {
        const card = cards[i];

        if (!card) {
          return (
            <div
              key={`deal-slot-${i}`}
              className={`${placeholderDim} shrink-0 pointer-events-none opacity-0`}
            />
          );
        }

        const isSwapHighlighted = swapHighlightPositions.includes(i);
        const isPeeked = peekPositions.includes(i);
        const isSelectedMode = isHighlighting;

        // Kart seçildiğinde veya incelenirken gerçek masa oyunundaki gibi masanın merkezine doğru hafifçe öne çıkar
        const peekOffset = isPeeked
          ? playerPosition === 'bottom'
            ? { x: 0, y: -4 }
            : playerPosition === 'top'
              ? { x: 0, y: 4 }
              : playerPosition === 'left'
                ? { x: 4, y: 0 }
                : { x: -4, y: 0 }
          : { x: 0, y: 0 };

        // Etiket kartın ÜZERİNE binmesin (kart açıldığında yüzünü kapatmasın!) diye kartın hemen dış kenarına konumlandırılır:
        const outsideBadgePos =
          playerPosition === 'bottom'
            ? '-top-6 inset-x-0 flex justify-center'
            : playerPosition === 'top'
              ? '-bottom-6 inset-x-0 flex justify-center'
              : playerPosition === 'left'
                ? 'left-[calc(100%+6px)] inset-y-0 flex items-center'
                : 'right-[calc(100%+6px)] inset-y-0 flex items-center';

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
              initial={false}
              animate={{
                opacity: 1,
                scale: 1,
                x: peekOffset.x,
                y: peekOffset.y,
              }}
              whileHover={
                canInteract
                  ? isSidePlayer
                    ? { x: playerPosition === 'left' ? 8 : -8, scale: 1.04, zIndex: 100 }
                    : { y: playerPosition === 'top' ? 8 : -10, scale: 1.05, zIndex: 100 }
                  : {}
              }
            />

            {/* Takas edilen slotun yumuşak kehribar ışık halesi — Sadece isSwapHighlighted true iken render edilir */}
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
                      background: 'linear-gradient(180deg, #fdf8eb 0%, #f2e4c6 100%)',
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
