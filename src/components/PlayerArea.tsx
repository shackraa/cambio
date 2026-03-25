import { motion } from 'framer-motion';
import type { Player } from '../types/game';
import { CardGrid } from './CardGrid';
import { useGameStore } from '../store/useGameStore';

interface PlayerAreaProps {
  player: Player;
  position: 'bottom' | 'top' | 'left' | 'right';
  isMe?: boolean;
  onCardClick?: (position: number) => void;
}

const POSITION_STYLES = {
  bottom: 'flex flex-col items-center',
  top:    'flex flex-col items-center',
  left:   'flex flex-col items-center',
  right:  'flex flex-col items-center',
};

export function PlayerArea({ player, position, isMe, onCardClick }: PlayerAreaProps) {
  const cardSize = isMe ? 'lg' : 'sm';
  const knownCards = useGameStore(s => s.knownCards);

  return (
    <motion.div
      className={`${POSITION_STYLES[position]} gap-2`}
      initial={{ opacity: 0, y: isMe ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* İsim rozeti */}
      <div
        className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${
          player.isCurrentTurn
            ? 'bg-[var(--gold)] text-black shadow-lg'
            : 'bg-black/30 text-white/80 border border-white/10'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
        {isMe ? '🎴 Sen' : player.nickname}
        {player.isCurrentTurn && <span className="ml-1 animate-pulse">⚡</span>}
      </div>

      {/* Kart sayısı rozeti (benim hariç) */}
      {!isMe && (
        <span className="text-white/30 text-[10px]">{player.cards.length} kart</span>
      )}

      {/* Kartlar */}
      <CardGrid
        cards={player.cards.map((card, idx) => {
          const known = knownCards.find(
            k => k.playerId === player.id && k.position === idx
          );
          const isActive = known && (!known.expiresAt || known.expiresAt > Date.now());
          
          if (isActive) {
            return {
              ...card,
              rank: known.card.rank,
              suit: known.card.suit,
              value: known.card.value,
              isRevealed: true,
            };
          }
          return card;
        })}
        size={cardSize}
        canInteract={isMe && player.isCurrentTurn && !!onCardClick}
        onCardClick={onCardClick}
      />
    </motion.div>
  );
}
