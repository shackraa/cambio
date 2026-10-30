import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import type { Player, Card } from '../types/game';
import { CardGrid } from './CardGrid';
import { GameCard } from './GameCard';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';
import { formatPlayerName } from '../utils/formatPlayerName';

// ─── Çekilen kartı önce kapalı (veya çöptense açık) uçurup getir, sonra çevir ───
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
  cardSize: 'xs' | 'sm' | 'md' | 'lg';
  drawnFrom: 'deck' | 'discard' | null;
  onDiscardDrawn?: () => void;
  t: any;
}) {
  // Desteden çekilmişse: önce masadan eline kapalı uçar, 550ms sonra çevrilir
  // Çöpten çekilmişse: çöpte zaten açıktı, eline de açık olarak uçar
  const [isFlipped, setIsFlipped] = useState(drawnFrom === 'discard');

  useEffect(() => {
    setIsFlipped(drawnFrom === 'discard');
    if (drawnFrom === 'deck' && isMe) {
      const timer = setTimeout(() => setIsFlipped(true), 550);
      return () => clearTimeout(timer);
    }
  }, [drawnCard.id, drawnFrom, isMe]);

  const displayCard = isMe
    ? { ...drawnCard, isRevealed: isFlipped }
    : { ...drawnCard, isRevealed: drawnFrom === 'discard' };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      {/* GameCard kendi layoutId={drawnCard.id} değeriyle doğrudan desteden/çöpten buraya uçar! */}
      <div className="relative z-30">
        <GameCard card={displayCard} size={cardSize} />
      </div>

      {isMe && (
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              className="flex flex-col gap-1 sm:gap-1.5 bg-[#092b1e]/95 border border-[var(--gold)]/45 rounded-2xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-lg z-30"
              initial={{ opacity: 0, x: -12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.92 }}
              transition={{ duration: 0.25 }}
            >
              {drawnFrom === 'deck' && onDiscardDrawn ? (
                <>
                  <p className="text-emerald-100/80 text-[9px] sm:text-[10px] font-semibold">
                    {t.drawnAction_addOrDiscard}
                  </p>
                  <motion.button
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[var(--gold)]/20 hover:bg-[var(--gold)]/35
                               border border-[var(--gold)]/55 rounded-xl text-[var(--gold)]
                               text-[11px] sm:text-xs font-bold cursor-pointer"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDiscardDrawn}
                  >
                    {t.drawnAction_discard}
                  </motion.button>
                  <span className="text-emerald-200/50 text-[8px] sm:text-[9px] text-center">
                    {t.drawnAction_orClickBottom}
                  </span>
                </>
              ) : (
                <p className="text-emerald-300 text-[9px] sm:text-[10px] font-bold max-w-[120px] text-center">
                  {t.drawnAction_orClickBottom}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

interface PlayerAreaProps {
  player: Player;
  position: 'bottom' | 'top' | 'left' | 'right';
  isMe?: boolean;
  compact?: boolean;
  ultraCompact?: boolean;
  canInteract?: boolean;
  onCardClick?: (position: number) => void;
  highlightPositions?: number[];
  swapHighlightPositions?: number[]; // takas edilen slotlar
  drawnCard?: Card | null;
  onDiscardDrawn?: () => void;
}

export const PlayerArea = memo(function PlayerArea({
  player,
  position,
  isMe,
  compact = false,
  ultraCompact = false,
  canInteract = true,
  onCardClick,
  highlightPositions = [],
  swapHighlightPositions = [],
  drawnCard,
  onDiscardDrawn,
}: PlayerAreaProps) {
  const cardSize: 'xs' | 'sm' | 'md' | 'lg' = ultraCompact
    ? 'xs'
    : compact
      ? isMe
        ? 'sm'
        : 'xs'
      : 'lg';

  const knownCards = useGameStore((s) => s.knownCards);
  const phase = useGameStore((s) => s.phase);
  const peekState = useGameStore((s) => s.peekState);
  const peekTarget = useGameStore((s) => s.peekTarget);
  const drawnFrom = useGameStore((s) => s.drawnFrom);
  const cambioCaller = useGameStore((s) => s.cambioCaller);
  const isCambioCaller = cambioCaller === player.seat;
  const finalScoreObj = useGameStore((s) =>
    phase === 'results'
      ? s.finalScores.find((fs) => fs.seat === player.seat)
      : undefined
  );
  const isVertical = position === 'left' || position === 'right';

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const peekSelectedPositions = useGameStore((s) => s.peekSelectedPositions);

  const mergedHighlightPositions = [...highlightPositions];

  // Peek fazında seçilen kartlar activePeekPositions üzerinden yumuşak aurayla gösterilir
  const activePeekPositions: number[] = [];
  if (phase === 'peek') {
    const selections = peekSelectedPositions.filter(
      (p) => p.playerId === player.id
    );
    selections.forEach((s) => {
      activePeekPositions.push(s.pos);
    });
  }
  if (peekTarget && peekTarget.playerId === player.id) {
    activePeekPositions.push(peekTarget.position);
  }

  const processedCards = player.cards.map((card, idx) => {
    if (card.isRevealed) {
      return card;
    }

    const known = knownCards.find(
      (k) => k.playerId === player.id && k.position === idx
    );
    const isActive =
      known && (!known.expiresAt || known.expiresAt > Date.now());
    if (isActive) {
      return {
        ...card,
        rank: known.card.rank,
        suit: known.card.suit,
        value: known.card.value,
        isRevealed: true,
      };
    }

    // PEEK - REVEAL FAZI İÇİN (Sadece kendi kartlarını kendin gör)
    if (phase === 'peek' && peekState === 'reveal' && isMe) {
      if (activePeekPositions.includes(idx)) {
        return { ...card, isRevealed: true };
      }
    }

    // GÜVENLİK KALKANI: Diğer durumlarda kapalı
    if (phase !== 'peek' && phase !== 'results') {
      return { ...card, isRevealed: false };
    }

    return card;
  });

  return (
    <div
      className={`flex items-center relative flex-col ${
        ultraCompact ? 'gap-0.5' : 'gap-1 sm:gap-1.5'
      }`}
    >
      {/* İsim rozeti, Cambio Çağrısı Pulu ve Final Puanı — z-10 */}
      <div className="flex gap-1.5 sm:gap-2 items-center relative z-10">
        <div
          className={`${
            ultraCompact
              ? 'px-2 py-0.5 text-[10px] min-w-[60px]'
              : 'px-2.5 sm:px-4 py-0.5 sm:py-1.5 text-xs sm:text-sm min-w-[72px] sm:min-w-[105px]'
          } whitespace-nowrap justify-center rounded-full font-bold flex items-center gap-1.5 transition-colors duration-200 ${
            player.isCurrentTurn
              ? 'bg-[#f4d78c] text-[#261a05] shadow-[0_4px_14px_rgba(244,215,140,0.4)] border border-[#fff8e6]'
              : 'bg-[#123327]/90 text-[#f5ebd6]/95 border border-[#e8c468]/25'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              player.isOnline ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />
          <span>{formatPlayerName(player.nickname, lang)}</span>
          {!isMe && (
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                player.isCurrentTurn
                  ? 'bg-black/15 text-[#261a05]'
                  : 'bg-white/10 text-emerald-100/80'
              }`}
            >
              {player.cards.length}
            </span>
          )}
        </div>

        {/* Bu oyuncu CAMBIO dediyse isminin hemen yanında çağrı pulu görünür */}
        <AnimatePresence>
          {isCambioCaller && phase !== 'results' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] sm:text-[11px] font-extrabold tracking-wider uppercase border border-amber-200/70"
            >
              <span>CAMBIO!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'results' && finalScoreObj !== undefined && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-50"
          >
            <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[var(--gold)] text-black font-black text-xs sm:text-sm border border-yellow-300">
              {finalScoreObj.score} pt
            </div>
            {finalScoreObj.calledCambio && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/95 border border-emerald-400/30 shadow-lg">
                {finalScoreObj.cambioModifier === -10 ? (
                  <span className="text-emerald-300">{t.cambioSuccess}</span>
                ) : (
                  <span className="text-red-300">{t.cambioFail}</span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Çekilen Kart (Eğer sıra bu oyuncudaysa ve kart çekildiyse) */}
      {player.isCurrentTurn && phase === 'action' && drawnCard && (
        <div
          className={`absolute flex items-center gap-2 sm:gap-3 z-50 ${
            isVertical
              ? position === 'left'
                ? 'left-full ml-2 sm:ml-5'
                : 'right-full mr-2 sm:mr-5'
              : position === 'top'
                ? 'top-full mt-1.5 sm:mt-3 left-1/2 -translate-x-1/2'
                : 'bottom-full mb-1.5 sm:mb-3 left-1/2 -translate-x-1/2'
          }`}
        >
          <DrawnCardDisplay
            drawnCard={drawnCard}
            isMe={isMe}
            cardSize={cardSize}
            drawnFrom={drawnFrom}
            onDiscardDrawn={onDiscardDrawn}
            t={t}
          />
        </div>
      )}

      <div className={`relative ${ultraCompact ? 'mt-0.5' : 'mt-1 sm:mt-1.5'}`}>
        <CardGrid
          cards={processedCards}
          size={cardSize}
          direction={isVertical ? 'vertical' : 'horizontal'}
          canInteract={canInteract && !!onCardClick}
          onCardClick={onCardClick}
          highlightPositions={mergedHighlightPositions}
          swapHighlightPositions={swapHighlightPositions}
          peekPositions={activePeekPositions}
          isDealing={phase === 'peek' && peekState === 'dealing'}
          isHighlighting={
            phase === 'peek' &&
            (peekState === 'select' || peekState === 'highlight')
          }
          playerPosition={position}
        />
      </div>
    </div>
  );
});
