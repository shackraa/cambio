import { motion } from 'framer-motion';
import type { Card as CardType } from '../types/game';
import { CARD_TRANSITION } from '../utils/cardTransition';

import type { HTMLMotionProps } from 'framer-motion';

export interface CardProps extends Omit<HTMLMotionProps<"div">, "onClick" | "className" | "style"> {
  card: CardType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation?: 'portrait' | 'landscape';
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

export function GameCard({
  card,
  size = 'md',
  orientation = 'portrait',
  onClick,
  highlight,
  canInteract,
  className = '',
  style,
  ...motionProps
}: CardProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isSpecial = ['J', 'Q', 'K'].includes(card.rank);
  const isPowerCard = ['7', '8', '9', '10', 'J', 'Q'].includes(card.rank) || (card.rank === 'K' && !isRed);
  const isLandscape = orientation === 'landscape';

  type SizeKey = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  const sizeMap: Record<SizeKey, { w: string; h: string; lw: string; lh: string; text: string; corner: string }> = {
    sm:    { w: 'w-14', h: 'h-20', lw: 'w-20', lh: 'h-14', text: 'text-base', corner: 'text-[10px]' },
    md:    { w: 'w-16', h: 'h-24', lw: 'w-24', lh: 'h-16', text: 'text-xl',   corner: 'text-xs' },
    lg:    { w: 'w-20', h: 'h-28', lw: 'w-28', lh: 'h-20', text: 'text-2xl',  corner: 'text-sm' },
    xl:    { w: 'w-24', h: 'h-36', lw: 'w-36', lh: 'h-24', text: 'text-3xl',  corner: 'text-base' },
    '2xl': { w: 'w-28', h: 'h-40', lw: 'w-40', lh: 'h-28', text: 'text-4xl',  corner: 'text-lg' },
  };
  const sizes = sizeMap[size as SizeKey];
  const dimClass = isLandscape ? `${sizes.lw} ${sizes.lh}` : `${sizes.w} ${sizes.h}`;

  if (card.isGhost) {
    return (
      <motion.div
        layoutId={card.id}
        className={`${dimClass} opacity-0 pointer-events-none shrink-0`}
        transition={CARD_TRANSITION}
      />
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      layout
      {...motionProps}
      className={`${dimClass} shrink-0 select-none relative ${canInteract ? 'cursor-pointer hoverable-card' : 'cursor-default'} ${className}`}
      whileTap={canInteract ? { scale: 0.95 } : {}}
      transition={motionProps.transition || CARD_TRANSITION}
      onClick={canInteract ? onClick : undefined}
      style={{
        filter: highlight ? 'drop-shadow(0 0 14px rgba(212,168,67,0.95))' : undefined,
        ...style,
      }}
    >
      {/* Seçili / Highlight Çerçevesi */}
      {highlight && (
        <motion.div
          className="absolute -inset-1.5 rounded-[13px] border-2 border-[var(--gold)] pointer-events-none z-20"
          animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 22px rgba(212,168,67,0.9), inset 0 0 10px rgba(212,168,67,0.4)' }}
        />
      )}

      {/* Ceza Kartı Göstergesi */}
      {card.isPenalty && (
        <motion.div
          className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-red-600 rounded-full text-white text-[10px] font-black border-2 border-red-300 shadow-md z-30 pointer-events-none"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: [1, 1.25, 1], rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
        >
          ⚠
        </motion.div>
      )}

      {/* Perspektif container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          perspective: '900px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Flip container: insan gözünün rahat takip edebileceği 0.85s çevirme süresi */}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.85s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: card.isRevealed
              ? isLandscape
                ? 'rotateX(180deg)'
                : 'rotateY(180deg)'
              : 'rotateY(0deg)',
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
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div
                className="w-8 h-8 rounded-full border border-[var(--gold)]/45 flex items-center justify-center bg-black/15"
                style={{ transform: isLandscape ? 'rotate(90deg)' : undefined }}
              >
                <span className="text-[var(--gold)] opacity-90 text-sm font-black font-['Cinzel']">C</span>
              </div>
            </div>
          </div>

          {/* KART ÖN YÜZÜ */}
          <div
            className={`card-face ${isSpecial ? 'special-card-bg' : ''} ${card.rank === 'K' && isRed ? 'red-king-card-bg' : ''}`}
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: isLandscape ? 'rotateX(180deg)' : 'rotateY(180deg)',
              borderRadius: '10px',
              padding: '4px',
            }}
          >
            {card.rank === 'Joker' ? (
              <div className="flex flex-col items-center justify-center h-full gap-0.5">
                <span className="text-purple-600 text-2xl">🃏</span>
                <span className="text-purple-700 font-black text-[10px] tracking-wider">JOKER</span>
                <span className="text-[8px] bg-purple-500/15 text-purple-800 rounded px-1.5 font-bold mt-0.5">
                  0 pt
                </span>
              </div>
            ) : (
              <>
                <div className={`absolute top-1 left-1.5 leading-none flex flex-col items-center ${isRed ? 'suit-red' : 'suit-black'}`}>
                  <div className={`font-black ${sizes.corner}`}>{card.rank}</div>
                  <div className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</div>
                </div>

                {/* Orta Sembol veya Kraliyet Rozeti */}
                <div className={`${sizes.text} ${isRed ? 'suit-red' : 'suit-black'} font-bold flex flex-col items-center justify-center`}>
                  <span>{SUIT_SYMBOL[card.suit]}</span>
                  {isPowerCard && (
                    <span className="text-[7px] uppercase tracking-wider font-extrabold px-1 rounded bg-amber-500/20 text-amber-900 border border-amber-600/30 -mt-1">
                      ⚡
                    </span>
                  )}
                </div>

                <div className={`absolute bottom-1 right-1.5 leading-none rotate-180 flex flex-col items-center ${isRed ? 'suit-red' : 'suit-black'}`}>
                  <div className={`font-black ${sizes.corner}`}>{card.rank}</div>
                  <div className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</div>
                </div>

                <div className="absolute bottom-1 left-1.5 flex justify-center">
                  <span className={`text-[8px] rounded px-1 font-bold ${
                    card.value < 0
                      ? 'bg-amber-400/30 text-amber-900 border border-amber-500/40'
                      : 'bg-black/10 text-gray-700'
                  }`}>
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
