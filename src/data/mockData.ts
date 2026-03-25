import type { Card, GameState, Player } from '../types/game';

const makeCard = (
  rank: Card['rank'],
  suit: Card['suit'],
  value: number,
  revealed = false
): Card => ({
  id: `${rank}-${suit}-${Math.random().toString(36).slice(2, 6)}`,
  rank,
  suit,
  value,
  isRevealed: revealed,
  isPenalty: false,
});

export const mockPlayers: Player[] = [
  {
    id: 'p0',
    nickname: 'Sen',
    seat: 0,
    score: 0,
    isOnline: true,
    isCurrentTurn: true,
    cards: [
      makeCard('A', 'hearts', 1, true),
      makeCard('7', 'clubs', 7, false),
      makeCard('Q', 'spades', 10, false),
      makeCard('K', 'diamonds', -1, true),
    ],
  },
  {
    id: 'p1',
    nickname: 'Ahmet',
    seat: 1,
    score: 0,
    isOnline: true,
    isCurrentTurn: false,
    cards: [
      makeCard('5', 'hearts', 5),
      makeCard('J', 'clubs', 10),
      makeCard('2', 'diamonds', 2),
      makeCard('9', 'spades', 9),
    ],
  },
  {
    id: 'p2',
    nickname: 'Zeynep',
    seat: 2,
    score: 0,
    isOnline: true,
    isCurrentTurn: false,
    cards: [
      makeCard('K', 'spades', 10),
      makeCard('3', 'hearts', 3),
      makeCard('Joker', 'joker', 0),
      makeCard('8', 'diamonds', 8),
    ],
  },
  {
    id: 'p3',
    nickname: 'Mert',
    seat: 3,
    score: 0,
    isOnline: true,
    isCurrentTurn: false,
    cards: [
      makeCard('4', 'clubs', 4),
      makeCard('10', 'hearts', 10),
      makeCard('6', 'spades', 6),
      makeCard('Q', 'diamonds', 10),
    ],
  },
];

export const mockGameState: GameState = {
  roomCode: 'K4F2',
  phase: 'draw',
  currentTurn: 0,
  drawnCard: null,
  discardPile: [makeCard('7', 'hearts', 7, true)],
  cambioCaller: null,
  remainingTurns: 0,
};
