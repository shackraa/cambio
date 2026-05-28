export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'Joker';

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  value: number;       // puan değeri
  isRevealed: boolean; // yüzü açık mı?
  isPenalty: boolean;  // ceza kartı mı?
  isGhost?: boolean;   // takas sırasında slotu tutan hayalet kart
}

export interface Player {
  id: string;
  nickname: string;
  seat: number; // 0=bottom(sen), 1=left, 2=top, 3=right
  score: number;
  isOnline: boolean;
  isCurrentTurn: boolean;
  cards: Card[];
}

export type GamePhase =
  | 'waiting'
  | 'peek'
  | 'draw'
  | 'action'
  | 'stick_window'
  | 'power'
  | 'give_card'
  | 'cambio_round'
  | 'reveal'
  | 'results';

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  currentTurn: number;  // seat number
  drawnCard: Card | null;
  discardPile: Card[];
  cambioCaller: number | null;
  remainingTurns: number;
}
