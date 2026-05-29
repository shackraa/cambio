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

// ─── Hamle logu ──────────────────────────────────────────────
export type LogAction =
  | 'draw_deck' | 'draw_discard'
  | 'swap' | 'discard'
  | 'power_peek_own' | 'power_peek_other' | 'power_blind_swap' | 'power_spy_swap' | 'power_skip'
  | 'cambio' | 'stick_ok' | 'stick_fail' | 'stick_opponent_ok';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  playerName: string;
  action: LogAction;
  detail?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  handScores: number[];
  totalScore: number;
}

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
  giveCardTarget?: number;

  // ── Güç kullanımı
  activePower: PowerType | null;
  peekTarget: { playerId: string; position: number } | null;
  swappingCards: { card1: Card; card2: Card } | null;

  // ── Hafıza (bilinen kartlar)
  knownCards: KnownCard[];
  peekState: 'dealing' | 'starting' | 'select' | 'highlight' | 'reveal' | null;
  peekSelectedPositions: { playerId: string; pos: number }[];

  // ── Hamle logu
  gameLog: GameLogEntry[];

  // ── Sonuç
  finalScores: { seat: number; score: number; calledCambio: boolean; baseScore?: number; cambioModifier?: number }[];
  winner: number | null;
  leaderboard: LeaderboardEntry[];

  // ── Chat
  chatMessages: { id: string; senderId: string; senderName: string; text: string; timestamp: number }[];

  // ── Peek phase
  peekPhaseEndTime: number | null;
  transitionPeekState: (newState: 'dealing' | 'starting' | 'select' | 'highlight' | 'reveal' | null) => void;

  // ── Aksiyonlar
  initGame: (myNickname: string, opponents: string[]) => void;
  startPeekPhase: () => void;
  endPeekPhase: () => void;
  drawFromDeck: () => void;
  drawFromDiscard: () => void;
  swapCard: (position: number, initiatorSeat?: number) => void;
  discardDrawn: (initiatorSeat?: number) => void;
  usePower: (power: PowerType, targetSeat: number, targetPosition: number, swapWithPosition?: number, isLocalUser?: boolean, initiatorSeat?: number) => void;
  skipPower: (initiatorSeat?: number) => void;
  stickCard: (targetSeat: number, targetPosition: number, discardCardId: string, initiatorSeat: number) => void;
  giveCardToOpponent: (myPosition: number, initiatorSeat: number) => void;
  callCambio: () => void;
  endGame: () => void;
  addKnownCard: (known: KnownCard) => void;
  pushLog: (entry: Omit<GameLogEntry, 'id' | 'timestamp'>) => void;
  addChatMessage: (msg: { senderId: string; senderName: string; text: string }) => void;
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

