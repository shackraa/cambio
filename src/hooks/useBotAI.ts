import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getPower } from '../engine/gameEngine';
import type { GameEvent } from './useRealtimeGame';

function getRandomDelay(min = 1400, max = 2400) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isBotPlayer(player: { id: string; seat: number }, isOnlineMode: boolean): boolean {
  if (!isOnlineMode) return player.seat !== 0;
  return player.id.startsWith('bot-');
}

export function useBotAI(
  isOnlineMode: boolean,
  isHost = true,
  sendAction?: (event: GameEvent, overrideSeat?: number) => void,
  syncGameState?: () => Promise<void>
) {
  const phase = useGameStore((s) => s.phase);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const peekState = useGameStore((s) => s.peekState);
  const activePower = useGameStore((s) => s.activePower);
  const drawnCard = useGameStore((s) => s.drawnCard);
  const isGameOver = useGameStore((s) => s.winner !== null || s.phase === 'results');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Online modda sadece Host olan cihaz botların hamlelerini hesaplar ve odaya yayınlar
    if ((isOnlineMode && !isHost) || isGameOver) return;

    const state = useGameStore.getState();
    const { players, peekSelectedPositions } = state;
    const difficulty =
      (sessionStorage.getItem('botDifficulty') as 'casual' | 'tactical' | 'grandmaster') ||
      'tactical';

    // ── PEEK FAZI: Tüm botlar kendi kartlarını seçmeli ──────────────
    if (phase === 'peek' && peekState === 'select') {
      const bots = players.filter((p) => isBotPlayer(p, isOnlineMode));
      const timeouts: ReturnType<typeof setTimeout>[] = [];

      bots.forEach((bot, idx) => {
        const hasSelected =
          peekSelectedPositions.filter((pos) => pos.playerId === bot.id).length >= 2;
        if (!hasSelected) {
          const timeout = setTimeout(() => {
            useGameStore.setState((s) => {
              const mySelections = s.peekSelectedPositions.filter(
                (p) => p.playerId === bot.id
              );
              if (mySelections.length < 2) {
                const available = [0, 1, 2, 3].filter(
                  (pos) => !mySelections.some((m) => m.pos === pos)
                );
                const picked = available
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 2 - mySelections.length);
                picked.forEach((p) => {
                  s.peekSelectedPositions.push({ playerId: bot.id, pos: p });
                  if (isOnlineMode && sendAction) {
                    sendAction({ type: 'PEEK_CARD_SELECT', seat: bot.seat, pos: p }, bot.seat);
                  }
                });
              }
            });
          }, 850 + idx * 450);
          timeouts.push(timeout);
        }
      });
      return () => timeouts.forEach((t) => clearTimeout(t));
    }

    const currentPlayer = players.find((p) => p.seat === currentTurn);
    // Sıra bir botta değilse hiçbir şey yapma
    if (!currentPlayer || !isBotPlayer(currentPlayer, isOnlineMode)) return;

    const botSeat = currentPlayer.seat;

    if (timerRef.current) clearTimeout(timerRef.current);

    const broadcastBotMove = (ev: GameEvent) => {
      if (isOnlineMode && sendAction) {
        sendAction(ev, botSeat);
        setTimeout(() => {
          syncGameState?.();
        }, 120);
      }
    };

    timerRef.current = setTimeout(() => {
      const s = useGameStore.getState();

      // ── DRAW FAZI ──────────────────────────────────────────────────
      if (s.phase === 'draw') {
        const me = s.players.find((p) => p.seat === botSeat);
        if (!me) return;

        // 1) Önce Cambio kontrolü: Zorluk seviyesine göre eşik
        const cambioThreshold =
          difficulty === 'grandmaster' ? 7 : difficulty === 'tactical' ? 6 : 4;
        const cambioChance =
          difficulty === 'grandmaster' ? 0.88 : difficulty === 'tactical' ? 0.65 : 0.45;

        if (s.cambioCaller === null && s.turnCount >= 4) {
          const myScore = me.cards.reduce((sum, c) => sum + c.value, 0);
          if (myScore <= cambioThreshold && Math.random() < cambioChance) {
            s.callCambio();
            broadcastBotMove({ type: 'CALL_CAMBIO', seat: botSeat });
            return;
          }
        }

        // 2) Cambio demediyse kart çek
        const topDiscard = s.discardPile[s.discardPile.length - 1];
        const highestMyCard = me.cards.reduce((max, c) => Math.max(max, c.value), -10);
        const maxAcceptableDiscard = difficulty === 'grandmaster' ? 3 : 4;

        if (
          topDiscard &&
          topDiscard.value <= maxAcceptableDiscard &&
          topDiscard.value < highestMyCard
        ) {
          s.drawFromDiscard();
          broadcastBotMove({ type: 'DRAW_FROM_DISCARD' });
        } else {
          s.drawFromDeck();
          broadcastBotMove({ type: 'DRAW_FROM_DECK' });
        }
        return;
      }

      // ── ACTION FAZI ───────────────────────────────────────────────
      if (s.phase === 'action' && s.drawnCard) {
        const card = s.drawnCard;
        const power = getPower(card.rank, card.suit);
        const me = s.players.find((p) => p.seat === botSeat);
        if (!me || me.cards.length === 0) {
          s.discardDrawn(botSeat);
          broadcastBotMove({ type: 'DISCARD_DRAWN' });
          return;
        }

        // En yüksek kartı bul
        let highestValue = -100;
        let highestIndex = 0;
        me.cards.forEach((c, idx) => {
          if (c.value > highestValue) {
            highestValue = c.value;
            highestIndex = idx;
          }
        });

        // Casual modda bazen rastgele kartı değiştirebilir
        if (difficulty === 'casual' && Math.random() < 0.25) {
          highestIndex = Math.floor(Math.random() * me.cards.length);
          highestValue = me.cards[highestIndex]?.value ?? highestValue;
        }

        // Açık desteden çekilmişse MUTLAKA takas yap
        if (s.drawnFrom === 'discard') {
          s.swapCard(highestIndex, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: highestIndex });
          return;
        }

        if (card.value <= 4 && card.value < highestValue) {
          s.swapCard(highestIndex, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: highestIndex });
        } else if (power) {
          s.discardDrawn(botSeat);
          broadcastBotMove({ type: 'DISCARD_DRAWN' });
        } else if (card.value < highestValue && highestValue >= 8) {
          s.swapCard(highestIndex, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: highestIndex });
        } else {
          s.discardDrawn(botSeat);
          broadcastBotMove({ type: 'DISCARD_DRAWN' });
        }
        return;
      }

      // ── POWER FAZI ───────────────────────────────────────────────
      if (s.phase === 'power' && s.activePower) {
        const power = s.activePower;
        const otherPlayers = s.players.filter(
          (p) => p.seat !== botSeat && p.cards.length > 0
        );
        const me = s.players.find((p) => p.seat === botSeat);
        if (!me || me.cards.length === 0 || otherPlayers.length === 0) {
          s.skipPower(botSeat);
          broadcastBotMove({ type: 'SKIP_POWER' });
          return;
        }

        const randomOpponent =
          otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        const randomOpponentPos = Math.floor(
          Math.random() * randomOpponent.cards.length
        );

        let highestMyValue = -100;
        let highestMyIndex = 0;
        me.cards.forEach((c, idx) => {
          if (c.value > highestMyValue) {
            highestMyValue = c.value;
            highestMyIndex = idx;
          }
        });

        let lowestOpponentValue = 100;
        let lowestOpponentPos = 0;
        randomOpponent.cards.forEach((c, idx) => {
          if (c.value < lowestOpponentValue) {
            lowestOpponentValue = c.value;
            lowestOpponentPos = idx;
          }
        });

        if (power === 'peek_own') {
          const randomMyPos = Math.floor(Math.random() * me.cards.length);
          s.usePower('peek_own', botSeat, randomMyPos, undefined, false, botSeat);
          broadcastBotMove({
            type: 'USE_POWER',
            power: 'peek_own',
            targetSeat: botSeat,
            targetPos: randomMyPos,
          });
        } else if (power === 'peek_other') {
          s.usePower(
            'peek_other',
            randomOpponent.seat,
            randomOpponentPos,
            undefined,
            false,
            botSeat
          );
          broadcastBotMove({
            type: 'USE_POWER',
            power: 'peek_other',
            targetSeat: randomOpponent.seat,
            targetPos: randomOpponentPos,
          });
        } else if (power === 'blind_swap') {
          if (highestMyValue >= 5) {
            s.usePower(
              'blind_swap',
              randomOpponent.seat,
              randomOpponentPos,
              highestMyIndex,
              false,
              botSeat
            );
            broadcastBotMove({
              type: 'USE_POWER',
              power: 'blind_swap',
              targetSeat: randomOpponent.seat,
              targetPos: randomOpponentPos,
              swapWith: highestMyIndex,
            });
          } else {
            s.skipPower(botSeat);
            broadcastBotMove({ type: 'SKIP_POWER' });
          }
        } else if (power === 'spy_swap') {
          s.usePower(
            'spy_swap',
            randomOpponent.seat,
            lowestOpponentPos,
            undefined,
            false,
            botSeat
          );
          broadcastBotMove({
            type: 'USE_POWER',
            power: 'spy_swap',
            targetSeat: randomOpponent.seat,
            targetPos: lowestOpponentPos,
          });
          setTimeout(() => {
            const currentS = useGameStore.getState();
            if (currentS.phase !== 'power' || currentS.activePower !== 'spy_swap') return;
            if (lowestOpponentValue < highestMyValue) {
              currentS.usePower(
                'spy_swap',
                randomOpponent.seat,
                lowestOpponentPos,
                highestMyIndex,
                false,
                botSeat
              );
              broadcastBotMove({
                type: 'USE_POWER',
                power: 'spy_swap',
                targetSeat: randomOpponent.seat,
                targetPos: lowestOpponentPos,
                swapWith: highestMyIndex,
              });
            } else {
              currentS.skipPower(botSeat);
              broadcastBotMove({ type: 'SKIP_POWER' });
            }
          }, 2200);
        }
        return;
      }
    }, getRandomDelay(1000, 1900));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    phase,
    currentTurn,
    peekState,
    activePower,
    drawnCard,
    isOnlineMode,
    isHost,
    isGameOver,
    sendAction,
    syncGameState,
  ]);
}
