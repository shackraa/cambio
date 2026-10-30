import { motion } from 'framer-motion';
import { memo } from 'react';
import { GameCard, PlayingCardBack } from './GameCard';
import type { Card } from '../types/game';
import { useLangStore } from '../store/useLangStore';
import { useCustomizationStore } from '../store/useCustomizationStore';
import { translations } from '../i18n/translations';

interface CenterAreaProps {
  deck: Card[];
  discardPile: Card[];
  onDrawFromDeck?: () => void;
  onDrawFromDiscard?: () => void;
  canDraw?: boolean;
  myPlayerId?: string;
  compact?: boolean;
  ultraCompact?: boolean;
  cardSize?: 'xs' | 'sm' | 'md' | 'lg';
}

// Çöpteki her kartın masaya atıldığında hafif organik bir açıyla durması için deterministik açı
function stableRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return (hash % 13) - 6; // -6 ile +6 derece arası
}

// Çöpteki her kartın üst üste hafif dağınık birikmesi için deterministik x/y ofseti
function stableOffset(id: string, stackIdx: number): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) & 0xffff;
  const jitterX = (hash % 13) - 6;
  const jitterY = ((hash >> 4) % 13) - 6;
  const stackLift = Math.min(stackIdx * 0.35, 6);
  return {
    x: jitterX,
    y: jitterY - stackLift,
  };
}

