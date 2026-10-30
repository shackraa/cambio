import { motion } from 'framer-motion';
import { useEffect, useState, useRef, memo } from 'react';
import type { Card as CardType } from '../types/game';
import { CARD_TRANSITION } from '../utils/cardTransition';
import { useCustomizationStore, type CardBackSkin } from '../store/useCustomizationStore';
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
  overrideBackSkin?: CardBackSkin;
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
  spades:   '♠',
  joker:    '★',
};

const COURT_SYMBOL: Record<string, string> = {
  K: '♔',
  Q: '♕',
  J: '♘',
};

/**
 * Gerçek İskambil Kağıdı Sırt Tasarımları (Klasik Kırmızı, Klasik Mavi, Kraliyet Pusulası, Zümrüt Botanik)
 */
function PlayingCardBack({ skin, isLandscape }: { skin: CardBackSkin; isLandscape: boolean }) {
  if (skin === 'classic_red' || skin === 'classic_blue') {
    const isRedSkin = skin === 'classic_red';
    const primaryBg = isRedSkin ? '#b91c1c' : '#1d4ed8';
    const deepBg = isRedSkin ? '#881313' : '#172554';
    const patternStroke = isRedSkin ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.22)';

    return (
      <div className="w-full h-full bg-white p-[3.5px] sm:p-[4.5px] rounded-[9px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[5px] relative overflow-hidden flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${primaryBg} 0%, ${deepBg} 100%)`,
            border: '1.5px solid rgba(255,255,255,0.85)',
            boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.22)',
          }}
        >
          {/* Klasik İskambil Baklava (Bicycle Cross-Hatch) Dokusu */}
          <div
            className="absolute inset-[2px] rounded-[3px] border border-white/45"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, ${patternStroke} 0px, ${patternStroke} 1px, transparent 1px, transparent 6px),
                repeating-linear-gradient(-45deg, ${patternStroke} 0px, ${patternStroke} 1px, transparent 1px, transparent 6px)
              `,
            }}
          />

          {/* Köşe İskambil Sembolleri */}
          <span className="absolute top-1 left-1 text-[7px] text-white/75 leading-none">♠</span>
          <span className="absolute top-1 right-1 text-[7px] text-white/75 leading-none">♥</span>
          <span className="absolute bottom-1 left-1 text-[7px] text-white/75 leading-none">♦</span>
          <span className="absolute bottom-1 right-1 text-[7px] text-white/75 leading-none">♣</span>

          {/* Merkez İskambil Rozeti */}
          <div
            className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[1.5px] border-white/85 flex items-center justify-center shadow-xs"
            style={{
              background: deepBg,
              transform: isLandscape ? 'rotate(90deg)' : undefined,
            }}
          >
            <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full border border-white/45 flex items-center justify-center text-white text-[10px] sm:text-xs font-black">
              ♠
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (skin === 'emerald_botanical') {
    return (
      <div className="w-full h-full bg-[#fdf8ec] p-[3.5px] sm:p-[4.5px] rounded-[9px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[5px] relative overflow-hidden flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #155e46 0%, #092e22 100%)',
            border: '1.5px solid #e8c468',
          }}
        >
          <div
            className="absolute inset-[2px] rounded-[3px] border border-[#e8c468]/40"
            style={{
              backgroundImage: `
                repeating-linear-gradient(60deg, rgba(232,196,104,0.16) 0px, rgba(232,196,104,0.16) 1px, transparent 1px, transparent 7px),
                repeating-linear-gradient(-60deg, rgba(232,196,104,0.16) 0px, rgba(232,196,104,0.16) 1px, transparent 1px, transparent 7px)
              `,
            }}
          />
          <div
            className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e8c468]/80 bg-[#092e22] flex items-center justify-center text-[#f7dfa0] text-xs"
            style={{ transform: isLandscape ? 'rotate(90deg)' : undefined }}
          >
            ✦
          </div>
        </div>
      </div>
    );
  }

  // 'royal_compass'
  return (
    <div className="w-full h-full bg-[#f5ebd6] p-[3.5px] sm:p-[4.5px] rounded-[9px] select-none pointer-events-none flex items-center justify-center">
      <div
        className="w-full h-full rounded-[5px] relative overflow-hidden flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #1e3a6e 0%, #0d1b36 100%)',
          border: '1.5px solid #e5be67',
        }}
      >
        <div
          className="absolute inset-[2px] rounded-[3px] border border-[#e5be67]/40"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, rgba(229,190,103,0.15) 0px, rgba(229,190,103,0.15) 1px, transparent 1px, transparent 7px),
              repeating-linear-gradient(-45deg, rgba(229,190,103,0.15) 0px, rgba(229,190,103,0.15) 1px, transparent 1px, transparent 7px)
            `,
          }}
        />
        <div
          className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e5be67]/85 bg-[#0d1b36] flex items-center justify-center text-[#fdf3d0] text-xs"
          style={{ transform: isLandscape ? 'rotate(90deg)' : undefined }}
        >
          ❂
        </div>
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
  ...motionProps
}: CardProps) {
  const cardBack = useCustomizationStore(s => s.cardBack);
  const cardFront = useCustomizationStore(s => s.cardFront);
  const activeBackSkin = overrideBackSkin ?? cardBack;

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isRedKing = card.rank === 'K' && isRed;
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
    xs:    { w: 'w-11', h: 'h-16', lw: 'w-15', lh: 'h-10', text: 'text-base', corner: 'text-[9px]' },
    sm:    { w: 'w-14', h: 'h-20', lw: 'w-20', lh: 'h-14', text: 'text-lg',   corner: 'text-[10px]' },
    md:    { w: 'w-16', h: 'h-24', lw: 'w-24', lh: 'h-16', text: 'text-2xl',  corner: 'text-xs' },
    lg:    { w: 'w-20', h: 'h-28', lw: 'w-28', lh: 'h-20', text: 'text-3xl',  corner: 'text-sm' },
    xl:    { w: 'w-24', h: 'h-36', lw: 'w-36', lh: 'h-24', text: 'text-4xl',  corner: 'text-base' },
    '2xl': { w: 'w-28', h: 'h-40', lw: 'w-40', lh: 'h-28', text: 'text-5xl',  corner: 'text-lg' },
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

  const frontBgClass = isRedKing
    ? 'red-king-card-bg'
    : cardFront === 'vintage'
      ? 'bg-[#fdf8ec]'
      : 'bg-white';

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
      {/* Seçili / Highlight Çerçevesi */}
      {highlight && (
        <motion.div
          className="absolute -inset-1 rounded-[11px] pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.6, 0.95],
            scale: [1, 1.02],
            transition: { repeat: Infinity, repeatType: 'mirror', duration: 1.1, ease: [0.45, 0, 0.55, 1] },
          }}
          style={{
            border: '1.5px solid rgba(250, 225, 156, 0.75)',
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
              <CardFrontContent card={card} isRed={isRed} isPowerCard={isPowerCard} sizes={sizes} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {!card.isRevealed ? (
              <div className="card-back w-full h-full" style={{ borderRadius: '9px' }}>
                <PlayingCardBack skin={activeBackSkin} isLandscape={isLandscape} />
              </div>
            ) : (
              <div className={`card-face w-full h-full ${frontBgClass}`} style={{ borderRadius: '9px' }}>
                <CardFrontContent card={card} isRed={isRed} isPowerCard={isPowerCard} sizes={sizes} />
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
}: {
  card: CardType;
  isRed: boolean;
  isPowerCard: boolean;
  sizes: { text: string; corner: string };
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
        <span className="text-purple-900 font-black text-[8px] sm:text-[9px] tracking-[0.12em] mt-0.5">JOKER</span>
        <div className="absolute bottom-1.5 right-1.5 rotate-180 text-[7px] sm:text-[8px] font-black text-purple-800 tracking-tighter leading-none flex flex-col items-center">
          <span>J</span>
          <span>★</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Klasik İskambil İç Çerçeve Çizgisi */}
      <div
        className={`absolute inset-[4px] sm:inset-[5px] rounded-[5px] border pointer-events-none ${
          isCourt ? 'border-amber-500/35 bg-amber-50/20' : 'border-slate-300/55'
        }`}
      />

      {/* Sol Üst İskambil Köşe İndeksi (Sayı + Sinek/Kupa/Karo/Maça) */}
      <div className={`absolute top-1 left-1.5 leading-none flex flex-col items-center ${suitColor}`}>
        <span className={`font-black tracking-tighter ${sizes.corner}`}>{card.rank}</span>
        <span className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</span>
      </div>

      {/* Sağ Üst Mini Özel Güç veya -1 Kral İşareti */}
      {card.value < 0 ? (
        <span className="absolute top-1.5 right-1.5 text-[7px] sm:text-[8px] font-extrabold text-amber-800 bg-amber-200/80 px-1 rounded leading-tight">
          -1
        </span>
      ) : isPowerCard ? (
        <span className="absolute top-1.5 right-1.5 text-[8px] sm:text-[9px] leading-none opacity-75" title="Power Card">
          ⚡
        </span>
      ) : null}

      {/* Merkez İskambil Sembolü / Kraliyet Figürü */}
      <div className={`${suitColor} flex flex-col items-center justify-center select-none`}>
        {isCourt ? (
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-xs sm:text-sm opacity-80 -mb-0.5">{COURT_SYMBOL[card.rank]}</span>
            <span className={sizes.text}>{SUIT_SYMBOL[card.suit]}</span>
          </div>
        ) : (
          <span className={`${sizes.text} leading-none`}>{SUIT_SYMBOL[card.suit]}</span>
        )}
      </div>

      {/* Sağ Alt Ters İskambil Köşe İndeksi */}
      <div className={`absolute bottom-1 right-1.5 leading-none rotate-180 flex flex-col items-center ${suitColor}`}>
        <span className={`font-black tracking-tighter ${sizes.corner}`}>{card.rank}</span>
        <span className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</span>
      </div>
    </div>
  );
}
