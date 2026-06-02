import { motion } from 'framer-motion';
import type { Card as CardType } from '../types/game';
import { CARD_TRANSITION } from '../utils/cardTransition';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onClick?: () => void;
  highlight?: boolean;
  canInteract?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
  spades:   '♠',
  joker:    '★',
};

function getCardScore(card: CardType): string {
  if (card.rank === 'Joker') return '0';
  if (card.rank === 'K' && (card.suit === 'hearts' || card.suit === 'diamonds')) return '-1';
  return String(card.value);
}

export function GameCard({ card, size = 'md', onClick, highlight, canInteract, className = '', style }: CardProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  type SizeKey = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  const sizeMap: Record<SizeKey, { w: string; h: string; text: string; corner: string }> = {
    sm:  { w: 'w-14', h: 'h-20', text: 'text-base', corner: 'text-[10px]' },
    md:  { w: 'w-16', h: 'h-24', text: 'text-xl',   corner: 'text-xs' },
    lg:  { w: 'w-20', h: 'h-28', text: 'text-2xl',  corner: 'text-sm' },
    xl:  { w: 'w-24', h: 'h-36', text: 'text-3xl',  corner: 'text-base' },
    '2xl': { w: 'w-28', h: 'h-40', text: 'text-4xl', corner: 'text-lg' },
  };
  const sizes = sizeMap[size as SizeKey];

  if (card.isGhost) {
    return (
      <motion.div
        layoutId={card.id}
        className={`${sizes.w} ${sizes.h} opacity-0 pointer-events-none shrink-0`}
        transition={CARD_TRANSITION}
      />
    );
  }

  return (
    // motion.div: Layout animasyonu + hover/tap — perspective BURAYA KONULMAZ (framer-motion transform'la çakışır)
    <motion.div
      layoutId={card.id}
      layout
      className={`${sizes.w} ${sizes.h} shrink-0 cursor-pointer select-none relative ${canInteract ? 'hoverable-card' : ''} ${className}`}
      whileTap={canInteract ? { scale: 0.95 } : {}}
      transition={CARD_TRANSITION}
      onClick={onClick}
      style={{
        filter: highlight ? 'drop-shadow(0 0 12px #d4a843)' : undefined,
        ...style,
      }}
    >
      {/* Ceza Kartı Göstergesi */}
      {card.isPenalty && (
        <motion.div
          className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-red-600 rounded-full text-white text-[10px] font-black border-2 border-red-300 shadow-lg z-30 pointer-events-none"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: [1, 1.3, 1], rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
        >
          ⚠
        </motion.div>
      )}

      {/* 
        Perspektif container: framer-motion motion.div'den AYRI bir wrapper.
        perspective burada tanımlanır — layout animasyonu bu div'e dokunmaz.
      */}
      <div
        style={{
          width: '100%',
          height: '100%',
          perspective: '800px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Flip container: transform rotateY bu div'e uygulanır */}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.34, 1.05, 0.64, 1)',
            transform: card.isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* KART ARKA YÜZÜ */}
          <div
            className="card-back"
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: '10px',
            }}
          >
            <div className="relative z-10 text-[var(--gold)] opacity-60 text-2xl">🂠</div>
          </div>

          {/* KART ÖN YÜZÜ */}
          <div
            className="card-face"
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: '10px',
              padding: '4px',
            }}
          >
            {card.rank === 'Joker' ? (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-purple-600 text-2xl">🃏</span>
                <span className="text-purple-600 font-bold text-xs">JOKER</span>
              </div>
            ) : (
              <>
                <div className={`absolute top-1 left-1.5 leading-tight ${isRed ? 'suit-red' : 'suit-black'}`}>
                  <div className={`font-bold ${sizes.corner}`}>{card.rank}</div>
                  <div className={sizes.corner}>{SUIT_SYMBOL[card.suit]}</div>
                </div>
                <div className={`${sizes.text} ${isRed ? 'suit-red' : 'suit-black'} font-bold`}>
                  {SUIT_SYMBOL[card.suit]}
                </div>
                <div className={`absolute bottom-1 right-1.5 leading-tight rotate-180 ${isRed ? 'suit-red' : 'suit-black'}`}>
                  <div className={`font-bold ${sizes.corner}`}>{card.rank}</div>
                  <div className={sizes.corner}>{SUIT_SYMBOL[card.suit]}</div>
                </div>
                <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                  <span className="text-[8px] bg-black/10 rounded px-1 text-gray-600 font-semibold">
                    {getCardScore(card)} pt
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
