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
import { useToastStore } from './useToastStore';
import { SoundManager } from '../utils/SoundManager';
import { recordGameResult } from '../utils/playerStats';

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
  detailEn?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  handScores: number[];
  totalScore: number;
}

// ─── State tipleri ───────────────────────────────────────────
export interface KnownCard {
  cardId?: string;
  playerId: string;
  position: number;
  card: Card;
  expiresAt?: number; // peek için geçici görme
}

export interface StickFeedback {
  id: string;
  success: boolean;
  playerName: string;
  selectedCard: { rank: string; suit: string };
  discardCard: { rank: string; suit: string };
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
  giveCardInitiator?: number;
  turnCount: number;          // toplam tur sayısı

  // ── Güç kullanımı
  activePower: PowerType | null;
  peekTarget: { playerId: string; position: number; cardId?: string } | null;
  swappingCards: { card1: Card; card2: Card } | null;
  lastSwappedPosition: { seat: number; pos: number } | null;
  lastSwappedPositions: { seat: number; pos: number }[]; // her iki takas slotunu da vurgulamak için

  // ── Hafıza (bilinen kartlar)
  knownCards: KnownCard[];
  peekState: 'dealing' | 'starting' | 'select' | 'highlight' | 'reveal' | null;
  peekSelectedPositions: { playerId: string; pos: number }[];

  // ── Hamle logu
  gameLog: GameLogEntry[];
  lastStickFeedback: StickFeedback | null;

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

function makePlayers(myNickname: string, opponents: string[], startSeat = 0): Player[] {
  const nicks = [myNickname, ...opponents.slice(0, 3)];
  while (nicks.length < 4) nicks.push(`Oyuncu ${nicks.length + 1}`);
  return nicks.map((nickname, seat) => ({
    id: `player-${seat}`,
    nickname,
    seat,
    score: 0,
    isOnline: true,
    isCurrentTurn: seat === startSeat,
    cards: [],
  }));
}

// ─── Deste biterse çöp destesini (en üstteki hariç) yeniden karıştır ───
function ensureDeckHasCards(state: GameStore) {
  if (state.deck.length === 0 && state.discardPile.length > 1) {
    const topDiscard = state.discardPile.pop()!;
    const recycled = shuffleDeck(
      state.discardPile.map(c => ({ ...c, isRevealed: false, isPenalty: false }))
    );
    state.deck = recycled;
    state.discardPile = [topDiscard];
    setTimeout(() => {
      useToastStore.getState().addToast('🔄 Deste bitti! Çöp destesi yeniden karıştırıldı.', 'info');
    }, 0);
  }
}

// ─── Log yardımcısı ──────────────────────────────────────────
let _logId = 0;
function mkLogId() { return `log-${++_logId}`; }

// ─── Tekil dağıtım zamanlayıcıları ───────────────────────────
let dealingTimers: ReturnType<typeof setTimeout>[] = [];
function clearDealingTimers() {
  dealingTimers.forEach(t => clearTimeout(t));
  dealingTimers = [];
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
    giveCardTarget: undefined,
    giveCardInitiator: undefined,
    turnCount: 0,
    activePower: null,
    peekTarget: null,
    swappingCards: null,
    lastSwappedPosition: null,
    lastSwappedPositions: [],
    knownCards: [],
    gameLog: [],
    lastStickFeedback: null,
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
        id: mkLogId(),
        timestamp: Date.now(),
      };
      state.gameLog.push(newLog);
      if (state.gameLog.length > 50) state.gameLog.shift();
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

