import { useEffect, useCallback } from 'react';
import { useToastStore } from '../store/useToastStore';
import { useGameStore } from '../store/useGameStore';
import { createDeck, shuffleDeck, dealCards } from '../engine/gameEngine';
import { SoundManager } from '../utils/SoundManager';
import { p2pRoomManager } from '../lib/p2pRoomEngine';

// ─── Broadcast event tipleri ─────────────────────────────────
export type GameEvent =
  | { type: 'DRAW_FROM_DECK' }
  | { type: 'DRAW_FROM_DISCARD' }
  | { type: 'SWAP_CARD'; position: number }
  | { type: 'DISCARD_DRAWN' }
  | { type: 'USE_POWER'; power: string; targetSeat: number; targetPos: number; swapWith?: number }
  | { type: 'SKIP_POWER' }
  | { type: 'STICK_CARD'; targetSeat: number; position: number; discardCardId: string; initiatorSeat: number }
  | { type: 'GIVE_CARD'; position: number; initiatorSeat: number }
  | { type: 'CALL_CAMBIO'; seat: number }
  | { type: 'END_GAME' }
  | { type: 'GAME_STARTED'; gameStateId: string }
  | { type: 'PEEK_STATE_CHANGE'; state: 'dealing' | 'starting' | 'select' | 'highlight' | 'reveal' }
  | { type: 'PEEK_CARD_SELECT'; seat: number; pos: number }
  | { type: 'PEEK_PHASE_END' }
  | { type: 'CHAT_MESSAGE'; text: string; senderId: string; senderName: string };

interface UseRealtimeGameOptions {
  roomCode: string;
  roomId: string;
  myPlayerId: string;
  mySeat: number;
  isHost: boolean;
}

