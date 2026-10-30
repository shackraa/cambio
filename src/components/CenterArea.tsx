import { motion } from 'framer-motion';
import { GameCard } from './GameCard';
import type { Card } from '../types/game';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

interface CenterAreaProps {
  deck: Card[];
  discardPile: Card[];
  onDrawFromDeck?: () => void;
  onDrawFromDiscard?: () => void;
  canDraw?: boolean;
  myPlayerId?: string;
}

// Çöpteki her kartın masaya atıldığında hafif organik bir açıyla durması için deterministik açı
function stableRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return ((hash % 13) - 6); // -6 ile +6 derece arası
}

// Çöpteki her kartın üst üste hafif dağınık birikmesi için deterministik x/y ofseti
function stableOffset(id: string, stackIdx: number): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) & 0xffff;
  const jitterX = (hash % 13) - 6;
  const jitterY = ((hash >> 4) % 13) - 6;
  const stackLift = Math.min(stackIdx * 0.35, 7);
  return {
    x: jitterX,
    y: jitterY - stackLift,
  };
}

export function CenterArea({
  deck,
  discardPile,
  onDrawFromDeck,
  onDrawFromDiscard,
  canDraw,
}: CenterAreaProps) {
  const deckCount = deck.length;
  const topDiscard = discardPile[discardPile.length - 1] ?? null;

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  // Kapalı destedeki TÜM kartları fiziksel olarak render ediyoruz (hiçbir kart DOM'dan kaybolmaz).
  // deck[0] en üstte çekilecek olan karttır.
  const deckReversed = [...deck].reverse();

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <div className="flex items-center gap-14 relative z-10">
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
            className="relative w-20 h-28 rounded-[10px]"
            style={{
              // Gölgeleri kartlara tek tek vermek yerine yığının tabanına tek bir yumuşak, geniş gölge veriyoruz!
              boxShadow: deckCount > 0 ? '0 14px 32px rgba(0, 0, 0, 0.38)' : 'none',
            }}
          >
            {deckCount > 0 ? (
              deckReversed.map((card, idx) => {
                const visualLayer = Math.min(idx, 16);
                const offsetX = visualLayer * 0.4;
                const offsetY = -visualLayer * 0.6;
                const isTopCard = idx === deckReversed.length - 1;

                return (
                  <div
                    key={card.id}
                    className={`absolute inset-0 ${isTopCard ? '' : 'no-card-shadow'}`}
                    style={{
                      zIndex: idx + 1,
                      transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
                      pointerEvents: isTopCard ? 'auto' : 'none',
                    }}
                  >
                    <GameCard
                      card={{ ...card, isRevealed: false }}
                      size="lg"
                      canInteract={canDraw && isTopCard}
                    />
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 border-2 border-dashed border-white/25 rounded-[10px] flex items-center justify-center bg-emerald-950/30">
                <span className="text-white/40 text-xs font-bold">BOŞ</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-8 w-max text-center">
            <span className="text-xs font-semibold text-emerald-100/80 bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-400/20 shadow-sm">
              📦 {t.cardCount(deckCount)}
            </span>
          </div>
        </motion.div>

        {/* ─── ÇÖP DESTESİ (DISCARD PILE) — Fiziksel Biriken Yığın ─── */}
        <motion.div
          className={`relative w-20 h-28 ${
            canDraw && topDiscard ? 'cursor-pointer' : 'cursor-default'
          }`}
          whileHover={canDraw && topDiscard ? { scale: 1.04 } : {}}
          whileTap={canDraw && topDiscard ? { scale: 0.96 } : {}}
          onClick={canDraw && topDiscard ? onDrawFromDiscard : undefined}
        >
          {/* Çöp kutusu zemin halkası */}
          <div
            className="absolute inset-0 border-2 border-dashed border-[var(--gold)]/30 rounded-[10px] flex items-center justify-center bg-emerald-950/25 pointer-events-none"
            style={{
              boxShadow: discardPile.length > 0 ? '0 14px 34px rgba(0, 0, 0, 0.35)' : 'none',
            }}
          >
            {discardPile.length === 0 && (
              <span className="text-white/30 text-2xl">🗑️</span>
            )}
          </div>

          {/* Çöpe atılan TÜM kartlar üst üste birikir — üst üste koyu gölge binmemesi için alt kartlarda no-card-shadow kullanılır */}
          <div className="relative w-full h-full">
            {discardPile.map((card, idx) => {
              const offset = stableOffset(card.id, idx);
              const rotation = stableRotation(card.id);
              const isTop = idx === discardPile.length - 1;
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
                    size="lg"
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

          <div className="absolute -bottom-8 w-max left-1/2 -translate-x-1/2 text-center">
            <span className="text-xs font-semibold text-emerald-100/80 bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-400/20 shadow-sm">
              🗑 {t.discardPile} ({discardPile.length})
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