    // ── Oyunu başlat (Fiziksel Tek Tek Kart Dağıtımıyla!) ──
    initGame: (myNickname, opponents) => {
      clearDealingTimers();
      const shuffled = shuffleDeck(createDeck());
      // RESMİ KURAL / ADALET: Her elde oyun her zaman aynı koltukta başlamaz, rastgele bir oyuncu başlar
      const startSeat = Math.floor(Math.random() * 4);
      const players = makePlayers(myNickname, opponents, startSeat);

      // Başlangıçta tüm 54 kart ortadaki kapalı destede durur!
      set(state => {
        state.phase = 'peek';
        state.deck = shuffled;
        state.discardPile = [];
        state.players = players;
        state.currentTurn = startSeat;
        state.drawnCard = null;
        state.drawnFrom = null;
        state.cambioCaller = null;
        state.remainingTurns = 0;
        state.giveCardTarget = undefined;
        state.giveCardInitiator = undefined;
        state.turnCount = 1;
        state.activePower = null;
        state.peekTarget = null;
        state.swappingCards = null;
        state.lastSwappedPosition = null;
        state.lastSwappedPositions = [];
        state.knownCards = [];
        state.gameLog = [];
        state.lastStickFeedback = null;
        state.finalScores = [];
        state.winner = null;
        state.peekPhaseEndTime = Date.now() + 3800; // 16 kartın dağıtım süresi
        state.peekState = 'dealing';
        state.peekSelectedPositions = [];
      });

      // 16 kartı sırayla (4 tur × 4 oyuncu) desteden çekip oyuncuların önüne fiziksel olarak uçur!
      for (let i = 0; i < 16; i++) {
        const seat = i % 4;
        const t = setTimeout(() => {
          useGameStore.setState(s => {
            if (s.phase !== 'peek') return;
            const card = s.deck.shift();
            const targetPlayer = s.players.find(p => p.seat === seat);
            if (card && targetPlayer && targetPlayer.cards.length < 4) {
              targetPlayer.cards.push({ ...card, isRevealed: false });
            }
          });
          SoundManager.playCardDraw();
        }, 260 + i * 200);
        dealingTimers.push(t);
      }
    },