export function useRealtimeGame({
  roomCode,
  roomId,
  myPlayerId,
  mySeat,
  isHost,
}: UseRealtimeGameOptions) {
  const store = useGameStore;

  // ── Oyun state'ini P2P Oda Hafızasından yükle ──────────────────────────
  const loadGameState = useCallback(async () => {
    if (!roomCode || roomCode === 'local') return;

    const room = p2pRoomManager.getStoredRoom(roomCode);
    if (room?.initialGameState) {
      const gs = room.initialGameState;

      // Eğer oyun yeni başlıyorsa (dealing fazındaysa), 16 kartı destenin en üstüne koyup
      // tek tek fiziksel olarak masadaki oyunculara uçur!
      if (gs.phase === 'peek' && (gs.peekState === 'dealing' || !gs.peekState)) {
        const dealtRoundRobin: any[] = [];
        for (let r = 0; r < 4; r++) {
          for (let s = 0; s < 4; s++) {
            const p = gs.players.find((pl: any) => pl.seat === s);
            if (p?.cards?.[r]) {
              dealtRoundRobin.push({ ...p.cards[r], isRevealed: false });
            }
          }
        }

        const emptyPlayers = gs.players.map((p: any) => ({
          ...p,
          cards: [],
        }));

        useGameStore.setState({
          players: emptyPlayers,
          phase: gs.phase,
          currentTurn: gs.currentTurn,
          discardPile: gs.discardPile ?? [],
          deck: [...dealtRoundRobin, ...(gs.deck ?? [])],
          drawnCard: null,
          cambioCaller: null,
          remainingTurns: 0,
          roomCode,
          knownCards: [],
          peekPhaseEndTime: Date.now() + 3800,
          peekState: 'dealing',
          peekSelectedPositions: [],
          winner: null,
          finalScores: [],
          turnCount: 1,
        });

        for (let i = 0; i < dealtRoundRobin.length; i++) {
          const seat = i % 4;
          setTimeout(() => {
            useGameStore.setState((s) => {
              if (s.phase !== 'peek' || s.peekState !== 'dealing') return;
              const card = s.deck.shift();
              const targetPlayer = s.players.find((pl) => pl.seat === seat);
              if (card && targetPlayer && targetPlayer.cards.length < 4) {
                targetPlayer.cards.push({ ...card, isRevealed: false });
              }
            });
            SoundManager.playCardDraw();
          }, 260 + i * 200);
        }
      } else {
        useGameStore.setState({
          players: gs.players,
          phase: gs.phase,
          currentTurn: gs.currentTurn,
          discardPile: gs.discardPile ?? [],
          deck: gs.deck ?? [],
          drawnCard: gs.drawnCard ?? null,
          cambioCaller: gs.cambioCaller ?? null,
          remainingTurns: gs.remainingTurns ?? 0,
          roomCode,
          knownCards: [],
          peekPhaseEndTime: gs.phase === 'peek' ? Date.now() + 3200 : null,
          peekState: gs.peekState ?? 'dealing',
          peekSelectedPositions: gs.peekSelectedPositions ?? [],
          winner: gs.winner ?? null,
          finalScores: gs.finalScores ?? [],
          turnCount: gs.turnCount ?? 0,
        });
      }
    } else if (isHost && room) {
      // Eğer henüz initialGameState yoksa Host olarak hemen oluştur
      await initGameInDB();
    }
  }, [roomCode, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Host: 4 Koltuklu Oyunu Oluştur ve P2P Odaya Dağıt ─────────────────
  const initGameInDB = useCallback(async () => {
    if (!roomCode || roomCode === 'local') return null;

    const room = p2pRoomManager.getStoredRoom(roomCode);
    const defaultBots = [
      { seat: 0, name: sessionStorage.getItem('nickname') || 'You', id: myPlayerId || 'player-0' },
      { seat: 1, name: 'Ahmet', id: 'bot-1' },
      { seat: 2, name: 'Zeliha', id: 'bot-2' },
      { seat: 3, name: 'Mehmet', id: 'bot-3' },
    ];

    const seatPlayers = [0, 1, 2, 3].map((seatIdx) => {
      const found = room?.players.find((p) => p.seat === seatIdx);
      if (found) {
        return {
          id: found.id,
          nickname: found.nickname,
          seat: seatIdx,
          isOnline: found.is_online,
        };
      }
      const fallback = defaultBots[seatIdx];
      return {
        id: fallback.id,
        nickname: fallback.name,
        seat: seatIdx,
        isOnline: true,
      };
    });

    const shuffled = shuffleDeck(createDeck());
    const { playerHands, remainingDeck } = dealCards(shuffled);

    const players = seatPlayers.map((p, idx) => ({
      id: p.id,
      nickname: p.nickname,
      seat: p.seat,
      score: 0,
      isOnline: p.isOnline,
      isCurrentTurn: p.seat === 0,
      cards: playerHands[idx] ?? [],
    }));

    const initialGameState = {
      players,
      deck: remainingDeck,
      discardPile: [],
      currentTurn: 0,
      phase: 'peek' as const,
      drawnCard: null,
      cambioCaller: null,
      remainingTurns: 0,
      roomCode,
      peekState: 'dealing' as const,
      peekPhaseEndTime: Date.now() + 2600,
      peekSelectedPositions: [],
      winner: null,
      finalScores: [],
      turnCount: 0,
    };

    useGameStore.setState({
      ...initialGameState,
      knownCards: [],
      gameLog: [],
    });

    p2pRoomManager.startRoomGame(roomCode, initialGameState);
    return initialGameState;
  }, [roomCode, myPlayerId]);

  // ── Aksiyon gönder ───────────────────────────────────────
  const sendAction = useCallback(
    (event: GameEvent, overrideSeat?: number) => {
      if (!roomCode || roomCode === 'local') return;
      p2pRoomManager.sendGameAction(roomCode, event, overrideSeat ?? mySeat);
    },
    [roomCode, mySeat]
  );

  // ── P2P game_state güncelle ───────────────────────────────
  const syncGameState = useCallback(async () => {
    if (!roomCode || roomCode === 'local') return;
    const state = useGameStore.getState();
    p2pRoomManager.syncFullGameState(roomCode, {
      players: state.players,
      phase: state.phase,
      currentTurn: state.currentTurn,
      discardPile: state.discardPile,
      drawnCard: state.drawnCard,
      cambioCaller: state.cambioCaller,
      remainingTurns: state.remainingTurns,
      deck: state.deck,
      peekState: state.peekState,
      peekSelectedPositions: state.peekSelectedPositions,
      winner: state.winner,
      finalScores: state.finalScores,
      turnCount: state.turnCount,
    });
  }, [roomCode]);

  // ── Aksiyon handler ─────────────────────────────────────
  const handleRemoteAction = useCallback(
    (event: GameEvent & { fromSeat?: number }) => {
      const s = useGameStore.getState();

      switch (event.type) {
        case 'GAME_STARTED':
          useToastStore.getState().addToast('Oyun Başladı! Kartlarına bak', 'success');
          loadGameState();
          break;
        case 'DRAW_FROM_DECK':
          if (event.fromSeat === s.currentTurn) {
            s.drawFromDeck();
            SoundManager.playCardDraw();
          }
          break;
        case 'DRAW_FROM_DISCARD':
          if (event.fromSeat === s.currentTurn) {
            s.drawFromDiscard();
            SoundManager.playCardDraw();
          }
          break;
        case 'SWAP_CARD':
          if (event.fromSeat === s.currentTurn) {
            s.swapCard(event.position, event.fromSeat);
            SoundManager.playCardDrop();
          }
          break;
        case 'DISCARD_DRAWN':
          if (event.fromSeat === s.currentTurn) {
            s.discardDrawn(event.fromSeat);
            SoundManager.playCardDrop();
          }
          break;
        case 'USE_POWER': {
          const isLocalUser = event.fromSeat === mySeat;
          s.usePower(
            event.power as Parameters<typeof s.usePower>[0],
            event.targetSeat,
            event.targetPos,
            event.swapWith,
            isLocalUser,
            event.fromSeat
          );
          break;
        }
        case 'SKIP_POWER':
          s.skipPower(event.fromSeat);
          break;
        case 'STICK_CARD': {
          const targetSeat =
            event.targetSeat !== undefined ? event.targetSeat : event.fromSeat!;
          s.stickCard(targetSeat, event.position, event.discardCardId, event.fromSeat!);
          SoundManager.playCardDrop();
          break;
        }
        case 'GIVE_CARD':
          s.giveCardToOpponent(event.position, event.fromSeat!);
          SoundManager.playCardDrop();
          break;
        case 'CALL_CAMBIO':
          s.callCambio();
          SoundManager.playCambio();
          useToastStore.getState().addToast('🎯 Bir oyuncu CAMBIO dedi!', 'warning');
          break;
        case 'PEEK_STATE_CHANGE':
          store.getState().transitionPeekState((event as any).state);
          break;
        case 'PEEK_PHASE_END':
          store.getState().endPeekPhase();
          break;
        case 'CHAT_MESSAGE':
          store.getState().addChatMessage({
            senderId: (event as any).senderId,
            senderName: (event as any).senderName,
            text: (event as any).text,
          });
          break;
        case 'PEEK_CARD_SELECT': {
          const ev = event as any;
          const player = store.getState().players.find((p) => p.seat === ev.seat);
          if (player) {
            const mySelections = store
              .getState()
              .peekSelectedPositions.filter((p) => p.playerId === player.id);
            if (mySelections.length < 2 && !mySelections.find((s) => s.pos === ev.pos)) {
              store.setState((st) => {
                st.peekSelectedPositions.push({ playerId: player.id, pos: ev.pos });
              });
            }
          }
          break;
        }
        case 'END_GAME':
          s.endGame();
          break;
      }
    },
    [loadGameState, mySeat, store]
  );

  // ── P2P & BroadcastChannel Dinleyicisi ──
  useEffect(() => {
    if (!roomCode || !roomId || roomCode === 'local') return;

    p2pRoomManager.connectToRoomChannel(roomCode, isHost);

    const unsubAction = p2pRoomManager.onGameAction((ev) => {
      handleRemoteAction(ev);
    });

    const unsubFull = p2pRoomManager.onFullGameState((gs) => {
      if (!gs) return;
      useGameStore.setState((cur) => ({
        ...cur,
        players: gs.players ?? cur.players,
        phase: gs.phase ?? cur.phase,
        currentTurn: gs.currentTurn ?? cur.currentTurn,
        discardPile: gs.discardPile ?? cur.discardPile,
        deck: gs.deck ?? cur.deck,
        drawnCard: gs.drawnCard !== undefined ? gs.drawnCard : cur.drawnCard,
        cambioCaller: gs.cambioCaller !== undefined ? gs.cambioCaller : cur.cambioCaller,
        remainingTurns: gs.remainingTurns ?? cur.remainingTurns,
        winner: gs.winner !== undefined ? gs.winner : cur.winner,
        finalScores: gs.finalScores ?? cur.finalScores,
        turnCount: gs.turnCount ?? cur.turnCount,
      }));
    });

    return () => {
      unsubAction();
      unsubFull();
    };
  }, [roomCode, roomId, isHost, handleRemoteAction]);

  return {
    sendAction,
    syncGameState,
    initGameInDB,
    loadGameState,
  };
}
