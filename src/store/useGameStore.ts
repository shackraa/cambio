import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Card, GamePhase, Player } from '../types/game';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  getPower,
  calculateHandScore,
  resolveWinner,
  type PowerType,
} from '../engine/gameEngine';

// ─── State tipleri ───────────────────────────────────────────
export interface KnownCard {
  playerId: string;
  position: number;
  card: Card;
  expiresAt?: number; // peek için geçici görme
}

interface GameStore {
  // ── Oyun durumu
  phase: GamePhase;
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentTurn: number;        // seat
  drawnCard: Card | null;
  drawnFrom: 'deck' | 'discard' | null;
  cambioCaller: number | null;
  remainingTurns: number;
  roomCode: string;

  // ── Güç kullanımı
  activePower: PowerType | null;
  peekTarget: { playerId: string; position: number } | null;

  // ── Hafıza (bilinen kartlar)
  knownCards: KnownCard[];

  // ── Sonuç
  finalScores: { seat: number; score: number; calledCambio: boolean }[];
  winner: number | null;

  // ── Peek phase
  peekPhaseEndTime: number | null;

  // ── Aksiyonlar
  initGame: (myNickname: string, opponents: string[]) => void;
  startPeekPhase: () => void;
  endPeekPhase: () => void;
  drawFromDeck: () => void;
  drawFromDiscard: () => void;
  swapCard: (position: number) => void;
  discardDrawn: () => void;
  usePower: (power: PowerType, targetSeat: number, targetPosition: number, swapWithPosition?: number) => void;
  skipPower: () => void;
  stickCard: (myPosition: number, discardCardId: string) => void;
  callCambio: () => void;
  endGame: () => void;
  addKnownCard: (known: KnownCard) => void;
}

// ─── Yardımcılar ─────────────────────────────────────────────
function nextTurn(current: number, players: Player[]): number {
  for (let i = 1; i <= 4; i++) {
    const seat = (current + i) % 4;
    if (players.find(p => p.seat === seat)?.isOnline) return seat;
  }
  return current;
}

function makePlayers(myNickname: string, opponents: string[]): Player[] {
  const nicks = [myNickname, ...opponents.slice(0, 3)];
  while (nicks.length < 4) nicks.push(`Oyuncu ${nicks.length + 1}`);
  return nicks.map((nickname, seat) => ({
    id: `player-${seat}`,
    nickname,
    seat,
    score: 0,
    isOnline: true,
    isCurrentTurn: seat === 0,
    cards: [],
  }));
}

