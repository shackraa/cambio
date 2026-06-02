import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '../types/game';
import { GameCard } from './GameCard';

interface CardGridProps {
  cards: Card[];
  size?: 'sm' | 'md' | 'lg';
  canInteract?: boolean;
  onCardClick?: (position: number) => void;
  highlightPositions?: number[];
  peekPositions?: number[];   // peek fazında göz ikonu gösterilecek pozisyonlar
  swapHighlightPositions?: number[]; // takas edilen slotlar için altın parlama
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
  const gridClass = direction === 'vertical'
    ? 'flex flex-col items-center'
    : 'flex flex-row justify-center items-center';

  return (
    <div className={gridClass}>
      {cards.map((card, i) => {
        const center = (cards.length - 1) / 2;
        const offset = i - center;
        
        // Fanning math
        const rotate = offset * 4; // Derece (azaltıldı)
        const yOffset = Math.abs(offset) * 3; // Kavis (azaltıldı)
        const xOffset = offset * -8; // İç içe geçme azaltıldı (boşluk %20 artırıldı)

        return (
          <div key={card.id} className="relative" style={{ zIndex: i }}>
            <GameCard
              card={card}
              size={size}
              canInteract={canInteract}
              onClick={() => onCardClick?.(i)}
              highlight={highlightPositions.includes(i)}
              initial={isDealing ? { opacity: 0, scale: 0.8, y: -20 } : false}
              animate={{ opacity: 1, scale: 1, y: yOffset, x: xOffset, rotate }}
              whileHover={canInteract ? { y: yOffset - 25, scale: 1.05, rotate: rotate * 0.3, zIndex: 100 } : {}}
              transition={{ 
                duration: 0.5, 
                delay: isDealing ? i * 0.08 : 0, 
                ease: [0.23, 1, 0.32, 1] // Doğal yavaşlama, sekme (jitter) yok
              }}
            />

          {/* Takas edilen slotun altın parlama efekti */}
          <AnimatePresence>
            {swapHighlightPositions.includes(i) && (
              <motion.div
                className="absolute inset-0 rounded-[10px] pointer-events-none z-20"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: [0, 1, 0.7, 1, 0], scale: [1.1, 1.05, 1.1, 1.05, 1.1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                style={{
                  boxShadow: '0 0 24px 8px rgba(212,168,67,1), inset 0 0 16px rgba(212,168,67,0.5)',
                  background: 'rgba(212,168,67,0.15)',
                  border: '2px solid rgba(212,168,67,0.9)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Peek fazı göstergesi (Kartın DIŞINDA ve bir okla) */}
          {peekPositions.includes(i) && (
            <motion.div
              className={`absolute left-1/2 -translate-x-1/2 flex pointer-events-none ${
                playerPosition === 'bottom' ? '-top-14 flex-col' : '-bottom-14 flex-col-reverse'
              } ${isHighlighting ? 'z-50' : 'z-40'}`}
              initial={{ opacity: 0, y: playerPosition === 'bottom' ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              style={{ alignItems: 'center', gap: '2px' }}
            >
              <motion.div
                className={`flex items-center gap-1 rounded-full ${isHighlighting ? 'px-3 py-1.5' : 'px-2 py-1'}`}
                style={{
                  background: 'rgba(212,168,67,0.95)',
                  boxShadow: isHighlighting ? '0 0 20px rgba(212,168,67,1)' : '0 0 8px rgba(212,168,67,0.6)',
                  border: isHighlighting ? '2px solid white' : 'none',
                }}
                animate={isHighlighting ? { scale: [1, 1.1, 1] } : { scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                <span className={isHighlighting ? "text-lg" : "text-xs"}>👁</span>
                <span className={`${isHighlighting ? "text-xs" : "text-[9px]"} font-black text-black uppercase tracking-widest`}>
                  {isHighlighting ? "SEÇİLDİ" : "BAKIYOR"}
                </span>
              </motion.div>
              {/* Küçük ok işareti */}
              <div
                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent"
                style={{
                  borderTop: playerPosition === 'bottom' ? '6px solid rgba(212,168,67,0.95)' : 'none',
                  borderBottom: playerPosition !== 'bottom' ? '6px solid rgba(212,168,67,0.95)' : 'none'
                }}
              />
            </motion.div>
          )}
        </div>
      );
    })}
    </div>
  );
}
