import { motion } from 'framer-motion';
import { useEffect, useState, useRef, memo } from 'react';
import type { Card as CardType } from '../types/game';
import { CARD_TRANSITION } from '../utils/cardTransition';
import {
  useCustomizationStore,
  type CardBackSkin,
  type CardFrontStyle,
} from '../store/useCustomizationStore';
import type { HTMLMotionProps } from 'framer-motion';

export interface CardProps
  extends Omit<HTMLMotionProps<'div'>, 'onClick' | 'className' | 'style'> {
  card: CardType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation?: 'portrait' | 'landscape';
  onClick?: () => void;
  highlight?: boolean;
  canInteract?: boolean;
  className?: string;
  style?: React.CSSProperties;
  overrideBackSkin?: CardBackSkin;
  overrideFrontStyle?: CardFrontStyle;
  disableLayout?: boolean;
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  joker: '★',
};

const COURT_SYMBOL: Record<string, string> = {
  K: '♔',
  Q: '♕',
  J: '♘',
};

/**
 * Klasik-Premium Gerçek İskambil Kağıdı Sırt Tasarımları
 * (Bicycle / Tally-Ho / Theory11 Monarchs / Monte Carlo tarzı simetrik gravürlü iskambil sırtları)
 */
function PlayingCardBack({
  skin,
  isLandscape,
}: {
  skin: CardBackSkin;
  isLandscape: boolean;
}) {
  // 1) KLASİK KIRMIZI İSKAMBİL (Bicycle / Tally-Ho Heritage Crimson)
  if (skin === 'classic_red') {
    return (
      <div className="w-full h-full bg-white p-[3px] sm:p-[4px] rounded-[9px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[5px] relative overflow-hidden flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #b91c1c 0%, #7f1d1d 100%)',
            border: '1.5px solid #991b1b',
          }}
        >
          {/* İnce Baklava İskambil Gravür Dokusu */}
          <div
            className="absolute inset-[2px] rounded-[3px] border border-white/75"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 5px)
              `,
            }}
          />

          {/* Simetrik Klasik İskambil SVG Filigranı */}
          <svg
            viewBox="0 0 100 150"
            className="w-full h-full relative z-10 p-[3px]"
            style={{ transform: isLandscape ? 'rotate(90deg) scale(0.72)' : undefined }}
          >
            {/* İç Çift Çerçeve ve Köşe Süslemeleri */}
            <rect
              x="6"
              y="6"
              width="88"
              height="138"
              rx="4"
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="1.2"
            />
            <rect
              x="9.5"
              y="9.5"
              width="81"
              height="131"
              rx="2.5"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="0.7"
              strokeDasharray="2 1.5"
            />

            {/* 4 Köşe İskambil Sembol Rozetleri */}
            <circle cx="16" cy="16" r="4.5" fill="#7f1d1d" stroke="white" strokeWidth="0.9" />
            <circle cx="84" cy="16" r="4.5" fill="#7f1d1d" stroke="white" strokeWidth="0.9" />
            <circle cx="16" cy="134" r="4.5" fill="#7f1d1d" stroke="white" strokeWidth="0.9" />
            <circle cx="84" cy="134" r="4.5" fill="#7f1d1d" stroke="white" strokeWidth="0.9" />

            {/* Üst ve Alt Simetrik Yelpaze Kemerleri (Two-Way Back Symmetry) */}
            <path
              d="M24 22 Q50 38 76 22 M30 18 Q50 30 70 18"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.1"
            />
            <path
              d="M24 128 Q50 112 76 128 M30 132 Q50 120 70 132"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.1"
            />
            <circle cx="50" cy="27" r="6" fill="#7f1d1d" stroke="white" strokeWidth="1.1" />
            <circle cx="50" cy="27" r="2.5" fill="white" />
            <circle cx="50" cy="123" r="6" fill="#7f1d1d" stroke="white" strokeWidth="1.1" />
            <circle cx="50" cy="123" r="2.5" fill="white" />

            {/* Merkez Tally-Ho Rozet Madalyonu */}
            <circle cx="50" cy="75" r="24" fill="#7f1d1d" stroke="white" strokeWidth="1.6" />
            <circle
              cx="50"
              cy="75"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <circle cx="50" cy="75" r="14" fill="#991b1b" stroke="white" strokeWidth="1.2" />
            {/* 8 Yapraklı Klasik İskambil Çiçeği */}
            <path
              d="M50 57 L53 69 L65 65 L56 75 L65 85 L53 81 L50 93 L47 81 L35 85 L44 75 L35 65 L47 69 Z"
              fill="rgba(255,255,255,0.9)"
            />
            <circle cx="50" cy="75" r="5" fill="#7f1d1d" stroke="white" strokeWidth="1.2" />
            <circle cx="50" cy="75" r="2" fill="white" />
          </svg>
        </div>
      </div>
    );
  }

  // 2) KLASİK MAVİ İSKAMBİL (Royal Club Navy Deck)
  if (skin === 'classic_blue') {
    return (
      <div className="w-full h-full bg-white p-[3px] sm:p-[4px] rounded-[9px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[5px] relative overflow-hidden flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #1d4ed8 0%, #172554 100%)',
            border: '1.5px solid #1e3a8a',
          }}
        >
          <div
            className="absolute inset-[2px] rounded-[3px] border border-white/75"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 5px)
              `,
            }}
          />

          <svg
            viewBox="0 0 100 150"
            className="w-full h-full relative z-10 p-[3px]"
            style={{ transform: isLandscape ? 'rotate(90deg) scale(0.72)' : undefined }}
          >
            <rect
              x="6"
              y="6"
              width="88"
              height="138"
              rx="4"
              fill="none"
              stroke="rgba(255,255,255,0.88)"
              strokeWidth="1.2"
            />
            <rect
              x="10"
              y="10"
              width="80"
              height="130"
              rx="2.5"
              fill="none"
              stroke="rgba(191,219,254,0.55)"
              strokeWidth="0.8"
            />

            {/* Köşe Baklava Rozetleri */}
            <polygon points="16,12 20,16 16,20 12,16" fill="white" />
            <polygon points="84,12 88,16 84,20 80,16" fill="white" />
            <polygon points="16,130 20,134 16,138 12,134" fill="white" />
            <polygon points="84,130 88,134 84,138 80,134" fill="white" />

            {/* Üst & Alt Simetrik Kulüp Madalyonları */}
            <path
              d="M22 28 C36 16, 64 16, 78 28"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.2"
            />
            <path
              d="M22 122 C36 134, 64 134, 78 122"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.2"
            />
            <polygon
              points="50,18 57,28 50,38 43,28"
              fill="#172554"
              stroke="white"
              strokeWidth="1.2"
            />
            <polygon
              points="50,112 57,122 50,132 43,122"
              fill="#172554"
              stroke="white"
              strokeWidth="1.2"
            />

            {/* Merkez Çift Halkalı İskambil Pusulası */}
            <circle cx="50" cy="75" r="24" fill="#172554" stroke="white" strokeWidth="1.6" />
            <circle
              cx="50"
              cy="75"
              r="19.5"
              fill="none"
              stroke="rgba(191,219,254,0.75)"
              strokeWidth="0.9"
            />
            <polygon
              points="50,53 56,69 72,75 56,81 50,97 44,81 28,75 44,69"
              fill="white"
            />
            <circle cx="50" cy="75" r="7" fill="#1e3a8a" stroke="white" strokeWidth="1.3" />
            <circle cx="50" cy="75" r="2.5" fill="white" />
          </svg>
        </div>
      </div>
    );
  }

  // 3) MONTE CARLO ZÜMRÜT & ALTIN (Grand Casino Emerald & Gold Foil)
  if (skin === 'emerald_botanical') {
    return (
      <div className="w-full h-full bg-[#fbf5e6] p-[3px] sm:p-[4px] rounded-[9px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[5px] relative overflow-hidden flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #115e43 0%, #06281c 100%)',
            border: '1.5px solid #d4a843',
          }}
        >
          <div
            className="absolute inset-[2px] rounded-[3px] border border-[#e8c468]/45"
            style={{
              backgroundImage: `
                repeating-linear-gradient(60deg, rgba(232,196,104,0.16) 0px, rgba(232,196,104,0.16) 1px, transparent 1px, transparent 6px),
                repeating-linear-gradient(-60deg, rgba(232,196,104,0.16) 0px, rgba(232,196,104,0.16) 1px, transparent 1px, transparent 6px)
              `,
            }}
          />

          <svg
            viewBox="0 0 100 150"
            className="w-full h-full relative z-10 p-[3px]"
            style={{ transform: isLandscape ? 'rotate(90deg) scale(0.72)' : undefined }}
          >
            <rect
              x="6"
              y="6"
              width="88"
              height="138"
              rx="5"
              fill="none"
              stroke="#e8c468"
              strokeWidth="1.3"
            />
            <rect
              x="10"
              y="10"
              width="80"
              height="130"
              rx="3"
              fill="none"
              stroke="rgba(232,196,104,0.45)"
              strokeWidth="0.8"
            />

            {/* Köşe Altın Yaprak Filigranları */}
            <path d="M12 22 Q12 12 22 12" fill="none" stroke="#f7dfa0" strokeWidth="1.6" />
            <path d="M88 22 Q88 12 78 12" fill="none" stroke="#f7dfa0" strokeWidth="1.6" />
            <path d="M12 128 Q12 138 22 138" fill="none" stroke="#f7dfa0" strokeWidth="1.6" />
            <path d="M88 128 Q88 138 78 138" fill="none" stroke="#f7dfa0" strokeWidth="1.6" />

            {/* Üst ve Alt Barok Zambak (Fleur-de-Lis) Kemerleri */}
            <path
              d="M26 26 Q50 40 74 26"
              fill="none"
              stroke="#e8c468"
              strokeWidth="1.1"
            />
            <path
              d="M26 124 Q50 110 74 124"
              fill="none"
              stroke="#e8c468"
              strokeWidth="1.1"
            />
            <circle cx="50" cy="24" r="5" fill="#06281c" stroke="#e8c468" strokeWidth="1.2" />
            <circle cx="50" cy="126" r="5" fill="#06281c" stroke="#e8c468" strokeWidth="1.2" />

            {/* Merkez Venedik Zümrüt & Altın Kalkan Madalyonu */}
            <polygon
              points="50,47 74,75 50,103 26,75"
              fill="#06281c"
              stroke="#e8c468"
              strokeWidth="1.6"
            />
            <circle cx="50" cy="75" r="17" fill="#0c3b29" stroke="#f7dfa0" strokeWidth="1.3" />
            <path
              d="M50 61 L54 71 L64 75 L54 79 L50 89 L46 79 L36 75 L46 71 Z"
              fill="#f7dfa0"
            />
            <circle cx="50" cy="75" r="4" fill="#06281c" stroke="#f7dfa0" strokeWidth="1.1" />
          </svg>
        </div>
      </div>
    );
  }

  // 4) MONARCH ALTIN & GECE (Theory11 Monarchs Gold Foil Edition - 'royal_compass')
  return (
    <div className="w-full h-full bg-[#fbf5e6] p-[3px] sm:p-[4px] rounded-[9px] select-none pointer-events-none flex items-center justify-center">
      <div
        className="w-full h-full rounded-[5px] relative overflow-hidden flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #1a2d57 0%, #091124 100%)',
          border: '1.5px solid #e5be67',
        }}
      >
        <div
          className="absolute inset-[2px] rounded-[3px] border border-[#e5be67]/45"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, rgba(229,190,103,0.16) 0px, rgba(229,190,103,0.16) 1px, transparent 1px, transparent 6px),
              repeating-linear-gradient(-45deg, rgba(229,190,103,0.16) 0px, rgba(229,190,103,0.16) 1px, transparent 1px, transparent 6px)
            `,
          }}
        />

        <svg
          viewBox="0 0 100 150"
          className="w-full h-full relative z-10 p-[3px]"
          style={{ transform: isLandscape ? 'rotate(90deg) scale(0.72)' : undefined }}
        >
          <rect
            x="6"
            y="6"
            width="88"
            height="138"
            rx="4"
            fill="none"
            stroke="#e5be67"
            strokeWidth="1.4"
          />
          <rect
            x="10"
            y="10"
            width="80"
            height="130"
            rx="2.5"
            fill="none"
            stroke="rgba(247,226,171,0.5)"
            strokeWidth="0.8"
          />

          {/* 4 Köşe Kraliyet Üçgen Filigranları */}
          <polygon points="12,12 24,12 12,24" fill="#e5be67" opacity="0.85" />
          <polygon points="88,12 76,12 88,24" fill="#e5be67" opacity="0.85" />
          <polygon points="12,138 24,138 12,126" fill="#e5be67" opacity="0.85" />
          <polygon points="88,138 76,138 88,126" fill="#e5be67" opacity="0.85" />

          {/* Üst & Alt Simetrik Kraliyet Taç Rozetleri */}
          <circle cx="50" cy="25" r="7" fill="#091124" stroke="#e5be67" strokeWidth="1.2" />
          <polygon points="46,27 48,22 50,25 52,22 54,27" fill="#f7e2ab" />
          <circle cx="50" cy="125" r="7" fill="#091124" stroke="#e5be67" strokeWidth="1.2" />
          <polygon points="46,123 48,128 50,125 52,128 54,123" fill="#f7e2ab" />

          {/* Merkez Monarch 8 Köşeli Yıldız & Mandala */}
          <circle cx="50" cy="75" r="25" fill="#091124" stroke="#e5be67" strokeWidth="1.6" />
          <circle
            cx="50"
            cy="75"
            r="21"
            fill="none"
            stroke="#f7e2ab"
            strokeWidth="0.8"
            strokeDasharray="2.5 2"
          />
          <polygon
            points="50,52 55,68 73,75 55,82 50,98 45,82 27,75 45,68"
            fill="#e5be67"
          />
          <polygon
            points="34,59 47,70 66,59 55,72 66,91 47,80 34,91 45,72"
            fill="rgba(247,226,171,0.55)"
          />
          <circle cx="50" cy="75" r="6" fill="#091124" stroke="#f7e2ab" strokeWidth="1.3" />
          <circle cx="50" cy="75" r="2.2" fill="#f7e2ab" />
        </svg>
      </div>
    </div>
  );
}

export const GameCard = memo(function GameCard({
  card,
  size = 'md',
  orientation = 'portrait',
  onClick,
  highlight,
  canInteract,
  className = '',
  style,
  overrideBackSkin,
  overrideFrontStyle,
  disableLayout = false,
  ...motionProps
}: CardProps) {
  const cardBack = useCustomizationStore((s) => s.cardBack);
  const cardFront = useCustomizationStore((s) => s.cardFront);
  const activeBackSkin = overrideBackSkin ?? cardBack;
  const activeFrontStyle = overrideFrontStyle ?? cardFront;

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isRedKing = card.rank === 'K' && isRed;
  const isPowerCard =
    ['7', '8', '9', '10', 'J', 'Q'].includes(card.rank) ||
    (card.rank === 'K' && !isRed);
  const isLandscape = orientation === 'landscape';

  const [isFlipping, setIsFlipping] = useState(false);
  const prevRevealed = useRef(card.isRevealed);

  useEffect(() => {
    if (prevRevealed.current !== card.isRevealed) {
      prevRevealed.current = card.isRevealed;
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 860);
      return () => clearTimeout(timer);
    }
  }, [card.isRevealed]);

  type SizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  const sizeMap: Record<
    SizeKey,
    { w: string; h: string; lw: string; lh: string; text: string; corner: string }
  > = {
    xs: {
      w: 'w-11',
      h: 'h-16',
      lw: 'w-15',
      lh: 'h-10',
      text: 'text-base',
      corner: 'text-[9px]',
    },
    sm: {
      w: 'w-14',
      h: 'h-20',
      lw: 'w-20',
      lh: 'h-14',
      text: 'text-lg',
      corner: 'text-[10px]',
    },
    md: {
      w: 'w-16',
      h: 'h-24',
      lw: 'w-24',
      lh: 'h-16',
      text: 'text-2xl',
      corner: 'text-xs',
    },
    lg: {
      w: 'w-20',
      h: 'h-28',
      lw: 'w-28',
      lh: 'h-20',
      text: 'text-3xl',
      corner: 'text-sm',
    },
    xl: {
      w: 'w-24',
      h: 'h-36',
      lw: 'w-36',
      lh: 'h-24',
      text: 'text-4xl',
      corner: 'text-base',
    },
    '2xl': {
      w: 'w-28',
      h: 'h-40',
      lw: 'w-40',
      lh: 'h-28',
      text: 'text-5xl',
      corner: 'text-lg',
    },
  };
  const sizes = sizeMap[size as SizeKey];
  const dimClass = isLandscape
    ? `${sizes.lw} ${sizes.lh}`
    : `${sizes.w} ${sizes.h}`;

  if (card.isGhost) {
    return (
      <motion.div
        layoutId={disableLayout ? undefined : card.id}
        className={`${dimClass} opacity-0 pointer-events-none shrink-0`}
        transition={CARD_TRANSITION}
      />
    );
  }

  const frontBgClass = isRedKing
    ? 'red-king-card-bg'
    : activeFrontStyle === 'vintage'
      ? 'card-face-vintage'
      : 'card-face-classic';

  return (
    <motion.div
      layoutId={disableLayout ? undefined : card.id}
      layout={!disableLayout}
      {...motionProps}
      className={`${dimClass} shrink-0 select-none relative ${
        canInteract ? 'cursor-pointer hoverable-card' : 'cursor-default'
      } ${className}`}
      whileTap={canInteract ? { scale: 0.96 } : {}}
      transition={motionProps.transition || CARD_TRANSITION}
      onClick={canInteract ? onClick : undefined}
      style={style}
    >
      {/* Seçili / Highlight Çerçevesi */}
      {highlight && (
        <motion.div
          className="absolute -inset-1 rounded-[11px] pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.6, 0.95],
            scale: [1, 1.02],
            transition: {
              repeat: Infinity,
              repeatType: 'mirror',
              duration: 1.1,
              ease: [0.45, 0, 0.55, 1],
            },
          }}
          style={{
            border: '1.5px solid rgba(250, 225, 156, 0.75)',
            boxShadow:
              '0 0 16px 2px rgba(212,168,67,0.4), inset 0 0 8px rgba(212,168,67,0.2)',
          }}
        />
      )}

      {/* Ceza Kartı Göstergesi */}
      {card.isPenalty && (
        <motion.div
          className="absolute -top-2 -right-2 flex items-center justify-center px-1.5 h-5 bg-gradient-to-b from-red-500 to-red-700 rounded-full text-white text-[9px] font-black border border-red-200 shadow-md z-30 pointer-events-none"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
        >
          +1
        </motion.div>
      )}

      {/* Perspektif container: Çevirme bittiğinde 2D vektör keskinliğine geçer */}
      <div
        style={{
          width: '100%',
          height: '100%',
          perspective: isFlipping ? '900px' : 'none',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {isFlipping ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.82s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: card.isRevealed
                ? isLandscape
                  ? 'rotateX(180deg)'
                  : 'rotateY(180deg)'
                : 'rotateY(0deg)',
            }}
          >
            <div
              className="card-back"
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                borderRadius: '9px',
              }}
            >
              <PlayingCardBack skin={activeBackSkin} isLandscape={isLandscape} />
            </div>

            <div
              className={`card-face ${frontBgClass}`}
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: isLandscape ? 'rotateX(180deg)' : 'rotateY(180deg)',
                borderRadius: '9px',
              }}
            >
              <CardFrontContent
                card={card}
                isRed={isRed}
                isPowerCard={isPowerCard}
                sizes={sizes}
                frontStyle={activeFrontStyle}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {!card.isRevealed ? (
              <div className="card-back w-full h-full" style={{ borderRadius: '9px' }}>
                <PlayingCardBack skin={activeBackSkin} isLandscape={isLandscape} />
              </div>
            ) : (
              <div
                className={`card-face w-full h-full ${frontBgClass}`}
                style={{ borderRadius: '9px' }}
              >
                <CardFrontContent
                  card={card}
                  isRed={isRed}
                  isPowerCard={isPowerCard}
                  sizes={sizes}
                  frontStyle={activeFrontStyle}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

function CardFrontContent({
  card,
  isRed,
  isPowerCard,
  sizes,
  frontStyle,
}: {
  card: CardType;
  isRed: boolean;
  isPowerCard: boolean;
  sizes: { text: string; corner: string };
  frontStyle: CardFrontStyle;
}) {
  const isCourt = ['J', 'Q', 'K'].includes(card.rank);
  const suitColor = isRed ? 'text-[#c81e1e]' : 'text-[#14171f]';

  if (card.rank === 'Joker') {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-1.5">
        <div className="absolute inset-[4px] rounded-[5px] border border-purple-300/70 pointer-events-none" />
        <div className="absolute top-1.5 left-1.5 text-[7px] sm:text-[8px] font-black text-purple-800 tracking-tighter leading-none flex flex-col items-center">
          <span>J</span>
          <span>★</span>
        </div>
        <span className="text-purple-700 text-2xl sm:text-3xl leading-none">🃏</span>
        <span className="text-purple-900 font-black text-[8px] sm:text-[9px] tracking-[0.12em] mt-0.5">
          JOKER
        </span>
        <div className="absolute bottom-1.5 right-1.5 rotate-180 text-[7px] sm:text-[8px] font-black text-purple-800 tracking-tighter leading-none flex flex-col items-center">
          <span>J</span>
          <span>★</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Klasik İskambil İç Çerçeve Çizgisi (Saf Beyaz vs Antik Krem için ayrı çerçeve dokusu) */}
      <div
        className={`absolute inset-[4px] sm:inset-[5px] rounded-[5px] border pointer-events-none ${
          isCourt
            ? 'border-amber-600/45 bg-amber-500/[0.06]'
            : frontStyle === 'vintage'
              ? 'border-[#b88932]/45 bg-[#d4a843]/[0.05]'
              : 'border-slate-300/75'
        }`}
      />

      {/* Sol Üst İskambil Köşe İndeksi */}
      <div
        className={`absolute top-1 left-1.5 leading-none flex flex-col items-center ${suitColor}`}
      >
        <span className={`font-black tracking-tighter ${sizes.corner}`}>
          {card.rank}
        </span>
        <span className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</span>
      </div>

      {/* Sağ Üst Mini Özel Güç veya -1 Kral İşareti */}
      {card.value < 0 ? (
        <span className="absolute top-1.5 right-1.5 text-[7px] sm:text-[8px] font-extrabold text-amber-900 bg-amber-200/90 px-1 rounded leading-tight">
          -1
        </span>
      ) : isPowerCard ? (
        <span
          className="absolute top-1.5 right-1.5 text-[8px] sm:text-[9px] leading-none opacity-75"
          title="Power Card"
        >
          ⚡
        </span>
      ) : null}

      {/* Merkez İskambil Sembolü / Kraliyet Figürü */}
      <div
        className={`${suitColor} flex flex-col items-center justify-center select-none`}
      >
        {isCourt ? (
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-xs sm:text-sm opacity-80 -mb-0.5">
              {COURT_SYMBOL[card.rank]}
            </span>
            <span className={sizes.text}>{SUIT_SYMBOL[card.suit]}</span>
          </div>
        ) : (
          <span className={`${sizes.text} leading-none`}>
            {SUIT_SYMBOL[card.suit]}
          </span>
        )}
      </div>

      {/* Sağ Alt Ters İskambil Köşe İndeksi */}
      <div
        className={`absolute bottom-1 right-1.5 leading-none rotate-180 flex flex-col items-center ${suitColor}`}
      >
        <span className={`font-black tracking-tighter ${sizes.corner}`}>
          {card.rank}
        </span>
        <span className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</span>
      </div>
    </div>
  );
}
