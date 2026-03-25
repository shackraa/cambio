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
  | { type: 'STICK_CARD'; position: number; discardCardId: string; seat: number }
  | { type: 'CALL_CAMBIO'; seat: number }
  | { type: 'END_GAME' }
  | { type: 'GAME_STARTED'; gameStateId: string };

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

  // ── Oyun state'ini DB'den yükle ──────────────────────────
  const loadGameState = useCallback(async () => {
    const { data: gs } = await supabase
      .from('game_state')
      .select('*')
      .eq('room_id', roomId)
      .single();

    const { data: allCardsData } = await supabase
      .from('player_cards')
      .select('*')
      .eq('room_id', roomId)
      .order('position');

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat');

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

    // game_state kaydet
    const { data: gs, error: gsErr } = await supabase
      .from('game_state')
      .insert({
        room_id: roomId,
        deck: remainingDeck,
        discard_pile: [],
        current_turn: 0,
        phase: 'peek',
      })
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
          s.swapCard(event.position);
          SoundManager.playCardDrop();
        }
        break;
      case 'DISCARD_DRAWN':
        if (event.fromSeat === s.currentTurn) {
          s.discardDrawn();
          SoundManager.playCardDrop();
        }
        break;
      case 'USE_POWER':
        s.usePower(event.power as Parameters<typeof s.usePower>[0], event.targetSeat, event.targetPos, event.swapWith);
        break;
      case 'SKIP_POWER':
        s.skipPower();
        break;
      case 'CALL_CAMBIO':
        s.callCambio();
        SoundManager.playCambio();
        useToastStore.getState().addToast('🎯 Bir oyuncu CAMBIO dedi!', 'warning');
        break;
      case 'END_GAME':
        s.endGame();
        break;
    }
  }, [loadGameState]);

  // ── Presence ─────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;

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
