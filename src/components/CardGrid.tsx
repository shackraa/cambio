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
        // Peek fazının 'select' veya 'highlight' adımındaysa kart henüz açılmamıştır, "Seçili" durumundadır;
        // 'reveal' adımında veya 7-8 / 9-10 / K gücündeyse aktif olarak "İnceliyor" durumundadır.
        const isSelectedMode = isHighlighting;

        // Kart seçildiğinde veya incelenirken gerçek masa oyunundaki gibi masanın merkezine doğru hafifçe (6px) öne çıkar
        const peekOffset = isPeeked
          ? playerPosition === 'bottom'
            ? { x: 0, y: -6 }
            : playerPosition === 'top'
              ? { x: 0, y: 6 }
              : playerPosition === 'left'
                ? { x: 6, y: 0 }
                : { x: -6, y: 0 }
          : { x: 0, y: 0 };

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
              animate={{
                opacity: 1,
                scale: 1,
                x: peekOffset.x,
                y: peekOffset.y,
              }}
              whileHover={
                canInteract
                  ? isSidePlayer
                    ? { x: playerPosition === 'left' ? 10 : -10, scale: 1.04, zIndex: 100 }
                    : { y: playerPosition === 'top' ? 10 : -12, scale: 1.05, zIndex: 100 }
                  : {}
              }
            />

            {/* Takas edilen / seçilen slotun yumuşak kehribar ışık halesi (Önce parlar, sonra kart uçar) */}
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
                    boxShadow: '0 0 24px 4px rgba(240, 201, 108, 0.52), inset 0 0 12px rgba(240, 201, 108, 0.28)',
                    background: 'radial-gradient(circle, rgba(240,201,108,0.16) 0%, rgba(212,168,67,0.03) 70%)',
                    border: '1.5px solid rgba(250, 225, 156, 0.72)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Bakılan veya seçilen kartın üzerindeki yumuşak, keskin olmayan masa oyunu halesi */}
            <AnimatePresence>
              {isPeeked && (
                <motion.div
                  className="absolute -inset-1 rounded-[12px] pointer-events-none z-25"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{
                    opacity: [0.65, 0.95],
                    scale: [1, 1.015],
                    x: peekOffset.x,
                    y: peekOffset.y,
                  }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{
                    duration: 1.15,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: [0.45, 0, 0.55, 1],
                  }}
                  style={{
                    willChange: 'transform, opacity',
                    border: isSelectedMode
                      ? '1.5px solid rgba(253, 246, 227, 0.78)'
                      : '1.5px solid rgba(243, 212, 124, 0.65)',
                    boxShadow: isSelectedMode
                      ? '0 0 16px 2px rgba(253, 246, 227, 0.32)'
                      : '0 0 18px 2px rgba(212, 168, 67, 0.38)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Buton gibi durmayan, kartın üzerine zarifçe entegre Masa Oyunu "Seçili" & "İnceliyor" Sembolü */}
            <AnimatePresence>
              {isPeeked && (
                <motion.div
                  className="absolute inset-x-0 bottom-2 flex justify-center items-center pointer-events-none z-50"
                  initial={{ opacity: 0, scale: 0.88, y: 4 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: peekOffset.x,
                    y: peekOffset.y,
                  }}
                  exit={{ opacity: 0, scale: 0.88, y: 4 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isSelectedMode ? (
                    /* "SEÇİLİ" DURUMU: Fildişi / Parşömen Masa Oyunu Pulu (Buton görünümünden uzak, sıcak tasarım) */
                    <motion.div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap"
                      style={{
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                        background: 'linear-gradient(180deg, rgba(253, 248, 235, 0.96) 0%, rgba(242, 228, 198, 0.96) 100%)',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.32), 0 0 0 1px rgba(180, 138, 62, 0.45)',
                      }}
                      animate={{ y: -2 }}
                      transition={{
                        repeat: Infinity,
                        repeatType: 'mirror',
                        duration: 1.25,
                        ease: [0.45, 0, 0.55, 1],
                      }}
                    >
                      <span className="w-3 h-3 rounded-full bg-amber-700/15 flex items-center justify-center text-amber-800 text-[8px] font-black leading-none">
                        ✓
                      </span>
                      <span className="text-[8.5px] font-bold text-[#3d280a] tracking-wide leading-none">
                        {lang === 'tr' ? 'Seçili' : 'Selected'}
                      </span>
                    </motion.div>
                  ) : (
                    /* "İNCELİYOR" DURUMU: Kartın üzerinde süzülen sıcak kehribar göz amblemi */
                    <motion.div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap backdrop-blur-md"
                      style={{
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                        background: 'rgba(18, 42, 33, 0.82)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(243, 212, 124, 0.38)',
                      }}
                      animate={{ y: -2.5 }}
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
                      <span className="text-[8.5px] font-medium text-[#fdf6e3]/95 tracking-wide leading-none">
                        {lang === 'tr' ? 'İnceliyor' : 'Peeking'}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
