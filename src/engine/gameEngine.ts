import type { Card, Suit, Rank } from '../types/game';

// ─── Kart değerleri ───────────────────────────────────────────
export function getCardValue(rank: Rank, suit: Suit): number {
  if (rank === 'Joker') return 0;
  if (rank === 'K' && (suit === 'hearts' || suit === 'diamonds')) return -1;
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

// ─── Özel kart gücü türü ──────────────────────────────────────
export type PowerType =
  | 'peek_own'      // 7,8: kendi kartına bak
  | 'peek_other'    // 9,10: rakip kartına bak
  | 'blind_swap'    // J,Q: kör takas (bakmadan)
  | 'spy_swap';     // Siyah K: gör + takas

export function getPower(rank: Rank, suit: Suit): PowerType | null {
  if (rank === '7' || rank === '8') return 'peek_own';
  if (rank === '9' || rank === '10') return 'peek_other';
  if (rank === 'J' || rank === 'Q') return 'blind_swap';
  if (rank === 'K' && (suit === 'clubs' || suit === 'spades')) return 'spy_swap';
  return null;
}

// ─── 54 kartlık deste oluştur ─────────────────────────────────
export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck: Card[] = [];

  let id = 0;
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `card-${id++}`,
        rank,
        suit,
        value: getCardValue(rank, suit),
        isRevealed: false,
        isPenalty: false,
      });
    }
  }

  // 2 Joker
  deck.push({ id: `card-${id++}`, rank: 'Joker', suit: 'joker', value: 0, isRevealed: false, isPenalty: false });
  deck.push({ id: `card-${id++}`, rank: 'Joker', suit: 'joker', value: 0, isRevealed: false, isPenalty: false });

  return deck;
}

// ─── Fisher-Yates karıştırma ──────────────────────────────────
export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ─── 4 oyuncuya 4'er kart dağıt ──────────────────────────────
export interface DealResult {
  playerHands: Card[][];  // [seat0, seat1, seat2, seat3]
  remainingDeck: Card[];
}

export function dealCards(deck: Card[]): DealResult {
  const playerHands: Card[][] = [[], [], [], []];
  const remaining = [...deck];

  // 4 tur × 4 oyuncu: sırayla dağıt
  for (let round = 0; round < 4; round++) {
    for (let seat = 0; seat < 4; seat++) {
      const card = remaining.shift()!;
      playerHands[seat].push({ ...card, id: `${card.id}-p${seat}-${round}` });
    }
  }

  return { playerHands, remainingDeck: remaining };
}

// ─── Puan hesapla ─────────────────────────────────────────────
export function calculateScore(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + (c.isRevealed || true ? c.value : 0), 0);
  // Not: gerçek oyunda sayım açılınca yapılacak
}

export function calculateHandScore(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + c.value, 0);
}

// ─── Beraberlik çözümü ────────────────────────────────────────
// En düşük final skora sahip olan kazanır.
// Eşitlik durumunda Cambio demeyen önceliklidir (gerçek Cambio kuralı).
export function resolveWinner(
  scores: { seat: number; score: number; calledCambio: boolean }[]
): number {
  if (scores.length === 0) return 0;
  const minScore = Math.min(...scores.map(s => s.score));
  const lowest = scores.filter(s => s.score === minScore);
  if (lowest.length === 1) return lowest[0].seat;

  // Beraberlikte Cambio demeyen kazanır
  const nonCambio = lowest.filter(s => !s.calledCambio);
  if (nonCambio.length > 0) return nonCambio[0].seat;
  return lowest[0].seat;
}