// ─── Log yardımcısı ──────────────────────────────────────────
let _logId = 0;
function mkLogId() { return `log-${++_logId}`; }

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
    swappingCards: null,
    knownCards: [],
    gameLog: [],
    finalScores: [],
    winner: null,
    leaderboard: [],

    chatMessages: [],

    peekPhaseEndTime: null,
    peekState: null,
    peekSelectedPositions: [],

    pushLog: (entry) => set(state => {
      const newLog = {
        ...entry,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      };
      state.gameLog.unshift(newLog);
      if (state.gameLog.length > 50) state.gameLog.pop();
    }),

    addChatMessage: (msg) => set(state => {
      const newMsg = {
        ...msg,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      };
      state.chatMessages.push(newMsg);
      if (state.chatMessages.length > 100) state.chatMessages.shift();
    }),

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
        state.gameLog = [];
        state.finalScores = [];
        state.winner = null;
        state.winner = null;
        state.peekPhaseEndTime = Date.now() + 4000; // 4s dealing
        state.peekState = 'dealing';
        state.peekSelectedPositions = [];
      });
    },

    // ── Peek phase ──────────────────────────────────────────
    startPeekPhase: () => {
      set(state => { 
        state.phase = 'peek'; 
        state.peekPhaseEndTime = Date.now() + 4000; 
        state.peekState = 'dealing';
        state.peekSelectedPositions = [];
      });
    },
    transitionPeekState: (newState) => {
      set(state => {
        if (state.phase !== 'peek') return;
        state.peekState = newState;
        
        if (newState === 'starting') {
          state.peekPhaseEndTime = Date.now() + 5000;
        } else if (newState === 'select') {
          // Select phase waits indefinitely (or until everyone picks), so no fixed timer.
          state.peekPhaseEndTime = Date.now() + 15000; // 15s fallback
        } else if (newState === 'highlight') {
          state.peekPhaseEndTime = Date.now() + 5000;
        } else if (newState === 'reveal') {
          state.peekPhaseEndTime = Date.now() + 5000;
        }
      });
    },
    endPeekPhase: () => {
      set(state => {
        state.phase = 'draw';
        state.peekPhaseEndTime = null;
        state.peekState = null;
        state.peekSelectedPositions = [];
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
        state.drawnCard = { ...card, isRevealed: false }; // Sadece çeken kişi görecek
        state.drawnFrom = 'deck';
        state.phase = 'action';
        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: me.nickname, action: 'draw_deck', detail: 'Desteden kart çekti' });
        if (state.gameLog.length > 50) state.gameLog.shift();
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
        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: me.nickname, action: 'draw_discard', detail: 'Çöpten kart çekti' });
        if (state.gameLog.length > 50) state.gameLog.shift();
      });
    },

    // ── Takas: çekilen kartı bir pozisyonla değiştir ────────
    swapCard: (position, initiatorSeat) => {
      const { drawnCard, currentTurn, players, phase } = get();
      if ((phase !== 'action' && phase !== 'power') || !drawnCard) return;
      const activeSeat = initiatorSeat !== undefined ? initiatorSeat : currentTurn;
      const playerIdx = players.findIndex(p => p.seat === activeSeat);
      if (playerIdx === -1) return;

      set(state => {
        const player = state.players[playerIdx];
        const oldCard = player.cards[position];
        state.discardPile.push({ ...oldCard, isRevealed: true });
        player.cards[position] = { ...state.drawnCard!, isRevealed: false };
        state.drawnCard = null;
        state.drawnFrom = null;

        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: player.nickname, action: 'swap', detail: `ortadan çektiği kartla bir kartını değiştirdi` });
        if (state.gameLog.length > 50) state.gameLog.shift();

        state.phase = 'stick_window';
      });
    },

    // ── Çekilen kartı direkt çöpe at ────────────────────────
    discardDrawn: (initiatorSeat) => {
      const { drawnCard, phase, currentTurn, players } = get();
      if (phase !== 'action' || !drawnCard) return;
      const activeSeat = initiatorSeat !== undefined ? initiatorSeat : currentTurn;
      const me = players.find(p => p.seat === activeSeat);

      set(state => {
        const card = state.drawnCard!;
        const power = getPower(card.rank, card.suit);
        state.discardPile.push({ ...card, isRevealed: true });
        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: me?.nickname ?? '?', action: 'discard', detail: `ortadan çektiği kartı çöpe attı` });
        if (state.gameLog.length > 50) state.gameLog.shift();
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
    usePower: (power, targetSeat, targetPosition, swapWithPosition, isLocalUser = true, initiatorSeat) => {
      set(state => {
        const targetPlayer = state.players.find(p => p.seat === targetSeat);
        const activeSeat = initiatorSeat !== undefined ? initiatorSeat : state.currentTurn;
        const myPlayer = state.players.find(p => p.seat === activeSeat);
        if (!targetPlayer || !myPlayer) return;

        const powerLabels: Record<string, LogAction> = {
          peek_own: 'power_peek_own', peek_other: 'power_peek_other',
          blind_swap: 'power_blind_swap', spy_swap: 'power_spy_swap'
        };
        const powerNames: Record<string, string> = {
          peek_own: 'kendi kartına baktı', peek_other: `${targetPlayer.nickname} adlı oyuncunun kartına baktı`,
          blind_swap: `${targetPlayer.nickname} ile kör takas yaptı`, spy_swap: `${targetPlayer.nickname} adlı oyuncunun kartını gördü`
        };

        switch (power) {
          case 'peek_own':
          case 'peek_other': {
            if (isLocalUser) {
              state.knownCards.push({
                playerId: targetPlayer.id,
                position: targetPosition,
                card: { ...targetPlayer.cards[targetPosition] },
                expiresAt: Date.now() + 4000,
              });
            }
            state.peekTarget = { playerId: targetPlayer.id, position: targetPosition };

            setTimeout(() => {
              useGameStore.setState(s => {
                s.peekTarget = null;
                s.knownCards = s.knownCards.filter(k => !k.expiresAt || k.expiresAt > Date.now());
              });
            }, 4000);
            break;
          }
          case 'blind_swap': {
            const myPos = swapWithPosition ?? 0;
            const temp = { ...myPlayer.cards[myPos] };
            const targetTemp = { ...targetPlayer.cards[targetPosition] };
            // Doğrudan swap — LayoutGroup animasyonu halleder
            myPlayer.cards[myPos] = { ...targetTemp, isRevealed: false };
            targetPlayer.cards[targetPosition] = { ...temp, isRevealed: false };
            break;
          }
          case 'spy_swap': {
            if (isLocalUser) {
              state.knownCards.push({
                playerId: targetPlayer.id,
                position: targetPosition,
                card: { ...targetPlayer.cards[targetPosition] },
                expiresAt: Date.now() + 4000,
              });
            }
            state.peekTarget = { playerId: targetPlayer.id, position: targetPosition };

            if (swapWithPosition !== undefined) {
              const myPos = swapWithPosition;
              const temp = { ...myPlayer.cards[myPos] };
              const targetTemp = { ...targetPlayer.cards[targetPosition] };
              // Doğrudan swap — LayoutGroup animasyonu halleder
              myPlayer.cards[myPos] = { ...targetTemp, isRevealed: false };
              targetPlayer.cards[targetPosition] = { ...temp, isRevealed: false };
            }
            setTimeout(() => {
              useGameStore.setState(s => {
                s.peekTarget = null;
                s.knownCards = s.knownCards.filter(k => !k.expiresAt || k.expiresAt > Date.now());
              });
            }, 4000);
            break;
          }
        }

        // Eğer spy_swap ise ve henüz takas seçimi yapılmamışsa (sadece bakma aşaması), turu bitirme!
        if (power === 'spy_swap' && swapWithPosition === undefined) {
          return;
        }

        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: myPlayer.nickname, action: powerLabels[power] ?? 'swap', detail: powerNames[power] });
        if (state.gameLog.length > 50) state.gameLog.shift();
        state.activePower = null;
        state.phase = 'stick_window';
      });
    },

    // ── Gücü geç ────────────────────────────────────────────
    skipPower: (initiatorSeat) => {
      const { currentTurn, players } = get();
      const activeSeat = initiatorSeat !== undefined ? initiatorSeat : currentTurn;
      const me = players.find(p => p.seat === activeSeat);
      set(state => {
        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: me?.nickname ?? '?', action: 'power_skip', detail: 'Gücü geçti' });
        if (state.gameLog.length > 50) state.gameLog.shift();
        state.activePower = null;
        state.phase = 'stick_window';
      });
    },

    // ── Yapıştırma (Stick) ──────────────────────────────────
    stickCard: (targetSeat, targetPosition, discardCardId, initiatorSeat) => {
      const { discardPile, players } = get();
      const topDiscard = discardPile[discardPile.length - 1];
      if (!topDiscard || topDiscard.id !== discardCardId) return;

      const initiator = players.find(p => p.seat === initiatorSeat);
      const targetPlayer = players.find(p => p.seat === targetSeat);
      if (!initiator || !targetPlayer) return;
      const targetCard = targetPlayer.cards[targetPosition];

      set(state => {
        const initiatorIdx = state.players.findIndex(p => p.seat === initiatorSeat);
        const targetIdx = state.players.findIndex(p => p.seat === targetSeat);

        if (targetCard.rank === topDiscard.rank) {
          // Başarılı yapıştırma
          state.players[targetIdx].cards.splice(targetPosition, 1);
          state.discardPile.push({ ...targetCard, isRevealed: true });

          if (initiatorSeat === targetSeat) {
            // Kendi kartını yapıştırdı, tur devam (stick_window veya sonraki evre)
            state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: initiator.nickname, action: 'stick_ok', detail: `kendi kartını başarıyla yapıştırdı` });
          } else {
            // Başkasının kartını yapıştırdı, give_card aşamasına geç
            state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: initiator.nickname, action: 'stick_opponent_ok', detail: `${targetPlayer.nickname} adlı oyuncunun kartını başarıyla yapıştırdı` });
            state.phase = 'give_card';
            state.giveCardTarget = targetSeat;
          }
        } else {
          // Yanlış yapıştırma: Tıklayan kişi (initiator) ceza alır
          const penalty = state.deck.shift();
          if (penalty) {
            state.players[initiatorIdx].cards.push({ ...penalty, isPenalty: true, isRevealed: false });
          }
          state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: initiator.nickname, action: 'stick_fail', detail: `yanlış yapıştırma yaptı, ceza kartı aldı` });
        }
        if (state.gameLog.length > 50) state.gameLog.shift();
      });
    },

    // ── Kart Verme (Give Card) ──────────────────────────────
    giveCardToOpponent: (myPosition, initiatorSeat) => {
      const { phase, giveCardTarget, players } = get();
      if (phase !== 'give_card' || giveCardTarget === undefined) return;

      const initiator = players.find(p => p.seat === initiatorSeat);
      if (!initiator) return;

      set(state => {
        const initiatorIdx = state.players.findIndex(p => p.seat === initiatorSeat);
        const targetIdx = state.players.findIndex(p => p.seat === giveCardTarget);

        const cardToGive = state.players[initiatorIdx].cards.splice(myPosition, 1)[0];
        state.players[targetIdx].cards.push(cardToGive);

        const targetPlayerName = state.players[targetIdx].nickname;
        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: initiator.nickname, action: 'swap', detail: `kendi kartını ${targetPlayerName} adlı oyuncuya verdi` });
        if (state.gameLog.length > 50) state.gameLog.shift();

        state.phase = 'stick_window';
        state.giveCardTarget = undefined;
      });
    },

    // ── Cambio çağır ────────────────────────────────────────
    callCambio: () => {
      const { phase, currentTurn, players } = get();
      if (phase !== 'draw') return;
      const me = players.find(p => p.seat === currentTurn);

      set(state => {
        state.cambioCaller = currentTurn;
        const activePlayersCount = state.players.filter(p => p.isOnline).length;
        state.remainingTurns = Math.max(1, activePlayersCount - 1);
        state.currentTurn = nextTurn(currentTurn, state.players);
        state.players.forEach(p => { p.isCurrentTurn = p.seat === state.currentTurn; });
        state.phase = 'draw';
        state.gameLog.push({ id: mkLogId(), timestamp: Date.now(), playerName: me?.nickname ?? '?', action: 'cambio', detail: '🎯 CAMBIO çağırdı!' });
        if (state.gameLog.length > 50) state.gameLog.shift();
      });
    },

    // ── Oyunu bitir & sonuçları hesapla ─────────────────────
    endGame: () => {
      set(state => {
        // Tüm kartları aç
        state.players.forEach(player => {
          player.cards.forEach(card => { card.isRevealed = true; });
        });

        const baseScores = state.players.map(p => ({
          seat: p.seat,
          score: calculateHandScore(p.cards),
          calledCambio: p.seat === state.cambioCaller,
        }));

        // Cambio diyen kişinin gerçekten en düşük puana sahip olup olmadığını bulalım
        let minScore = Math.min(...baseScores.map(s => s.score));
        
        state.finalScores = baseScores.map(p => {
          let finalScore = p.score;
          let cambioModifier = 0;
          if (p.calledCambio) {
            const isTrulyLowest = p.score === minScore && baseScores.filter(s => s.score === minScore).length === 1;
            
            if (isTrulyLowest) {
              finalScore = finalScore - 10; // Ödül (Puanı düşürülür)
              cambioModifier = -10;
            } else {
              finalScore = finalScore + 10; // Ceza (Artı 10 puan eklenir)
              cambioModifier = 10;
            }
          }
          return {
            ...p,
            baseScore: p.score,
            cambioModifier,
            score: finalScore
          };
        });

        state.winner = resolveWinner(state.finalScores);

        // Liderlik tablosunu güncelle
        state.finalScores.forEach(fs => {
          const p = state.players.find(x => x.seat === fs.seat);
          if (!p) return;
          const lb = state.leaderboard.find(x => x.playerId === p.id);
          if (lb) {
            lb.handScores.push(fs.score);
            lb.totalScore += fs.score;
          } else {
            state.leaderboard.push({
              playerId: p.id,
              nickname: p.nickname,
              handScores: [fs.score],
              totalScore: fs.score,
            });
          }
        });

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
