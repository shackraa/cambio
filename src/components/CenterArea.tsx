import { motion, AnimatePresence } from 'framer-motion';
import { GameCard } from './GameCard';
import type { Card } from '../types/game';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

interface CenterAreaProps {
  deckCount: number;
  topDeckCard?: Card;
  discardPile: Card[];
  onDrawFromDeck?: () => void;
  onDrawFromDiscard?: () => void;
  canDraw?: boolean;
  myPlayerId?: string;
}

// Kart id'sinden deterministik rotasyon ve offset üret
function stableRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return ((hash % 15) - 7); // -7 ile +7 derece arası
}

function stableOffset(id: string): { x: number, y: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) & 0xffff;
  return {
    x: ((hash % 9) - 4), // -4 ile +4 px arası
    y: (((hash >> 4) % 9) - 4),
  };
}

export function CenterArea({
  deckCount,
  topDeckCard,
  discardPile,
  onDrawFromDeck,
  onDrawFromDiscard,
  canDraw,
  myPlayerId,
}: CenterAreaProps) {
  const topDiscard = discardPile[discardPile.length - 1] ?? null;
  const discardStack = discardPile.slice(-15); // Son 15 kartı fiziksel olarak tut

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  // Deste kalınlığı
  const deckThickness = Math.min(5, Math.ceil(deckCount / 10)); 
  const deckOffsets = Array.from({ length: deckThickness }, (_, i) => i + 1).reverse();

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <div className="flex items-center gap-8 relative z-10">
        {/* Deste (Deck) */}
        <motion.div
          className={`flex flex-col items-center gap-1 relative ${canDraw ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
          whileHover={canDraw ? { scale: 1.05 } : {}}
          whileTap={canDraw ? { scale: 0.95 } : {}}
          onClick={canDraw ? onDrawFromDeck : undefined}
        >
          <div className="relative w-20 h-28">
            {/* Deste derinliği efekti (Alttaki statik kartlar) */}
            {deckOffsets.map((offset) => (
              <div
                key={offset}
                className="absolute card-back rounded-[10px] border-2 border-[var(--gold)]/50"
                style={{
                  width: '100%',
                  height: '100%',
                  top: -offset * 1.5,
                  left: offset * 0.8,
                  background: 'linear-gradient(135deg, #1e2d5a 0%, #0f1a3d 100%)',
                  zIndex: 10 - offset,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                }}
              />
            ))}
            {/* EN ÜSTTEKİ KART (Layout Animasyonu İçin) */}
            {topDeckCard && (
              <div className="absolute top-0 left-0 w-full h-full z-10">
                <GameCard card={{ ...topDeckCard, isRevealed: false }} size="lg" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-6 w-full text-center">
            <span className="text-xs text-white/60">📦 {t.cardCount(deckCount)}</span>
          </div>
        </motion.div>

        {/* Çöp destesi */}
        <motion.div
          className={`relative w-20 h-28 ${canDraw && topDiscard ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
          whileHover={canDraw && topDiscard ? { scale: 1.05 } : {}}
          whileTap={canDraw && topDiscard ? { scale: 0.95 } : {}}
          onClick={canDraw && topDiscard ? onDrawFromDiscard : undefined}
        >
          {discardStack.length > 0 ? (
            discardStack.map((card, idx) => {
              const offset = stableOffset(card.id);
              const rotation = stableRotation(card.id);
              return (
                <div key={card.id} className="absolute inset-0" style={{ zIndex: idx }}>
                  <GameCard 
                    card={card} 
                    size="lg" 
                    style={{ 
                      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                    }} 
                  />
                </div>
              );
            })
          ) : (
            <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-[10px] flex items-center justify-center bg-black/10">
              <span className="text-white/30 text-2xl">🗑️</span>
            </div>
          )}
          <div className="absolute -bottom-6 w-full text-center">
            <span className="text-xs text-white/60">🗑 {t.discardPile}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
