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

        // "Bakıyor" rozeti konumu: alt oyuncuda üstte, üst oyuncuda altta, sol oyuncuda sağda, sağ oyuncuda solda
        const badgePosClass =
          playerPosition === 'bottom'
            ? '-top-12 left-1/2 -translate-x-1/2 flex-col'
            : playerPosition === 'top'
              ? '-bottom-12 left-1/2 -translate-x-1/2 flex-col-reverse'
              : playerPosition === 'left'
                ? 'left-[calc(100%+10px)] top-1/2 -translate-y-1/2 flex-row-reverse'
                : 'right-[calc(100%+10px)] top-1/2 -translate-y-1/2 flex-row';

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
              initial={isDealing ? { opacity: 0, scale: 0.75, y: -25 } : false}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              whileHover={
                canInteract
                  ? isSidePlayer
                    ? { x: playerPosition === 'left' ? 12 : -12, scale: 1.05, zIndex: 100 }
                    : { y: playerPosition === 'top' ? 12 : -14, scale: 1.06, zIndex: 100 }
                  : {}
              }
            />

            {/* Takas edilen / seçilen slotun altın ışık halkası (Önce parlar, sonra kart uçar!) */}
            <AnimatePresence>
              {isSwapHighlighted && (
                <motion.div
                  className="absolute -inset-1.5 rounded-[14px] pointer-events-none z-25"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{
                    opacity: [0, 1, 0.85, 1],
                    scale: [0.95, 1.06, 1.02, 1.05],
                  }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                  style={{
                    boxShadow: '0 0 28px 8px rgba(212,168,67,0.9), inset 0 0 16px rgba(212,168,67,0.55)',
                    background: ' radial-gradient(circle, rgba(240,201,108,0.28) 0%, rgba(212,168,67,0.08) 70%)',
                    border: '2.5px solid #f0c96c',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Bakılan kartın üzerindeki zarif tarama / odak halkası */}
            <AnimatePresence>
              {isPeeked && (
                <motion.div
                  className="absolute -inset-1 rounded-[12px] pointer-events-none z-25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    border: '2px solid rgba(240, 201, 108, 0.9)',
                    boxShadow: '0 0 20px rgba(212, 168, 67, 0.65)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Profesyonel "İnceleniyor / Bakıyor" Göstergesi */}
            <AnimatePresence>
              {isPeeked && (
                <motion.div
                  className={`absolute flex items-center pointer-events-none ${badgePosClass} z-50`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25 }}
                >
                  <motion.div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, #102a20 0%, #071710 100%)',
                      border: '1.5px solid rgba(240, 201, 108, 0.85)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.6), 0 0 14px rgba(212,168,67,0.45)',
                    }}
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  >
                    {/* SVG Göz İkonu + Canlı Nokta */}
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gold)]" />
                    </span>
                    <svg className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                    <span className="text-[10px] font-extrabold text-amber-100 uppercase tracking-wider">
                      {isHighlighting
                        ? lang === 'tr' ? 'SEÇİLDİ' : 'SELECTED'
                        : lang === 'tr' ? 'İNCELİYOR' : 'PEEKING'}
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