export const CenterArea = memo(function CenterArea({
  deck,
  discardPile,
  onDrawFromDeck,
  onDrawFromDiscard,
  canDraw,
  compact = false,
  ultraCompact = false,
  cardSize,
}: CenterAreaProps) {
  const deckCount = deck.length;
  const topDeckCard = deck[0] ?? null;
  const topDiscard = discardPile[discardPile.length - 1] ?? null;
  const effectiveCardSize = cardSize ?? (ultraCompact ? 'xs' : compact ? 'sm' : 'md');
  const boxClass =
    effectiveCardSize === 'xs'
      ? 'w-11 h-16'
      : effectiveCardSize === 'sm'
        ? 'w-14 h-20'
        : effectiveCardSize === 'md'
          ? 'w-16 h-24'
          : 'w-20 h-28';

  const lang = useLangStore((s) => s.lang);
  const cardBack = useCustomizationStore((s) => s.cardBack);
  const t = translations[lang];

  // Deste kalınlığını gösteren statik kağıt katmanları (0 CPU/Framer maliyeti)
  const stackThicknessLayers = Math.min(Math.floor(deckCount / 9), 4);

  // Çöp destesinde yalnızca görünür olan en üstteki 5 kartı render ediyoruz
  const visibleDiscard = discardPile.slice(-5);

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 relative">
      <div className="flex items-center gap-5 sm:gap-14 relative z-10">
        {/* ─── KAPALI DESTE (DECK) — Fiziksel Yığın ─── */}
        <motion.div
          className={`flex flex-col items-center gap-1 relative ${
            canDraw && deckCount > 0 ? 'cursor-pointer' : 'cursor-default'
          }`}
          whileHover={canDraw && deckCount > 0 ? { scale: 1.04 } : {}}
          whileTap={canDraw && deckCount > 0 ? { scale: 0.96 } : {}}
          onClick={canDraw && deckCount > 0 ? onDrawFromDeck : undefined}
        >
          <div
            className={`relative ${boxClass} rounded-[9px]`}
            style={{
              boxShadow: deckCount > 0 ? '0 14px 28px rgba(0, 0, 0, 0.36)' : 'none',
            }}
          >
            {/* Deste kalınlığını gösteren hafif statik katmanlar */}
            {Array.from({ length: stackThicknessLayers }).map((_, layerIdx) => (
              <div
                key={`stack-edge-${layerIdx}`}
                className="absolute inset-0 rounded-[9px] bg-[#e8e2d5] border border-black/20 pointer-events-none"
                style={{
                  transform: `translate3d(${(stackThicknessLayers - layerIdx) * 1.2}px, ${(stackThicknessLayers - layerIdx) * 1.6}px, 0)`,
                  zIndex: 0,
                }}
              />
            ))}

            {/* Destede 2 veya daha fazla kart varken altta sabit duran statik kart sırtı (üstteki kart uçarken deste asla boşalmaz/titremez) */}
            {deckCount > 1 && (
              <div
                className="absolute inset-0 rounded-[8px] pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <PlayingCardBack skin={cardBack} />
              </div>
            )}

            {/* Sadece sıradaki en üst kart (topDeckCard) gerçek layoutId ile render edilir; çekildiğinde veya dağıtıldığında doğrudan oyuncunun eline uçar! */}
            {topDeckCard ? (
              <div
                key={topDeckCard.id}
                className="absolute inset-0"
                style={{ zIndex: 2 }}
              >
                <GameCard
                  card={{ ...topDeckCard, isRevealed: false }}
                  size={effectiveCardSize}
                  canInteract={canDraw}
                />
              </div>
            ) : (
              <div className="absolute inset-0 border-2 border-dashed border-white/25 rounded-[9px] flex items-center justify-center bg-emerald-950/30">
                <span className="text-white/40 text-xs font-bold">
                  {lang === 'tr' ? 'BOŞ' : 'EMPTY'}
                </span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-6 sm:-bottom-8 w-max text-center">
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-100/85 bg-emerald-950/65 px-2.5 sm:px-3 py-0.5 rounded-full border border-emerald-400/20 shadow-xs">
              {t.cardCount(deckCount)}
            </span>
          </div>
        </motion.div>

        {/* ─── ÇÖP DESTESİ (DISCARD PILE) — Fiziksel Biriken Yığın ─── */}
        <motion.div
          className={`relative ${boxClass} ${
            canDraw && topDiscard ? 'cursor-pointer' : 'cursor-default'
          }`}
          whileHover={canDraw && topDiscard ? { scale: 1.04 } : {}}
          whileTap={canDraw && topDiscard ? { scale: 0.96 } : {}}
          onClick={canDraw && topDiscard ? onDrawFromDiscard : undefined}
        >
          {/* Çöp kutusu zemin halkası */}
          <div
            className="absolute inset-0 border-2 border-dashed border-[var(--gold)]/30 rounded-[9px] flex items-center justify-center bg-emerald-950/25 pointer-events-none"
            style={{
              boxShadow: discardPile.length > 0 ? '0 14px 30px rgba(0, 0, 0, 0.34)' : 'none',
            }}
          >
            {discardPile.length === 0 && (
              <span className="text-white/25 text-xs font-bold uppercase tracking-widest">
                {lang === 'tr' ? 'ÇÖP' : 'PILE'}
              </span>
            )}
          </div>

          <div className="relative w-full h-full">
            {visibleDiscard.map((card, idx) => {
              const offset = stableOffset(card.id, idx);
              const rotation = stableRotation(card.id);
              const isTop = idx === visibleDiscard.length - 1;
              return (
                <div
                  key={card.id}
                  className={`absolute inset-0 origin-center ${isTop ? '' : 'no-card-shadow'}`}
                  style={{
                    zIndex: idx + 1,
                    pointerEvents: isTop ? 'auto' : 'none',
                  }}
                >
                  <GameCard
                    card={{ ...card, isRevealed: true }}
                    size={effectiveCardSize}
                    canInteract={canDraw && isTop}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: offset.x,
                      y: offset.y,
                      rotate: rotation,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute -bottom-6 sm:-bottom-8 w-max left-1/2 -translate-x-1/2 text-center">
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-100/85 bg-emerald-950/65 px-2.5 sm:px-3 py-0.5 rounded-full border border-emerald-400/20 shadow-xs">
              {t.discardPile} ({discardPile.length})
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
});