// ─── Store ───────────────────────────────────────────────────
export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    phase: 'waiting',
    deck: [],
    discardPile: [],
    players: [],
    currentTurn: 0,
    drawnCard: null,
    drawnFrom: null,
    cambioCaller: null,
    remainingTurns: 0,
    roomCode: 'K4F2',
    activePower: null,
    peekTarget: null,
    knownCards: [],
    finalScores: [],
    winner: null,
    peekPhaseEndTime: null,

    // ── Oyunu başlat ────────────────────────────────────────
    initGame: (myNickname, opponents) => {
      const shuffled = shuffleDeck(createDeck());
      const { playerHands, remainingDeck } = dealCards(shuffled);
      const players = makePlayers(myNickname, opponents);
      players.forEach((p, i) => { p.cards = playerHands[i]; });

      set(state => {
        state.phase = 'peek';
        state.deck = remainingDeck;
        state.discardPile = [];
        state.players = players;
        state.currentTurn = 0;
        state.drawnCard = null;
        state.drawnFrom = null;
        state.cambioCaller = null;
        state.remainingTurns = 0;
        state.activePower = null;
        state.peekTarget = null;
        state.knownCards = [];
        state.finalScores = [];
        state.winner = null;
        state.peekPhaseEndTime = Date.now() + 5000;
      });
    },

    // ── Peek phase ──────────────────────────────────────────
    startPeekPhase: () => {
      set(state => { state.phase = 'peek'; state.peekPhaseEndTime = Date.now() + 5000; });
    },
    endPeekPhase: () => {
      set(state => {
        state.phase = 'draw';
        state.peekPhaseEndTime = null;
        // Peek'te görülen kartları hafızada sakla (seat 0 = sen: 2 ön kart)
        const me = state.players.find(p => p.seat === 0);
        if (me) {
          [0, 1].forEach(pos => {
            state.knownCards.push({
              playerId: me.id,
              position: pos,
              card: { ...me.cards[pos] },
            });
          });
        }
      });
    },

    // ── Kart çekme ──────────────────────────────────────────
    drawFromDeck: () => {
      const { deck, phase, currentTurn, players } = get();
      const me = players.find(p => p.seat === currentTurn);
      if (phase !== 'draw' || !me) return;
      if (deck.length === 0) return;

      set(state => {
        const card = state.deck.shift()!;
        state.drawnCard = { ...card, isRevealed: true };
        state.drawnFrom = 'deck';
        state.phase = 'action';
      });
    },

    drawFromDiscard: () => {
      const { discardPile, phase, currentTurn, players } = get();
      const me = players.find(p => p.seat === currentTurn);
      if (phase !== 'draw' || !me || discardPile.length === 0) return;

      set(state => {
        const card = state.discardPile.pop()!;
        state.drawnCard = { ...card, isRevealed: true };
        state.drawnFrom = 'discard';
        state.phase = 'action';
      });
    },

    // ── Takas: çekilen kartı bir pozisyonla değiştir ────────
    swapCard: (position) => {
      const { drawnCard, currentTurn, players, phase } = get();
      if ((phase !== 'action' && phase !== 'power') || !drawnCard) return;
      const playerIdx = players.findIndex(p => p.seat === currentTurn);
      if (playerIdx === -1) return;

      set(state => {
        const player = state.players[playerIdx];
        const oldCard = player.cards[position];
        // Eski kart çöpe gider
        state.discardPile.push({ ...oldCard, isRevealed: true });
        // Çekilen kart eli geçer
        player.cards[position] = { ...state.drawnCard!, isRevealed: false };
        state.drawnCard = null;
        state.drawnFrom = null;

        // Güç kontrolü — çöpe atılan kartın gücü var mı?
        const power = getPower(oldCard.rank, oldCard.suit);
        if (power) {
          state.activePower = power;
          state.phase = 'power';
        } else {
          state.phase = 'stick_window';
        }
      });
    },

    // ── Çekilen kartı direkt çöpe at ────────────────────────
    discardDrawn: () => {
      const { drawnCard, phase } = get();
      if (phase !== 'action' || !drawnCard) return;

      set(state => {
        const power = getPower(state.drawnCard!.rank, state.drawnCard!.suit);
        state.discardPile.push({ ...state.drawnCard!, isRevealed: true });
        state.drawnCard = null;
        state.drawnFrom = null;

        if (power) {
          state.activePower = power;
          state.phase = 'power';
        } else {
          state.phase = 'stick_window';
        }
      });
    },

    // ── Güç kullan ──────────────────────────────────────────
    usePower: (power, targetSeat, targetPosition, swapWithPosition) => {
      set(state => {
        const targetPlayer = state.players.find(p => p.seat === targetSeat);
        const myPlayer = state.players.find(p => p.seat === state.currentTurn);
        if (!targetPlayer || !myPlayer) return;

        switch (power) {
          case 'peek_own':
          case 'peek_other': {
            // Kartı geçici olarak görünür yap (sadece UI'da)
            state.knownCards.push({
              playerId: targetPlayer.id,
              position: targetPosition,
              card: { ...targetPlayer.cards[targetPosition] },
              expiresAt: Date.now() + 4000,
            });
            setTimeout(() => {
              useGameStore.setState(s => {
                s.knownCards = s.knownCards.filter(
                  k => !k.expiresAt || k.expiresAt > Date.now()
                );
              });
            }, 4000);
            break;
          }
          case 'blind_swap': {
            // Kör takas: hedef kart ile kendi kartı yer değiştirir
            const myPos = swapWithPosition ?? 0;
            const temp = myPlayer.cards[myPos];
            myPlayer.cards[myPos] = targetPlayer.cards[targetPosition];
            targetPlayer.cards[targetPosition] = temp;
            break;
          }
          case 'spy_swap': {
            // Gör + takas isteğe bağlı
            state.knownCards.push({
              playerId: targetPlayer.id,
              position: targetPosition,
              card: { ...targetPlayer.cards[targetPosition] },
              expiresAt: Date.now() + 4000,
            });
            if (swapWithPosition !== undefined) {
              const myPos = swapWithPosition;
              const temp = myPlayer.cards[myPos];
              myPlayer.cards[myPos] = targetPlayer.cards[targetPosition];
              targetPlayer.cards[targetPosition] = temp;
            }
            setTimeout(() => {
              useGameStore.setState(s => {
                s.knownCards = s.knownCards.filter(
                  k => !k.expiresAt || k.expiresAt > Date.now()
                );
              });
            }, 4000);
            break;
          }
        }

        state.activePower = null;
        state.phase = 'stick_window';
      });
    },

    // ── Gücü geç ────────────────────────────────────────────
    skipPower: () => {
      set(state => {
        state.activePower = null;
        state.phase = 'stick_window';
      });
    },

    // ── Yapıştırma (Stick) ──────────────────────────────────
    stickCard: (myPosition, discardCardId) => {
      const { discardPile, players } = get();
      const topDiscard = discardPile[discardPile.length - 1];
      if (!topDiscard || topDiscard.id !== discardCardId) return;

      const me = players.find(p => p.seat === 0)!;
      const myCard = me.cards[myPosition];

      set(state => {
        const myPlayerIdx = state.players.findIndex(p => p.seat === 0);
        if (myCard.value === topDiscard.value) {
          // Başarılı yapıştırma: kart elden çıkar
          state.players[myPlayerIdx].cards.splice(myPosition, 1);
          state.discardPile.push({ ...myCard, isRevealed: true });
        } else {
          // Yanlış yapıştırma: ceza kartı al
          const penalty = state.deck.shift();
          if (penalty) {
            state.players[myPlayerIdx].cards.push({ ...penalty, isPenalty: true, isRevealed: false });
          }
        }
      });
    },

    // ── Cambio çağır ────────────────────────────────────────
    callCambio: () => {
      const { phase, currentTurn } = get();
      if (phase !== 'draw') return;

      set(state => {
        state.cambioCaller = currentTurn;
        state.remainingTurns = 3; // diğer 3 oyuncu 1'er tur
        // Sırayı bir sonrakine geç
        state.currentTurn = nextTurn(currentTurn, state.players);
        state.players.forEach(p => { p.isCurrentTurn = p.seat === state.currentTurn; });
        state.phase = 'draw';
      });
    },

    // ── Oyunu bitir & sonuçları hesapla ─────────────────────
    endGame: () => {
      set(state => {
        // Tüm kartları aç
        state.players.forEach(player => {
          player.cards.forEach(card => { card.isRevealed = true; });
        });

        state.finalScores = state.players.map(p => ({
          seat: p.seat,
          score: calculateHandScore(p.cards),
          calledCambio: p.seat === state.cambioCaller,
        }));

        state.winner = resolveWinner(state.finalScores);
        state.phase = 'results';
      });
    },

    addKnownCard: (known) => {
      set(state => { state.knownCards.push(known); });
    },
  }))
);

// ─── Sıra geçiş yardımcısı (store dışı kullanım için) ───────
export function advanceTurn(store: ReturnType<typeof useGameStore.getState>): void {
  const { currentTurn, players, remainingTurns, cambioCaller } = store;

  if (cambioCaller !== null) {
    if (remainingTurns <= 1) {
      useGameStore.getState().endGame();
      return;
    }
    useGameStore.setState(s => {
      s.remainingTurns = remainingTurns - 1;
      s.currentTurn = nextTurn(currentTurn, players);
      s.players.forEach(p => { p.isCurrentTurn = p.seat === s.currentTurn; });
      s.phase = 'draw';
    });
  } else {
    useGameStore.setState(s => {
      s.currentTurn = nextTurn(currentTurn, players);
      s.players.forEach(p => { p.isCurrentTurn = p.seat === s.currentTurn; });
      s.phase = 'draw';
    });
  }
}
