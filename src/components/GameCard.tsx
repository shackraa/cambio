import { motion } from 'framer-motion';
import type { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onClick?: () => void;
  highlight?: boolean;
  canInteract?: boolean;
  className?: string;
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

// Tüm kart hareketleri için ortak transition — yavaş, ağır, fiziksel
export const CARD_TRANSITION = {
  layout: {
    type: 'spring' as const,
    stiffness: 45,
    damping: 12,
    mass: 2.5,
  },
};

export function GameCard({ card, size = 'md', onClick, highlight, canInteract, className = '' }: CardProps) {
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
        className={`card-wrapper ${sizes.w} ${sizes.h} opacity-0 pointer-events-none`}
        transition={CARD_TRANSITION}
      />
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      layout
      className={`card-wrapper ${sizes.w} ${sizes.h} shrink-0 cursor-pointer select-none ${canInteract ? 'hoverable-card' : ''} ${className} relative`}
      whileTap={canInteract ? { scale: 0.95 } : {}}
      transition={CARD_TRANSITION}
      onClick={onClick}
      style={{ filter: highlight ? 'drop-shadow(0 0 12px #d4a843)' : undefined }}
    >
      {/* Ceza Kartı Göstergesi — kart açık/kapalı fark etmez */}
      {card.isPenalty && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-red-600 rounded-full text-white text-[10px] font-black border-2 border-red-300 shadow-lg z-30 pointer-events-none">
          ⚠
        </div>
      )}

      <div className={`card-inner ${card.isRevealed ? 'flipped' : ''} w-full h-full`}>
        {/* KART ARKA YÜZÜ */}
        <div className="card-back w-full h-full">
          <div className="relative z-10 text-[var(--gold)] opacity-60 text-2xl">🂠</div>
        </div>

        {/* KART ÖN YÜZÜ */}
        <div className="card-face w-full h-full px-1 py-1">
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
    </motion.div>
  );
}
