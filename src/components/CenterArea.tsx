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
  return ((hash % 15) - 7); // -7 ile +7 derece arası
}

// Çöpteki her kartın üst üste hafif dağınık birikmesi için deterministik x/y ofseti
function stableOffset(id: string, stackIdx: number): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) & 0xffff;
  // Üst üste biriktikçe hafif yukarı-sola kalınlık hissi + doğal dağınıklık
  const jitterX = (hash % 17) - 8;
  const jitterY = ((hash >> 4) % 17) - 8;
  const stackLift = Math.min(stackIdx * 0.4, 8);
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
  // deck[0] en üstte çekilecek olan karttır, bu yüzden ters çevirip en üste deck[0]'ı koyuyoruz.
  const deckReversed = [...deck].reverse();

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <div className="flex items-center gap-12 relative z-10">
        {/* ─── KAPALI DESTE (DECK) — Fiziksel Yığın ─── */}
        <motion.div
          className={`flex flex-col items-center gap-1 relative ${
            canDraw && deckCount > 0 ? 'cursor-pointer' : 'cursor-default'
          }`}
          whileHover={canDraw && deckCount > 0 ? { scale: 1.04 } : {}}
          whileTap={canDraw && deckCount > 0 ? { scale: 0.96 } : {}}
          onClick={canDraw && deckCount > 0 ? onDrawFromDeck : undefined}
        >
          <div className="relative w-20 h-28">
            {deckCount > 0 ? (
              deckReversed.map((card, idx) => {
                // Alt katmanlardan en üste doğru hafif 3D yığın kalınlığı
                const depthFromBottom = idx;
                const visualLayer = Math.min(depthFromBottom, 18);
                const offsetX = visualLayer * 0.45;
                const offsetY = -visualLayer * 0.65;
                const isTopCard = idx === deckReversed.length - 1;

                return (
                  <div
                    key={card.id}
                    className="absolute inset-0"
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
                      style={{
                        boxShadow:
                          idx === 0
                            ? '0 10px 24px rgba(0,0,0,0.75)'
                            : isTopCard
                              ? '0 4px 12px rgba(0,0,0,0.45)'
                              : 'none',
                      }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-[10px] flex items-center justify-center bg-black/10">
                <span className="text-white/30 text-xs font-bold">BOŞ</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-7 w-max text-center">
            <span className="text-xs font-semibold text-white/70 bg-black/35 px-2.5 py-0.5 rounded-full border border-white/10">
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
          {/* Çöp kutusu zemin halkası (her zaman görünür ki kartlar nereye atılıyor belli olsun) */}
          <div className="absolute inset-0 border-2 border-dashed border-[var(--gold)]/25 rounded-[10px] flex items-center justify-center bg-black/15 pointer-events-none">
            {discardPile.length === 0 && (
              <span className="text-white/25 text-2xl">🗑️</span>
            )}
          </div>

          {/* Çöpe atılan TÜM kartlar üst üste birikir — hiçbir kart kaybolmaz */}
          <div className="relative w-full h-full">
            {discardPile.map((card, idx) => {
              const offset = stableOffset(card.id, idx);
              const rotation = stableRotation(card.id);
              const isTop = idx === discardPile.length - 1;
              return (
                <div
                  key={card.id}
                  className="absolute inset-0 origin-center"
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
                    style={{
                      boxShadow:
                        idx >= discardPile.length - 4
                          ? '0 8px 22px rgba(0,0,0,0.65)'
                          : '0 2px 6px rgba(0,0,0,0.35)',
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute -bottom-7 w-max left-1/2 -translate-x-1/2 text-center">
            <span className="text-xs font-semibold text-white/70 bg-black/35 px-2.5 py-0.5 rounded-full border border-white/10">
              🗑 {t.discardPile} ({discardPile.length})
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
