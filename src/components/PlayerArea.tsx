import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Player, Card } from '../types/game';
import { CardGrid } from './CardGrid';
import { GameCard } from './GameCard';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

// ─── Çekilen kartı önce kapalı göster, sonra çevir ──────────────
function DrawnCardDisplay({
  drawnCard,
  isMe,
  cardSize,
  drawnFrom,
  onDiscardDrawn,
  t,
}: {
  drawnCard: Card;
  isMe?: boolean;
  cardSize: 'sm' | 'md' | 'lg';
  drawnFrom: 'deck' | 'discard' | null;
  onDiscardDrawn?: () => void;
  t: any;
}) {
  // Desteden çekilmişse: önce kapalı, 350ms sonra çevir
  // Çöpten çekilmişse: zaten açık geliyor
  const [isFlipped, setIsFlipped] = useState(drawnFrom === 'discard');

  useEffect(() => {
    if (drawnFrom === 'deck' && isMe) {
      const timer = setTimeout(() => setIsFlipped(true), 350);
      return () => clearTimeout(timer);
    }
  }, [drawnFrom, isMe]);

  const displayCard = isMe
    ? { ...drawnCard, isRevealed: isFlipped }
    : drawnCard;

  return (
    <>
      <GameCard card={displayCard} size={cardSize} />
      {isMe && onDiscardDrawn && (
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              className="flex flex-col gap-1.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-white/50 text-[10px]">{t.drawnAction_addOrDiscard}</p>
              <motion.button
                className="px-3 py-1.5 bg-[var(--gold)]/20 hover:bg-[var(--gold)]/40
                           border border-[var(--gold)]/40 rounded-xl text-[var(--gold)]
                           text-xs font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDiscardDrawn}
              >
                {t.drawnAction_discard}
              </motion.button>
              <span className="text-white/30 text-[9px] text-center">
                {t.drawnAction_orClickBottom}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

interface PlayerAreaProps {
  player: Player;
  position: 'bottom' | 'top' | 'left' | 'right';
  isMe?: boolean;
  onCardClick?: (position: number) => void;
  highlightPositions?: number[];
  swapHighlightPositions?: number[]; // takas edilen slotlar
  drawnCard?: Card | null;
  onDiscardDrawn?: () => void;
}

// lg kartın piksel boyutları: tailwind w-20 = 80px, h-28 = 112px, gap-1.5 = 6px
const XL_CARD_W = 80;
const XL_CARD_H = 112;
const CARD_GAP  = 6;
const GRID_H = XL_CARD_H;                      // 112px

export function PlayerArea({ player, position, isMe, onCardClick, highlightPositions = [], swapHighlightPositions = [], drawnCard, onDiscardDrawn }: PlayerAreaProps) {
  const [windowH, setWindowH] = useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  useEffect(() => {
    const fn = () => setWindowH(window.innerHeight);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  // Yan oyuncular (sol/sağ) dikey sıralı → daima küçük
  const isVerticalPlayer = position === 'left' || position === 'right';
  const cardSize = isVerticalPlayer
    ? 'sm'
    : (windowH < 700 ? 'sm' : 'md');
  const knownCards = useGameStore(s => s.knownCards);
  const phase     = useGameStore(s => s.phase);
  const peekState = useGameStore(s => s.peekState);
  const peekTarget = useGameStore(s => s.peekTarget);
  const drawnFrom  = useGameStore(s => s.drawnFrom);
  const finalScoreObj = useGameStore(s => phase === 'results' ? s.finalScores.find(fs => fs.seat === player.seat) : undefined);
  const isVertical = position === 'left' || position === 'right';

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  // Kartların orijinal boyutunda kalmasını istiyoruz
  const scaleFactor = 1;

  // Dinamik genişlik hesabı (kart sayısına göre değişir)
  const currentCardCount = Math.max(1, player.cards.length);
  const dynamicGridW = currentCardCount * XL_CARD_W + (currentCardCount - 1) * CARD_GAP;

  const peekSelectedPositions = useGameStore(s => s.peekSelectedPositions);
  
  const mergedHighlightPositions = [...highlightPositions];

  // Peek fazında sadece oyuncunun SEÇTİĞİ kartlar highlight (vurgu) alır. Güç kullanımında peekTarget da eklenir.
  const activePeekPositions: number[] = [];
  if (phase === 'peek') {
    const selections = peekSelectedPositions.filter(p => p.playerId === player.id);
    selections.forEach(s => {
      activePeekPositions.push(s.pos);
      mergedHighlightPositions.push(s.pos);
    });
  }
  if (peekTarget && peekTarget.playerId === player.id) {
    activePeekPositions.push(peekTarget.position);
  }

  const processedCards = player.cards.map((card, idx) => {

    const known = knownCards.find(
      k => k.playerId === player.id && k.position === idx
    );
    const isActive = known && (!known.expiresAt || known.expiresAt > Date.now());
    if (isActive) {
      return { ...card, rank: known.card.rank, suit: known.card.suit, value: known.card.value, isRevealed: true };
    }

    // PEEK - REVEAL FAZI İÇİN (Sadece kendi kartlarını kendin gör)
    if (phase === 'peek' && peekState === 'reveal' && isMe) {
      if (activePeekPositions.includes(idx)) {
        return { ...card, isRevealed: true };
      }
    }

    // GÜVENLİK KALKANI (Failsafe): Peek bittiyse ve knownCards'ta değilse kesinlikle kapalı olmalı!
    if (phase !== 'peek' && phase !== 'results') {
      return { ...card, isRevealed: false };
    }

    return card;
  });

  // Döndürülmüş kart satırı (sol/sağ oyuncular için)
  // Wrapper: görsel boyut = 80 × dynamicGridW (yükseklik ↔ genişlik yer değiştirir)
  // İç grid: absolute ile merkeze konumlanır, sonra 90° döndürülür
  const rotatedCards = isVertical ? (
    <div
      style={{
        position: 'relative',
        width:  `${GRID_H}px`,   // 112px (eski hali 80di, ama kart yüksekliği XL_CARD_H yani 112, düzeltiyoruz)
        height: `${dynamicGridW}px`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width:  `${dynamicGridW}px`,
          height: `${GRID_H}px`,
          // merkezi hizala
          left: `${(GRID_H - dynamicGridW) / 2}px`,
          top:  `${(dynamicGridW - GRID_H) / 2}px`,
          transform: position === 'left' ? 'rotate(-90deg)' : 'rotate(90deg)',
          transformOrigin: 'center center',
        }}
      >
        <motion.div
          animate={{ scale: scaleFactor }}
          style={{ width: '100%', height: '100%', transformOrigin: 'center center' }}
        >
          <CardGrid
            cards={processedCards}
            size={cardSize}
            direction="horizontal"
            canInteract={!!onCardClick}
            onCardClick={onCardClick}
            highlightPositions={mergedHighlightPositions}
            swapHighlightPositions={swapHighlightPositions}
            peekPositions={activePeekPositions}
            isDealing={phase === 'peek' && peekState === 'dealing'}
            isHighlighting={phase === 'peek' && peekState === 'highlight'}
            playerPosition={position}
          />
        </motion.div>
      </div>
    </div>
  ) : (
    <motion.div
      animate={{ scale: scaleFactor }}
      style={{ transformOrigin: position === 'top' ? 'top center' : 'bottom center' }}
    >
      <CardGrid
        cards={processedCards}
        size={cardSize}
        direction="horizontal"
        canInteract={!!onCardClick}
        onCardClick={onCardClick}
        highlightPositions={mergedHighlightPositions}
        swapHighlightPositions={swapHighlightPositions}
        peekPositions={activePeekPositions}
        isDealing={phase === 'peek' && peekState === 'dealing'}
        isHighlighting={phase === 'peek' && peekState === 'highlight'}
        playerPosition={position}
      />
    </motion.div>
  );

  return (
    <motion.div
      className={`flex items-center gap-1 relative flex-col`}
      initial={{ opacity: 0, y: isMe ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* İsim rozeti ve Final Puanı — z-10 (kartlar üstüne gelince kartlar önde olsun) */}
      <div className="flex gap-2 items-center relative z-10">
        <div
          className={`px-4 py-1.5 whitespace-nowrap min-w-[100px] justify-center rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
            player.isCurrentTurn
              ? 'bg-[var(--gold)] text-black shadow-[0_0_20px_rgba(212,168,67,1)] scale-110 border-2 border-white/80'
              : 'bg-black/50 text-white/90 border border-white/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          {player.nickname}
        </div>
        
        {phase === 'results' && finalScoreObj !== undefined && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-50"
          >
            <div className="px-3 py-1 rounded-full bg-[var(--gold)] text-black font-black text-sm shadow-[0_0_15px_rgba(212,168,67,0.8)] border border-yellow-300">
              {finalScoreObj.score} pt
            </div>
            {finalScoreObj.calledCambio && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/80 border border-white/20 shadow-xl">
                {finalScoreObj.cambioModifier === -10 ? (
                  <span className="text-green-400">{t.cambioSuccess}</span>
                ) : (
                  <span className="text-red-400">{t.cambioFail}</span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Kart sayısı rozeti */}
      {!isMe && (
        <span className="text-white/30 text-[9px]">{t.cardCount(player.cards.length)}</span>
      )}

      {/* Çekilen Kart (Eğer sıra bu oyuncudaysa ve kart çekildiyse) */}
      <AnimatePresence>
        {player.isCurrentTurn && phase === 'action' && drawnCard && (
          <motion.div
            key={drawnCard.id}
            className={`absolute flex items-center gap-3 z-50 ${isVertical ? (position === 'left' ? 'left-full ml-4' : 'right-full mr-4') : 'bottom-full mb-3'}`}
            initial={{ opacity: 0, scale: 0.5, y: isVertical ? 0 : 30, x: isVertical ? (position === 'left' ? -30 : 30) : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: isVertical ? 0 : 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <DrawnCardDisplay
              drawnCard={drawnCard}
              isMe={isMe}
              cardSize={cardSize}
              drawnFrom={drawnFrom}
              onDiscardDrawn={onDiscardDrawn}
              t={t}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kartlar (Yatay veya Dikey) */}
      <div className="relative mt-2">
        {rotatedCards}
      </div>
    </motion.div>
  );
}