    // ── Peek phase ──────────────────────────────────────────
    startPeekPhase: () => {
      set(state => { 
        state.phase = 'peek'; 
        state.peekPhaseEndTime = Date.now() + 3800; 
        state.peekState = 'dealing';
        state.peekSelectedPositions = [];
      });
    },
    transitionPeekState: (newState) => {
      set(state => {
        if (state.phase !== 'peek') return;
        if (state.peekState === 'dealing' && newState !== 'dealing') {
          state.players.forEach(p => {
            while (p.cards.length < 4 && state.deck.length > 0) {
              const c = state.deck.shift()!;
              p.cards.push({ ...c, isRevealed: false });
            }
          });
        }
        state.peekState = newState;
        
        if (newState === 'starting') {
          state.peekPhaseEndTime = Date.now() + 2500;
        } else if (newState === 'select') {
          state.peekPhaseEndTime = Date.now() + 15000;
        } else if (newState === 'highlight') {
          state.peekPhaseEndTime = Date.now() + 2500;
        } else if (newState === 'reveal') {
          state.peekPhaseEndTime = Date.now() + 4500;
          SoundManager.playCardFlip();
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
      const { phase, currentTurn, players } = get();
      const me = players.find(p => p.seat === currentTurn);
      if (phase !== 'draw' || !me) return;

      set(state => {
        ensureDeckHasCards(state);
        if (state.deck.length === 0) return;

        const card = state.deck.shift()!;
        state.drawnCard = { ...card, isRevealed: false };
        state.drawnFrom = 'deck';
        state.phase = 'action';
        state.gameLog.push({
          id: mkLogId(),
          timestamp: Date.now(),
          playerName: me.nickname,
          action: 'draw_deck',
          detail: 'Desteden kart çekti',
          detailEn: 'Drew a card from the deck',
        });
        if (state.gameLog.length > 50) state.gameLog.shift();
      });
      SoundManager.playCardDraw();
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
        state.gameLog.push({
          id: mkLogId(),
          timestamp: Date.now(),
          playerName: me.nickname,
          action: 'draw_discard',
          detail: 'Çöpten kart çekti',
          detailEn: 'Took the top card from discard',
        });
        if (state.gameLog.length > 50) state.gameLog.shift();
      });
      SoundManager.playCardDraw();
    },

    // ── Takas: 3 Aşamalı Doğal El Koreografisi ──
    // 1) Seçilen kart parlar (650ms)
    // 2) Eldeki eski kart yumuşakça çöpe süzülür (750ms)
    // 3) Çekilen yeni kart boşalan slota yumuşakça yerleşir!
    swapCard: (position, initiatorSeat) => {
      const { drawnCard, currentTurn, players, phase, lastSwappedPositions } = get();
      if ((phase !== 'action' && phase !== 'power') || !drawnCard) return;
      if (lastSwappedPositions.length > 0) return; // Zaten takas animasyonu çalışıyorsa tekrar tetikleme
      const activeSeat = initiatorSeat !== undefined ? initiatorSeat : currentTurn;
      const playerIdx = players.findIndex(p => p.seat === activeSeat);
      if (playerIdx === -1) return;

      // 1. AŞAMA: Hangi kartın seçildiğini gözün takip edebilmesi için önce o kartı vurgula
      SoundManager.playCardFlip();
      set(state => {
        state.lastSwappedPosition = { seat: activeSeat, pos: position };
        state.lastSwappedPositions = [{ seat: activeSeat, pos: position }];
      });

      // 2. AŞAMA (650ms sonra): Önce eldeki eski kart çöpe doğru süzülür (slotta ghost yer tutucu kalır)
      setTimeout(() => {
        const currentSnap = useGameStore.getState();
        const pSnap = currentSnap.players[playerIdx];
        if (!pSnap || !currentSnap.drawnCard) return;
        const oldCard = pSnap.cards[position];
        if (!oldCard || oldCard.isGhost) return;

        useGameStore.setState(state => {
          const player = state.players[playerIdx];
          if (!player || !state.drawnCard) return;
          const cardToDiscard = player.cards[position];
          if (!cardToDiscard) return;

          // Eski kartı açık olarak çöpe gönder (layoutId sayesinde elden çöpe uçar)
          state.discardPile.push({ ...cardToDiscard, isRevealed: true, isPenalty: false });

          // Slotta diğer kartların kaymaması için görünmez yer tutucu bırak
          player.cards[position] = {
            id: `ghost-swap-${activeSeat}-${position}`,
            suit: 'spades',
            rank: 'A',
            value: 1,
            isRevealed: false,
            isPenalty: false,
            isGhost: true,
          };
        });
        SoundManager.playCardDrop();

        // 3. AŞAMA (750ms sonra): Eski kart çöpe konarken, çekilen yeni kart boşalan slota süzülür!
        setTimeout(() => {
          useGameStore.setState(state => {
            const player = state.players[playerIdx];
            if (!player || !state.drawnCard) return;

            player.cards[position] = { ...state.drawnCard, isRevealed: false, isPenalty: false };
            state.drawnCard = null;
            state.drawnFrom = null;

            state.knownCards = state.knownCards.filter(
              k => !(k.playerId === player.id && k.position === position)
            );

            state.gameLog.push({
              id: mkLogId(),
              timestamp: Date.now(),
              playerName: player.nickname,
              action: 'swap',
              detail: `çektiği kartla ${position + 1}. kartını değiştirdi`,
              detailEn: `swapped drawn card with slot #${position + 1}`,
            });
            if (state.gameLog.length > 50) state.gameLog.shift();

            state.phase = 'stick_window';
          });
          SoundManager.playCardDraw();

          setTimeout(() => {
            useGameStore.setState(s => {
              s.lastSwappedPosition = null;
              s.lastSwappedPositions = [];
            });
          }, 1250);
        }, 750);
      }, 650);
    },

    // ── Çekilen kartı direkt çöpe at ────────────────────────
    discardDrawn: (initiatorSeat) => {
      const { drawnCard, drawnFrom, phase, currentTurn, players } = get();
      if (phase !== 'action' || !drawnCard) return;
      if (drawnFrom === 'discard') return;

      const activeSeat = initiatorSeat !== undefined ? initiatorSeat : currentTurn;
      const me = players.find(p => p.seat === activeSeat);

      set(state => {
        const card = state.drawnCard!;
        const power = state.drawnFrom === 'deck' ? getPower(card.rank, card.suit) : null;
        state.discardPile.push({ ...card, isRevealed: true, isPenalty: false });
        state.gameLog.push({
          id: mkLogId(),
          timestamp: Date.now(),
          playerName: me?.nickname ?? '?',
          action: 'discard',
          detail: `çektiği kartı (${card.rank}) çöpe attı`,
          detailEn: `discarded drawn card (${card.rank})`,
        });
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
      SoundManager.playCardDrop();
    },

    // ── Güç kullan (Bakmalarda daha uzun süre, takaslarda önce 850ms ışık + sonra fiziksel uçuş!) ──
    usePower: (power, targetSeat, targetPosition, swapWithPosition, isLocalUser = true, initiatorSeat) => {
      const stateSnapshot = get();
      const activeSeat = initiatorSeat !== undefined ? initiatorSeat : stateSnapshot.currentTurn;
      const targetPlayerSnap = stateSnapshot.players.find(p => p.seat === targetSeat);
      const myPlayerSnap = stateSnapshot.players.find(p => p.seat === activeSeat);
      if (!targetPlayerSnap || !myPlayerSnap) return;
      if (!targetPlayerSnap.cards[targetPosition]) return;

      // RESMİ KURAL: Cambio diyen oyuncunun kartları kilitlenir — başka oyuncular onunla takas yapamaz
      if (
        (power === 'blind_swap' || power === 'spy_swap') &&
        stateSnapshot.cambioCaller !== null &&
        targetSeat === stateSnapshot.cambioCaller &&
        targetSeat !== activeSeat
      ) {
        return;
      }

      // ── 1) KENDİ KARTINA VEYA RAKİP KARTINA BAKMA (7-8 / 9-10) ──
      if (power === 'peek_own' || power === 'peek_other') {
        SoundManager.playCardFlip();
        set(state => {
          const targetPlayer = state.players.find(p => p.seat === targetSeat);
          const myPlayer = state.players.find(p => p.seat === activeSeat);
          if (!targetPlayer || !myPlayer) return;
          const targetCard = targetPlayer.cards[targetPosition];
          if (!targetCard) return;

          if (isLocalUser) {
            state.knownCards.push({
              cardId: targetCard.id,
              playerId: targetPlayer.id,
              position: targetPosition,
              card: { ...targetCard },
              expiresAt: Date.now() + 4800,
            });
          }
          state.peekTarget = { playerId: targetPlayer.id, position: targetPosition, cardId: targetCard.id };
          state.lastSwappedPositions = [{ seat: targetSeat, pos: targetPosition }];

          state.gameLog.push({
            id: mkLogId(),
            timestamp: Date.now(),
            playerName: myPlayer.nickname,
            action: power === 'peek_own' ? 'power_peek_own' : 'power_peek_other',
            detail: power === 'peek_own'
              ? `kendi ${targetPosition + 1}. kartını inceledi`
              : `${targetPlayer.nickname} adlı oyuncunun ${targetPosition + 1}. kartını inceledi`,
            detailEn: power === 'peek_own'
              ? `peeked at own card #${targetPosition + 1}`
              : `peeked at ${targetPlayer.nickname}'s card #${targetPosition + 1}`,
          });
          if (state.gameLog.length > 50) state.gameLog.shift();
          state.activePower = null;
          state.phase = 'stick_window';
        });

        setTimeout(() => {
          useGameStore.setState(s => {
            s.peekTarget = null;
            s.lastSwappedPositions = [];
            s.knownCards = s.knownCards.filter(k => !k.expiresAt || k.expiresAt > Date.now());
          });
        }, 4800);
        return;
      }

      // ── 2) CASUS TAKASI (SİYAH K) — 1. AŞAMA: Sadece Rakip Kartını İncele ──
      if (power === 'spy_swap' && swapWithPosition === undefined) {
        SoundManager.playCardFlip();
        set(state => {
          const targetPlayer = state.players.find(p => p.seat === targetSeat);
          if (!targetPlayer) return;
          const targetCard = targetPlayer.cards[targetPosition];
          if (!targetCard) return;
          if (isLocalUser) {
            state.knownCards.push({
              cardId: targetCard.id,
              playerId: targetPlayer.id,
              position: targetPosition,
              card: { ...targetCard },
              expiresAt: Date.now() + 8000,
            });
          }
          state.peekTarget = { playerId: targetPlayer.id, position: targetPosition, cardId: targetCard.id };
          state.lastSwappedPositions = [{ seat: targetSeat, pos: targetPosition }];
        });
        return;
      }

      // ── 3) KÖR TAKAS (J-Q) veya CASUS TAKASI 2. AŞAMA (SİYAH K) ──
      // ÖNCE seçilen iki kartın da etrafında altın ışık halkası yanar (850ms), göz hangi kartların seçildiğini görür!
      // SONRA iki kart masanın üzerinden süzülerek birbirinin yerine uçar!
      const myPos = swapWithPosition ?? 0;
      if (!myPlayerSnap.cards[myPos]) return;

      SoundManager.playCardFlip();
      set(state => {
        state.lastSwappedPosition = { seat: activeSeat, pos: myPos };
        state.lastSwappedPositions = [
          { seat: activeSeat, pos: myPos },
          { seat: targetSeat, pos: targetPosition },
        ];
        state.swappingCards = {
          card1: { ...myPlayerSnap.cards[myPos] },
          card2: { ...targetPlayerSnap.cards[targetPosition] },
        };
      });

      setTimeout(() => {
        useGameStore.setState(state => {
          const targetPlayer = state.players.find(p => p.seat === targetSeat);
          const myPlayer = state.players.find(p => p.seat === activeSeat);
          if (!targetPlayer || !myPlayer) return;
          if (!myPlayer.cards[myPos] || !targetPlayer.cards[targetPosition]) return;

          const temp = { ...myPlayer.cards[myPos] };
          const targetTemp = { ...targetPlayer.cards[targetPosition] };

          myPlayer.cards[myPos] = { ...targetTemp, isRevealed: false, isPenalty: false };
          targetPlayer.cards[targetPosition] = { ...temp, isRevealed: false, isPenalty: false };

          state.peekTarget = null;
          state.knownCards = state.knownCards.filter(
            k => !(k.playerId === targetPlayer.id && k.position === targetPosition)
          );

          state.gameLog.push({
            id: mkLogId(),
            timestamp: Date.now(),
            playerName: myPlayer.nickname,
            action: power === 'blind_swap' ? 'power_blind_swap' : 'power_spy_swap',
            detail: power === 'blind_swap'
              ? `${myPos + 1}. kartını ${targetPlayer.nickname} oyuncusunun ${targetPosition + 1}. kartıyla takasladı`
              : `${targetPlayer.nickname} ile casus takası yaptı`,
            detailEn: power === 'blind_swap'
              ? `blind swapped card #${myPos + 1} with ${targetPlayer.nickname}'s card #${targetPosition + 1}`
              : `completed spy swap with ${targetPlayer.nickname}`,
          });
          if (state.gameLog.length > 50) state.gameLog.shift();
          state.activePower = null;
          state.phase = 'stick_window';
        });
        SoundManager.playCardDrop();

        setTimeout(() => {
          useGameStore.setState(s => {
            s.lastSwappedPosition = null;
            s.lastSwappedPositions = [];
            s.swappingCards = null;
          });
        }, 1350);
      }, 850);
    },

    // ── Gücü geç ────────────────────────────────────────────
    skipPower: (initiatorSeat) => {
      const { currentTurn, players } = get();
      const activeSeat = initiatorSeat !== undefined ? initiatorSeat : currentTurn;
      const me = players.find(p => p.seat === activeSeat);
      set(state => {
        state.gameLog.push({
          id: mkLogId(),
          timestamp: Date.now(),
          playerName: me?.nickname ?? '?',
          action: 'power_skip',
          detail: 'Takas yapmadan geçti',
          detailEn: 'Skipped power without swapping',
        });
        if (state.gameLog.length > 50) state.gameLog.shift();
        state.activePower = null;
        state.peekTarget = null;
        state.lastSwappedPositions = [];
        state.knownCards = [];
        state.phase = 'stick_window';
      });
    },

    // ── Yapıştırma (Stick) — Önce Kartı Olduğu Yerde Aç, Sonra Çöpe Uçur! ──
    stickCard: (targetSeat, targetPosition, discardCardId, initiatorSeat) => {
      const { discardPile, players, cambioCaller } = get();
      const topDiscard = discardPile[discardPile.length - 1];
      if (!topDiscard || topDiscard.id !== discardCardId) return;

      // RESMİ KURAL: Cambio diyen oyuncunun kartları kilitlidir — başkası onun kartına yapıştırma yapamaz
      if (cambioCaller !== null && targetSeat === cambioCaller && initiatorSeat !== targetSeat) return;

      const initiator = players.find(p => p.seat === initiatorSeat);
      const targetPlayer = players.find(p => p.seat === targetSeat);
      if (!initiator || !targetPlayer) return;
      const targetCard = targetPlayer.cards[targetPosition];
      if (!targetCard) return;

      const feedbackId = `stick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (targetCard.rank === topDiscard.rank) {
        SoundManager.playStick();
        set(state => {
          const tIdx = state.players.findIndex(p => p.seat === targetSeat);
          if (tIdx !== -1 && state.players[tIdx].cards[targetPosition]) {
            state.players[tIdx].cards[targetPosition].isRevealed = true;
            state.lastSwappedPositions = [{ seat: targetSeat, pos: targetPosition }];
          }
          state.lastStickFeedback = {
            id: feedbackId,
            success: true,
            playerName: initiator.nickname,
            selectedCard: { rank: targetCard.rank, suit: targetCard.suit },
            discardCard: { rank: topDiscard.rank, suit: topDiscard.suit },
          };
        });

        setTimeout(() => {
          useGameStore.setState(s => {
            if (s.lastStickFeedback?.id === feedbackId) {
              s.lastStickFeedback = null;
            }
          });
        }, 2800);

        setTimeout(() => {
          useGameStore.setState(state => {
            const initiatorIdx = state.players.findIndex(p => p.seat === initiatorSeat);
            const targetIdx = state.players.findIndex(p => p.seat === targetSeat);
            if (targetIdx === -1) return;

            const cardIdx = state.players[targetIdx].cards.findIndex(c => c.id === targetCard.id);
            if (cardIdx === -1) return;

            const [removedCard] = state.players[targetIdx].cards.splice(cardIdx, 1);
            state.discardPile.push({ ...removedCard, isRevealed: true, isPenalty: false });
            state.lastSwappedPositions = [];
            SoundManager.playCardDrop();

            // GLITCH FIX: Ortaya yapıştırılan kartın peek ve knownCards kayıtlarını temizle,
            // ve kalan kartların pozisyon indekslerini güncelle (komşu kartın yanlışlıkla açılmasını önle)!
            if (state.peekTarget && state.peekTarget.playerId === targetPlayer.id) {
              if (state.peekTarget.cardId === removedCard.id || state.peekTarget.position === cardIdx) {
                state.peekTarget = null;
              } else if (state.peekTarget.position > cardIdx) {
                state.peekTarget.position -= 1;
              }
            }

            state.knownCards = state.knownCards
              .filter(k => k.card.id !== removedCard.id && !(k.playerId === targetPlayer.id && k.position === cardIdx))
              .map(k => {
                if (k.playerId === targetPlayer.id && k.position > cardIdx) {
                  return { ...k, position: k.position - 1 };
                }
                return k;
              });

            if (initiatorSeat === targetSeat) {
              state.gameLog.push({
                id: mkLogId(),
                timestamp: Date.now(),
                playerName: initiator.nickname,
                action: 'stick_ok',
                detail: `kendi kartını (${removedCard.rank}) açıp ortaya yapıştırdı!`,
                detailEn: `revealed and stuck own card (${removedCard.rank})!`,
              });
            } else {
              state.gameLog.push({
                id: mkLogId(),
                timestamp: Date.now(),
                playerName: initiator.nickname,
                action: 'stick_opponent_ok',
                detail: `${targetPlayer.nickname} adlı oyuncunun kartını (${removedCard.rank}) yapıştırdı!`,
                detailEn: `stuck ${targetPlayer.nickname}'s card (${removedCard.rank})!`,
              });
              if (initiatorIdx !== -1 && state.players[initiatorIdx].cards.length > 0) {
                state.phase = 'give_card';
                state.giveCardTarget = targetSeat;
                state.giveCardInitiator = initiatorSeat;
              }
            }
            if (state.gameLog.length > 50) state.gameLog.shift();
          });
        }, 850);
      } else {
        SoundManager.playError();
        set(state => {
          const tIdx = state.players.findIndex(p => p.seat === targetSeat);
          if (tIdx !== -1 && state.players[tIdx].cards[targetPosition]) {
            state.players[tIdx].cards[targetPosition].isRevealed = true;
          }
          state.lastStickFeedback = {
            id: feedbackId,
            success: false,
            playerName: initiator.nickname,
            selectedCard: { rank: targetCard.rank, suit: targetCard.suit },
            discardCard: { rank: topDiscard.rank, suit: topDiscard.suit },
          };
          ensureDeckHasCards(state);
          const initiatorIdx = state.players.findIndex(p => p.seat === initiatorSeat);
          const penalty = state.deck.shift();
          if (penalty && initiatorIdx !== -1) {
            const penaltyCard = { ...penalty, isPenalty: true, isRevealed: false };
            state.players[initiatorIdx].cards.push(penaltyCard);
          }
          state.gameLog.push({
            id: mkLogId(),
            timestamp: Date.now(),
            playerName: initiator.nickname,
            action: 'stick_fail',
            detail: `yanlış yapıştırma yaptı (${targetCard.rank} ≠ ${topDiscard.rank}), +1 ceza kartı aldı`,
            detailEn: `wrong stick (${targetCard.rank} ≠ ${topDiscard.rank}), received +1 penalty card`,
          });
          if (state.gameLog.length > 50) state.gameLog.shift();
        });

        setTimeout(() => {
          useGameStore.setState(s => {
            if (s.lastStickFeedback?.id === feedbackId) {
              s.lastStickFeedback = null;
            }
          });
        }, 2900);

        setTimeout(() => {
          useGameStore.setState(s => {
            const tIdx = s.players.findIndex(p => p.seat === targetSeat);
            if (tIdx !== -1) {
              const c = s.players[tIdx].cards.find(x => x.id === targetCard.id);
              if (c && s.phase !== 'results') c.isRevealed = false;
            }
          });
        }, 1200);
      }
    },

    // ── Kart Verme (Give Card) ──────────────────────────────
    giveCardToOpponent: (myPosition, initiatorSeat) => {
      const { phase, giveCardTarget, players, cambioCaller } = get();
      if (phase !== 'give_card' || giveCardTarget === undefined) return;

      // RESMİ KURAL: Cambio diyen oyuncunun eli kilitlidir, ceza kartı ona verilemez
      if (cambioCaller !== null && giveCardTarget === cambioCaller) return;

      const initiator = players.find(p => p.seat === initiatorSeat);
      if (!initiator) return;

      // Önce seçilen kartı parlat (600ms), sonra rakibe uçur!
      SoundManager.playCardFlip();
      set(state => {
        state.lastSwappedPositions = [{ seat: initiatorSeat, pos: myPosition }];
      });

      setTimeout(() => {
        useGameStore.setState(state => {
          const initiatorIdx = state.players.findIndex(p => p.seat === initiatorSeat);
          const targetIdx = state.players.findIndex(p => p.seat === giveCardTarget);
          if (initiatorIdx === -1 || targetIdx === -1) return;
          if (!state.players[initiatorIdx].cards[myPosition]) return;

          const cardToGive = state.players[initiatorIdx].cards.splice(myPosition, 1)[0];
          state.players[targetIdx].cards.push({ ...cardToGive, isRevealed: false });

          // GLITCH FIX: Verilen kartın peek ve knownCards kayıtlarını temizle
          if (state.peekTarget && state.peekTarget.playerId === initiator.id) {
            if (state.peekTarget.cardId === cardToGive.id || state.peekTarget.position === myPosition) {
              state.peekTarget = null;
            } else if (state.peekTarget.position > myPosition) {
              state.peekTarget.position -= 1;
            }
          }

          state.knownCards = state.knownCards
            .filter(k => k.card.id !== cardToGive.id && !(k.playerId === initiator.id && k.position === myPosition))
            .map(k => {
              if (k.playerId === initiator.id && k.position > myPosition) {
                return { ...k, position: k.position - 1 };
              }
              return k;
            });

          const targetPlayerName = state.players[targetIdx].nickname;
          state.lastSwappedPositions = [{ seat: giveCardTarget!, pos: state.players[targetIdx].cards.length - 1 }];
          state.gameLog.push({
            id: mkLogId(),
            timestamp: Date.now(),
            playerName: initiator.nickname,
            action: 'swap',
            detail: `kendi kartını ${targetPlayerName} adlı oyuncunun önüne verdi`,
            detailEn: `gave a card to ${targetPlayerName}`,
          });
          if (state.gameLog.length > 50) state.gameLog.shift();

          state.phase = 'stick_window';
          state.giveCardTarget = undefined;
          state.giveCardInitiator = undefined;
        });
        SoundManager.playCardDrop();

        setTimeout(() => {
          useGameStore.setState(s => { s.lastSwappedPositions = []; });
        }, 1200);
      }, 600);
    },

    // ── Cambio çağır ────────────────────────────────────────
    callCambio: () => {
      const { phase, currentTurn, players, cambioCaller } = get();
      if (phase !== 'draw' || cambioCaller !== null) return;
      const me = players.find(p => p.seat === currentTurn);

      set(state => {
        state.cambioCaller = currentTurn;
        const activePlayersCount = state.players.filter(p => p.isOnline).length;
        state.remainingTurns = Math.max(1, activePlayersCount - 1);
        state.currentTurn = nextTurn(currentTurn, state.players);
        state.players.forEach(p => { p.isCurrentTurn = p.seat === state.currentTurn; });
        state.phase = 'draw';
        state.gameLog.push({
          id: mkLogId(),
          timestamp: Date.now(),
          playerName: me?.nickname ?? '?',
          action: 'cambio',
          detail: '🎯 CAMBIO çağırdı!',
          detailEn: '🎯 Called CAMBIO!',
        });
        if (state.gameLog.length > 50) state.gameLog.shift();
      });
      SoundManager.playCambio();
    },

    // ── Oyunu bitir & sonuçları hesapla ─────────────────────
    endGame: () => {
      set(state => {
        state.players.forEach(player => {
          player.cards.forEach(card => { card.isRevealed = true; });
        });

        const baseScores = state.players.map(p => ({
          seat: p.seat,
          score: calculateHandScore(p.cards),
          calledCambio: p.seat === state.cambioCaller,
        }));

        const minScore = Math.min(...baseScores.map(s => s.score));
        
        state.finalScores = baseScores.map(p => {
          let finalScore = p.score;
          let cambioModifier = 0;
          if (p.calledCambio) {
            const isTrulyLowest = p.score === minScore && baseScores.filter(s => s.score === minScore).length === 1;
            
            if (isTrulyLowest) {
              finalScore = finalScore - 10;
              cambioModifier = -10;
            } else {
              finalScore = finalScore + 10;
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

        const mySeat = parseInt(sessionStorage.getItem('seat') ?? '0', 10);
        const myFinal = state.finalScores.find(fs => fs.seat === mySeat);
        if (myFinal) {
          recordGameResult(myFinal.score, state.winner === mySeat);
        }

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
    const nextSeat = nextTurn(currentTurn, players);
    if (nextSeat === cambioCaller) {
      useGameStore.getState().endGame();
      return;
    }
    useGameStore.setState(s => {
      s.remainingTurns = remainingTurns - 1;
      s.currentTurn = nextSeat;
      s.players.forEach(p => { p.isCurrentTurn = p.seat === s.currentTurn; });
      s.phase = 'draw';
      s.turnCount = (s.turnCount ?? 0) + 1;
    });
  } else {
    useGameStore.setState(s => {
      s.currentTurn = nextTurn(currentTurn, players);
      s.players.forEach(p => { p.isCurrentTurn = p.seat === s.currentTurn; });
      s.phase = 'draw';
      s.turnCount = (s.turnCount ?? 0) + 1;
    });
  }
}
