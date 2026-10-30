import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import type { Card as CardType } from '../types/game';
import { CARD_TRANSITION } from '../utils/cardTransition';
import type { HTMLMotionProps } from 'framer-motion';

export interface CardProps extends Omit<HTMLMotionProps<"div">, "onClick" | "className" | "style"> {
  card: CardType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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

/**
 * 4K Vektörel Keskinlikte Özel Tasarım Kart Arkası (Geometrik Pusula & Mandala Deseni)
 */
function OrnamentalCardBack({ isLandscape }: { isLandscape: boolean }) {
  return (
    <svg
      className="w-full h-full select-none pointer-events-none"
      viewBox={isLandscape ? '0 0 140 100' : '0 0 100 140'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdf3d0" />
          <stop offset="50%" stopColor="#e5be67" />
          <stop offset="100%" stopColor="#b58428" />
        </linearGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#264378" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f1d38" stopOpacity="1" />
        </radialGradient>
      </defs>

      {isLandscape ? (
        <g transform="translate(140, 0) rotate(90)">
          <CardBackArtwork />
        </g>
      ) : (
        <CardBackArtwork />
      )}
    </svg>
  );
}

function CardBackArtwork() {
  return (
    <>
      {/* İç Zemin */}
      <rect x="5" y="5" width="90" height="130" rx="6" fill="url(#centerGlow)" />

      {/* Çift Çizgili Altın Filigran Çerçeve */}
      <rect x="6.5" y="6.5" width="87" height="127" rx="5" stroke="url(#goldGrad)" strokeWidth="1.2" strokeOpacity="0.75" />
      <rect x="10" y="10" width="80" height="120" rx="3.5" stroke="url(#goldGrad)" strokeWidth="0.7" strokeOpacity="0.45" strokeDasharray="2 2" />

      {/* Arka Plan İnce Geometrik Kafes (Guilloché) */}
      <g stroke="url(#goldGrad)" strokeOpacity="0.14" strokeWidth="0.6">
        <line x1="10" y1="35" x2="90" y2="105" />
        <line x1="90" y1="35" x2="10" y2="105" />
        <line x1="10" y1="70" x2="50" y2="10" />
        <line x1="90" y1="70" x2="50" y2="10" />
        <line x1="10" y1="70" x2="50" y2="130" />
        <line x1="90" y1="70" x2="50" y2="130" />
      </g>

      {/* Köşe Süslemeleri (4 Köşe Rozeti) */}
      <g fill="url(#goldGrad)" fillOpacity="0.75">
        <path d="M14 14 L22 14 L14 22 Z" />
        <path d="M86 14 L78 14 L86 22 Z" />
        <path d="M14 126 L22 126 L14 118 Z" />
        <path d="M86 126 L78 126 L86 118 Z" />
      </g>

      {/* Üst ve Alt Simetrik Taç Yaprak Kemerleri */}
      <path d="M32 18 Q50 28 68 18" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.55" fill="none" />
      <path d="M32 122 Q50 112 68 122" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.55" fill="none" />
      <circle cx="50" cy="18" r="2" fill="url(#goldGrad)" fillOpacity="0.8" />
      <circle cx="50" cy="122" r="2" fill="url(#goldGrad)" fillOpacity="0.8" />

      {/* Merkez Madalyon: 8 Köşeli Pusula Yıldızı & Mandala */}
      <g transform="translate(50, 70)">
        {/* Dış Halka */}
        <circle r="26" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.5" />
        <circle r="22" stroke="url(#goldGrad)" strokeWidth="0.7" strokeOpacity="0.35" strokeDasharray="3 2" />

        {/* Döndürülmüş Kareler (Sekizgen Yıldız Kafesi) */}
        <rect x="-15" y="-15" width="30" height="30" rx="2" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.6" />
        <rect x="-15" y="-15" width="30" height="30" rx="2" transform="rotate(45)" stroke="url(#goldGrad)" strokeWidth="1" strokeOpacity="0.6" />

        {/* 8 Köşeli Pusula Yıldızı */}
        <polygon
          points="0,-20 4,-5 20,0 4,5 0,20 -4,5 -20,0 -4,-5"
          fill="url(#goldGrad)"
          fillOpacity="0.28"
          stroke="url(#goldGrad)"
          strokeWidth="1.1"
        />
        <polygon
          points="0,-16 3.5,-3.5 16,0 3.5,3.5 0,16 -3.5,3.5 -16,0 -3.5,-3.5"
          transform="rotate(45)"
          fill="url(#goldGrad)"
          fillOpacity="0.45"
          stroke="url(#goldGrad)"
          strokeWidth="0.9"
        />

        {/* Merkez Mücevher Çekirdeği */}
        <circle r="6.5" fill="#10203d" stroke="url(#goldGrad)" strokeWidth="1.2" />
        <polygon points="0,-4 4,0 0,4 -4,0" fill="url(#goldGrad)" />
      </g>
    </>
  );
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

  // Sadece kart çevrilirken (850ms) 3D perspective aktif olur; sabit dururken 4K/Retina vektör keskinliği için flat 2D render kullanılır!
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
  const sizeMap: Record<SizeKey, { w: string; h: string; lw: string; lh: string; text: string; corner: string }> = {
    xs:    { w: 'w-11', h: 'h-16', lw: 'w-15', lh: 'h-10', text: 'text-sm',   corner: 'text-[9px]' },
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
      whileTap={canInteract ? { scale: 0.96 } : {}}
      transition={motionProps.transition || CARD_TRANSITION}
      onClick={canInteract ? onClick : undefined}
      style={style}
    >
      {/* Seçili / Highlight Çerçevesi — Sadece highlight true iken görünür */}
      {highlight && (
        <motion.div
          className="absolute -inset-1 rounded-[12px] pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.6, 0.95],
            scale: [1, 1.02],
            transition: { repeat: Infinity, repeatType: 'mirror', duration: 1.1, ease: [0.45, 0, 0.55, 1] },
          }}
          style={{
            border: '1.5px solid rgba(250, 225, 156, 0.72)',
            boxShadow: '0 0 16px 2px rgba(212,168,67,0.4), inset 0 0 8px rgba(212,168,67,0.2)',
          }}
        />
      )}

      {/* Ceza Kartı Göstergesi */}
      {card.isPenalty && (
        <motion.div
          className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-600 rounded-full text-white text-[9px] font-black border-2 border-red-200 shadow-md z-30 pointer-events-none"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
        >
          ⚠
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
          /* 3D Çevirme Aşaması (850ms) */
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
                borderRadius: '10px',
              }}
            >
              <OrnamentalCardBack isLandscape={isLandscape} />
            </div>

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
              <CardFrontContent card={card} isRed={isRed} isPowerCard={isPowerCard} sizes={sizes} />
            </div>
          </div>
        ) : (
          /* Sabit Durum: %100 4K Vektörel Netlik (Sıfır 3D Bulanıklığı) */
          <div className="w-full h-full relative">
            {!card.isRevealed ? (
              <div
                className="card-back w-full h-full"
                style={{ borderRadius: '10px' }}
              >
                <OrnamentalCardBack isLandscape={isLandscape} />
              </div>
            ) : (
              <div
                className={`card-face w-full h-full ${isSpecial ? 'special-card-bg' : ''} ${card.rank === 'K' && isRed ? 'red-king-card-bg' : ''}`}
                style={{ borderRadius: '10px', padding: '4px' }}
              >
                <CardFrontContent card={card} isRed={isRed} isPowerCard={isPowerCard} sizes={sizes} />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CardFrontContent({
  card,
  isRed,
  isPowerCard,
  sizes,
}: {
  card: CardType;
  isRed: boolean;
  isPowerCard: boolean;
  sizes: { text: string; corner: string };
}) {
  if (card.rank === 'Joker') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <span className="text-purple-600 text-xl sm:text-2xl">🃏</span>
        <span className="text-purple-700 font-black text-[9px] sm:text-[10px] tracking-wider">JOKER</span>
        <span className="text-[7px] sm:text-[8px] bg-purple-500/15 text-purple-800 rounded px-1.5 font-bold mt-0.5">
          0 pt
        </span>
      </div>
    );
  }

  return (
    <>
      <div className={`absolute top-1 left-1.5 leading-none flex flex-col items-center ${isRed ? 'suit-red' : 'suit-black'}`}>
        <div className={`font-black ${sizes.corner}`}>{card.rank}</div>
        <div className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</div>
      </div>

      {/* Orta Sembol */}
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
        <span className={`text-[7px] sm:text-[8px] rounded px-1 font-bold ${
          card.value < 0
            ? 'bg-amber-400/30 text-amber-900 border border-amber-500/40'
            : 'bg-black/10 text-gray-700'
        }`}>
          {getCardScore(card)} pt
        </span>
      </div>
    </>
  );
}
