import { motion } from 'framer-motion';
import { useEffect, useState, useRef, memo } from 'react';
import type { Card as CardType } from '../types/game';
import { CARD_TRANSITION } from '../utils/cardTransition';
import { SoundManager } from '../utils/SoundManager';
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
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  joker: '★',
};

/**
 * Gerçek Klasik Türk İskambil Kağıdı Sırt Tasarımları
 * (Ortada tarot gibi garip ikonlar/semboller YOK — uçtan uca klasik baklava / ekose iskambil dokusu ve beyaz çerçeve)
 */
export function PlayingCardBack({
  skin,
}: {
  skin: CardBackSkin;
  isLandscape?: boolean;
}) {
  // 1) KLASİK KIRMIZI TÜRK İSKAMBİLİ (Uçtan uca ince kırmızı-beyaz baklava dokusu)
  if (skin === 'classic_red') {
    return (
      <div className="w-full h-full bg-white p-[3.5px] sm:p-[4.5px] rounded-[8px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[4px] relative overflow-hidden"
          style={{
            backgroundColor: '#b91c1c',
            border: '1.5px solid #991b1b',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.85)',
          }}
        >
          {/* İç Çift Çizgi İskambil Çerçevesi + Klasik Baklava Dokusu */}
          <div
            className="absolute inset-[2.5px] rounded-[2px] border border-white/80"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 1.2px, transparent 1.2px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 1.2px, transparent 1.2px, transparent 5px),
                repeating-linear-gradient(45deg, rgba(127,29,29,0.45) 2.5px, rgba(127,29,29,0.45) 3.7px, transparent 3.7px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(127,29,29,0.45) 2.5px, rgba(127,29,29,0.45) 3.7px, transparent 3.7px, transparent 5px)
              `,
            }}
          />
        </div>
      </div>
    );
  }

  // 2) KLASİK LACİVERT TÜRK İSKAMBİLİ (Uçtan uca ince lacivert-beyaz baklava dokusu)
  if (skin === 'classic_blue') {
    return (
      <div className="w-full h-full bg-white p-[3.5px] sm:p-[4.5px] rounded-[8px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[4px] relative overflow-hidden"
          style={{
            backgroundColor: '#1e3a8a',
            border: '1.5px solid #172554',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.85)',
          }}
        >
          <div
            className="absolute inset-[2.5px] rounded-[2px] border border-white/80"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 1.2px, transparent 1.2px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 1.2px, transparent 1.2px, transparent 5px),
                repeating-linear-gradient(45deg, rgba(15,23,42,0.45) 2.5px, rgba(15,23,42,0.45) 3.7px, transparent 3.7px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(15,23,42,0.45) 2.5px, rgba(15,23,42,0.45) 3.7px, transparent 3.7px, transparent 5px)
              `,
            }}
          />
        </div>
      </div>
    );
  }

  // 3) KLASİK KULÜP YEŞİLİ İSKAMBİL (Uçtan uca yeşil-beyaz baklava dokusu)
  if (skin === 'emerald_botanical') {
    return (
      <div className="w-full h-full bg-white p-[3.5px] sm:p-[4.5px] rounded-[8px] select-none pointer-events-none flex items-center justify-center">
        <div
          className="w-full h-full rounded-[4px] relative overflow-hidden"
          style={{
            backgroundColor: '#14532d',
            border: '1.5px solid #052e16',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.85)',
          }}
        >
          <div
            className="absolute inset-[2.5px] rounded-[2px] border border-white/80"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255,255,255,0.26) 0px, rgba(255,255,255,0.26) 1.2px, transparent 1.2px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(255,255,255,0.26) 0px, rgba(255,255,255,0.26) 1.2px, transparent 1.2px, transparent 5px),
                repeating-linear-gradient(45deg, rgba(5,46,22,0.45) 2.5px, rgba(5,46,22,0.45) 3.7px, transparent 3.7px, transparent 5px),
                repeating-linear-gradient(-45deg, rgba(5,46,22,0.45) 2.5px, rgba(5,46,22,0.45) 3.7px, transparent 3.7px, transparent 5px)
              `,
            }}
          />
        </div>
      </div>
    );
  }

  // 4) KLASİK EKOSE BORDO İSKAMBİL ('royal_compass' -> Geleneksel Ekose / Tartan Dokulu İskambil Sırtı)
  return (
    <div className="w-full h-full bg-white p-[3.5px] sm:p-[4.5px] rounded-[8px] select-none pointer-events-none flex items-center justify-center">
      <div
        className="w-full h-full rounded-[4px] relative overflow-hidden"
        style={{
          backgroundColor: '#881337',
          border: '1.5px solid #4c0519',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.85)',
        }}
      >
        <div
          className="absolute inset-[2.5px] rounded-[2px] border border-white/80"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 6px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 6px),
              repeating-linear-gradient(45deg, rgba(251,191,36,0.22) 0px, rgba(251,191,36,0.22) 1px, transparent 1px, transparent 8px),
              repeating-linear-gradient(-45deg, rgba(251,191,36,0.22) 0px, rgba(251,191,36,0.22) 1px, transparent 1px, transparent 8px)
            `,
          }}
        />
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
  ...motionProps
}: CardProps) {
  const cardBack = useCustomizationStore((s) => s.cardBack);
  const cardFront = useCustomizationStore((s) => s.cardFront);
  const activeBackSkin = overrideBackSkin ?? cardBack;
  const activeFrontStyle = overrideFrontStyle ?? cardFront;

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isLandscape = orientation === 'landscape';

  // Ses efekti: Kart açıldığında da, geri kapandığında da fiziksel kart çevirme sesi çalar
  const prevRevealed = useRef(card.isRevealed);
  useEffect(() => {
    if (prevRevealed.current !== card.isRevealed) {
      prevRevealed.current = card.isRevealed;
      SoundManager.playCardFlip();
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
      text: 'text-xl',
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
        layoutId={card.id}
        className={`${dimClass} opacity-0 pointer-events-none shrink-0`}
        transition={CARD_TRANSITION}
      />
    );
  }

  // Kırmızı Papaz (K ♥ / K ♦, -1 puan) hafızada kolay yer etmesi için hafif sıcak altın-fildişi tonda parlar;
  // diğer tüm kartlar seçilen Saf Beyaz veya Krem iskambil zeminini kullanır.
  const isRedKing = card.rank === 'K' && isRed;
  const frontBgClass = isRedKing
    ? 'red-king-card-bg'
    : activeFrontStyle === 'vintage'
      ? 'card-face-vintage'
      : 'card-face-classic';

  return (
    <motion.div
      layoutId={card.id}
      layout
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
          className="absolute -top-2 -right-2 flex items-center justify-center px-1.5 h-5 bg-red-600 rounded-full text-white text-[9px] font-black border border-red-200 shadow-md z-30 pointer-events-none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
        >
          +1
        </motion.div>
      )}

      {/* 3D Kart Çevirme Container'ı (Açılırken de kapanırken de pürüzsüz 3D animasyon) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
          }}
          initial={false}
          animate={{
            rotateY: isLandscape ? 0 : card.isRevealed ? 180 : 0,
            rotateX: isLandscape ? (card.isRevealed ? 180 : 0) : 0,
          }}
          transition={{
            duration: 0.65,
            ease: [0.25, 1, 0.5, 1],
          }}
        >
          {/* Kartın Arkası (Kapalıyken 0deg bakar) */}
          <div
            className="card-back"
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <PlayingCardBack skin={activeBackSkin} isLandscape={isLandscape} />
          </div>

          {/* Kartın Ön Yüzü (Açılınca 180deg bakar) */}
          <div
            className={`card-face ${frontBgClass}`}
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: isLandscape ? 'rotateX(180deg)' : 'rotateY(180deg)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <CardFrontContent card={card} isRed={isRed} sizes={sizes} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

function CardFrontContent({
  card,
  isRed,
  sizes,
}: {
  card: CardType;
  isRed: boolean;
  sizes: { text: string; corner: string };
}) {
  const suitColor = isRed ? 'text-[#d91b24]' : 'text-[#111827]';
  const isRedKing = card.rank === 'K' && isRed;

  if (card.rank === 'Joker') {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-1.5 select-none">
        <div className="absolute top-1 left-1.5 leading-none flex flex-col items-center text-[#111827]">
          <span className={`font-extrabold tracking-tighter ${sizes.corner}`}>★</span>
        </div>
        <div className="grid grid-cols-2 gap-0.5 text-xs sm:text-sm leading-none">
          <span className="text-[#111827]">♠</span>
          <span className="text-[#d91b24]">♥</span>
          <span className="text-[#d91b24]">♦</span>
          <span className="text-[#111827]">♣</span>
        </div>
        <span className="text-[#111827] font-black text-[8px] sm:text-[9px] tracking-[0.14em] mt-1">
          JOKER
        </span>
        {/* Sol Alt Mini Puan Etiketi */}
        <div className="absolute bottom-1 left-1 px-1 py-[1px] rounded-[3px] bg-emerald-600/15 border border-emerald-600/30 text-[6.5px] sm:text-[7.5px] font-black text-emerald-900 leading-none">
          0 pt
        </div>
        <div className="absolute bottom-1 right-1.5 rotate-180 leading-none flex flex-col items-center text-[#d91b24]">
          <span className={`font-extrabold tracking-tighter ${sizes.corner}`}>★</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Sol Üst Klasik İskambil Köşe İndeksi */}
      <div
        className={`absolute top-1 left-1.5 leading-none flex flex-col items-center ${suitColor}`}
      >
        <span className={`font-extrabold tracking-tighter ${sizes.corner}`}>
          {card.rank}
        </span>
        <span className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</span>
      </div>

      {/* Merkez İskambil Sembolü */}
      <div className={`${suitColor} flex items-center justify-center`}>
        <span className={`${sizes.text} leading-none`}>
          {SUIT_SYMBOL[card.suit]}
        </span>
      </div>

      {/* Sol Alt Köşe: Küçük ve Zarif Puan Hatırlatıcı Etiketi (-1 pt, 10 pt vb.) */}
      <div
        className={`absolute bottom-1 left-1 px-1 py-[1px] rounded-[3px] text-[6.5px] sm:text-[7.5px] font-extrabold leading-none ${
          isRedKing
            ? 'bg-amber-500/25 border border-amber-600/45 text-amber-950 font-black'
            : 'bg-slate-900/[0.06] text-slate-600/90'
        }`}
      >
        {card.value} pt
      </div>

      {/* Sağ Alt Ters Klasik İskambil Köşe İndeksi */}
      <div
        className={`absolute bottom-1 right-1.5 leading-none rotate-180 flex flex-col items-center ${suitColor}`}
      >
        <span className={`font-extrabold tracking-tighter ${sizes.corner}`}>
          {card.rank}
        </span>
        <span className={`${sizes.corner} -mt-0.5`}>{SUIT_SYMBOL[card.suit]}</span>
      </div>
    </div>
  );
}
