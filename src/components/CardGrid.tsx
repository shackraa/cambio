import type { Card } from '../types/game';
import { GameCard } from './GameCard';

interface CardGridProps {
  cards: Card[];
  size?: 'sm' | 'md' | 'lg';
  canInteract?: boolean;
  onCardClick?: (position: number) => void;
  highlightPositions?: number[];
}

export function CardGrid({
  cards,
  size = 'md',
  canInteract,
  onCardClick,
  highlightPositions = [],
}: CardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card, i) => (
        <GameCard
          key={card.id}
          card={card}
          size={size}
          canInteract={canInteract}
          onClick={() => onCardClick?.(i)}
          highlight={highlightPositions.includes(i)}
        />
      ))}
    </div>
  );
}
