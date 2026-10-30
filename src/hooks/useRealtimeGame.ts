// @ts-nocheck
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';
import { useGameStore } from '../store/useGameStore';
import type { Card } from '../types/game';
import { createDeck, shuffleDeck, dealCards } from '../engine/gameEngine';
import { SoundManager } from '../utils/SoundManager';

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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const store = useGameStore;

  // ── Oyun state'ini DB'den paralel (Promise.all) yükle ──────────────────────────
  const loadGameState = useCallback(async () => {
    if (!roomId || roomCode === 'local') return;

    const [{ data: gs }, { data: allCardsData }, { data: playersData }] = await Promise.all([
      supabase.from('game_state').select('*').eq('room_id', roomId).single(),
      supabase.from('player_cards').select('*').eq('room_id', roomId).order('position'),
      supabase.from('players').select('*').eq('room_id', roomId).order('seat'),
    ]);

    if (!gs || !allCardsData || !playersData) return;

    // Store'u DB verileriyle başlat
    const players = playersData.map(p => ({
      id: p.id,
      nickname: p.nickname,
      seat: p.seat,
      score: p.score,
      isOnline: p.is_online,
      isCurrentTurn: p.seat === gs.current_turn,
      cards: (allCardsData || [])
        .filter(c => c.player_id === p.id)
        .map(c => ({
          id: c.id,
          rank: c.card_rank as Card['rank'],
          suit: c.card_suit as Card['suit'],
          value: c.card_value,
          isRevealed: c.is_revealed,
          isPenalty: c.is_penalty,
        })),
    }));

    useGameStore.setState({
      players,
      phase: gs.phase as ReturnType<typeof store.getState>['phase'],
      currentTurn: gs.current_turn,
      discardPile: (gs.discard_pile as Card[]) ?? [],
      deck: (gs.deck as Card[]) ?? [],
      drawnCard: gs.drawn_card as Card | null,
      cambioCaller: gs.cambio_caller,
      remainingTurns: gs.remaining_turns,
      roomCode,
      knownCards: [], // Her yeni state yüklendiğinde knownCards temizlenir (eski oyunun hafızası silinir)
      peekPhaseEndTime: gs.phase === 'peek' ? Date.now() + 5000 : null,
      peekState: gs.phase === 'peek' ? 'select' : null,
      peekSelectedPositions: [],
    });
  }, [roomId, myPlayerId, roomCode, store]);

  // ── Host: oyunu DB'ye yaz ────────────────────────────────
  const initGameInDB = useCallback(async () => {
    const { data: playersData, error: playersErr } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat');

    if (playersErr) {
      console.error('Test: playersErr', playersErr);
      useToastStore.getState().addToast(`Oyuncu verisi alınamadı: ${playersErr.message}`, 'error');
      return;
    }
    if (!playersData || playersData.length < 2) {
      useToastStore.getState().addToast(`Eksik oyuncu. (Şu an: ${playersData?.length})`, 'error');
      return;
    }

    const shuffled = shuffleDeck(createDeck());
    const { playerHands, remainingDeck } = dealCards(shuffled);

    // game_state kaydet (varsa güncelle)
    const { data: gs, error: gsErr } = await supabase
      .from('game_state')
      .upsert({
        room_id: roomId,
        deck: remainingDeck,
        discard_pile: [],
        current_turn: 0,
        phase: 'peek',
        drawn_card: null,
        cambio_caller: null,
        remaining_turns: 0
      }, { onConflict: 'room_id' })
      .select()
      .single();

    if (gsErr) {
      console.error('Test: gsErr', gsErr);
      useToastStore.getState().addToast(`Game State hatası: ${gsErr.message}`, 'error');
      return;
    }
    if (!gs) {
      useToastStore.getState().addToast('Game state eklenemedi (data null)', 'error');
      return;
    }

    // Her oyuncunun kartlarını DB'ye kaydet
    const cardInserts = playersData.flatMap((player, playerIdx) =>
      (playerHands[playerIdx] ?? []).map((card, pos) => ({
        room_id: roomId,
        player_id: player.id,
        position: pos,
        card_value: card.value,
        card_suit: card.suit,
        card_rank: card.rank,
        is_revealed: false,
        is_penalty: false,
      }))
    );

    // Varsa eski kartları sil (reset durumu)
    await supabase.from('player_cards').delete().eq('room_id', roomId);

    const { error: cardsErr } = await supabase.from('player_cards').insert(cardInserts);
    if (cardsErr) {
      console.error('Test: cardsErr', cardsErr);
      useToastStore.getState().addToast(`Kart dağıtma hatası: ${cardsErr.message}`, 'error');
      return;
    }

    // Broadcast: oyun başladı
    sendAction({ type: 'GAME_STARTED', gameStateId: gs.id });
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Aksiyon gönder ───────────────────────────────────────
  const sendAction = useCallback((event: GameEvent) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'game_action',
      payload: { ...event, fromSeat: mySeat },
    });
  }, [mySeat]);

  // ── DB game_state güncelle ───────────────────────────────
  const syncGameState = useCallback(async () => {
    const state = useGameStore.getState();
    await supabase
      .from('game_state')
      .update({
        phase: state.phase,
        current_turn: state.currentTurn,
        discard_pile: state.discardPile,
        drawn_card: state.drawnCard,
        cambio_caller: state.cambioCaller,
        remaining_turns: state.remainingTurns,
        deck: state.deck,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', roomId);
  }, [roomId]);

  // ── Aksiyon handler ─────────────────────────────────────
  const handleRemoteAction = useCallback((event: GameEvent & { fromSeat?: number }) => {
    const s = useGameStore.getState();

    switch (event.type) {
      case 'GAME_STARTED':
        useToastStore.getState().addToast('Oyun Başladı! Kartlarına bak (5 sn)', 'success');
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
        s.usePower(event.power as Parameters<typeof s.usePower>[0], event.targetSeat, event.targetPos, event.swapWith, isLocalUser, event.fromSeat);
        break;
      }
      case 'SKIP_POWER':
        s.skipPower(event.fromSeat);
        break;
      case 'STICK_CARD': {
        // Geriye dönük uyumluluk (eski cacheli GameBoard'lar için)
        const targetSeat = event.targetSeat !== undefined ? event.targetSeat : event.fromSeat!;
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
      case 'PEEK_CARD_SELECT':
        {
          const ev = event as any;
          const player = store.getState().players.find(p => p.seat === ev.seat);
          if (player) {
            const mySelections = store.getState().peekSelectedPositions.filter(p => p.playerId === player.id);
            if (mySelections.length < 2 && !mySelections.find(s => s.pos === ev.pos)) {
              store.setState(s => {
                s.peekSelectedPositions.push({ playerId: player.id, pos: ev.pos });
              });
            }
          }
        }
        break;
      case 'END_GAME':
        s.endGame();
        break;
    }
  }, [loadGameState]);

  // ── Presence (Sadece gerçek online odalarda WebSocket açılır; bot modunda sunucu yorulmaz) ──
  useEffect(() => {
    if (!roomCode || !roomId || roomCode === 'local') return;

    const channel = supabase.channel(`game:${roomCode}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'game_action' }, ({ payload }) => {
        handleRemoteAction(payload as GameEvent & { fromSeat?: number });
      })
      .on('presence', { event: 'sync' }, () => {
        // Presence sync: online oyuncuları güncelle
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ playerId: myPlayerId, seat: mySeat });

          // Oyun state'ini yükle (host değilse)
          if (!isHost) {
            setTimeout(() => loadGameState(), 500);
          }
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, myPlayerId, mySeat, isHost, handleRemoteAction, loadGameState]);

  return {
    sendAction,
    syncGameState,
    initGameInDB,
    loadGameState,
  };
}
