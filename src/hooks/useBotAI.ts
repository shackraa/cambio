import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getPower } from '../engine/gameEngine';

function getRandomDelay(min = 1000, max = 2200) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useBotAI(isOnlineMode: boolean) {
  const phase = useGameStore(s => s.phase);
  const currentTurn = useGameStore(s => s.currentTurn);
  const peekState = useGameStore(s => s.peekState);
  const activePower = useGameStore(s => s.activePower);
  const drawnCard = useGameStore(s => s.drawnCard);
  const isGameOver = useGameStore(s => s.winner !== null || s.phase === 'results');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOnlineMode || isGameOver) return;

    const state = useGameStore.getState();
    const { players, peekSelectedPositions } = state;

    // ── PEEK FAZI: Tüm botlar kendi kartlarını seçmeli ──────────────
    if (phase === 'peek' && peekState === 'select') {
      const bots = players.filter(p => p.seat !== 0);
      const timeouts: ReturnType<typeof setTimeout>[] = [];

      bots.forEach((bot, idx) => {
        const hasSelected = peekSelectedPositions.filter(pos => pos.playerId === bot.id).length >= 2;
        if (!hasSelected) {
          const timeout = setTimeout(() => {
            useGameStore.setState((s) => {
              const mySelections = s.peekSelectedPositions.filter(p => p.playerId === bot.id);
              if (mySelections.length < 2) {
                const available = [0, 1, 2, 3].filter(pos => !mySelections.some(m => m.pos === pos));
                const picked = available.sort(() => Math.random() - 0.5).slice(0, 2 - mySelections.length);
                picked.forEach(p => {
                  s.peekSelectedPositions.push({ playerId: bot.id, pos: p });
                });
              }
            });
          }, 900 + idx * 500);
          timeouts.push(timeout);
        }
      });
      return () => timeouts.forEach(t => clearTimeout(t));
    }

    const currentPlayer = players.find(p => p.seat === currentTurn);
    // Sıra botta değilse hiçbir şey yapma (Seat 0 = İnsan oyuncu)
    if (!currentPlayer || currentPlayer.seat === 0) return;

    const botSeat = currentPlayer.seat;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Aksiyonlar güncel state üzerinden alınmalı
      const s = useGameStore.getState();

      // ── DRAW FAZI ──────────────────────────────────────────────────
      if (s.phase === 'draw') {
        const me = s.players.find(p => p.seat === botSeat);
        if (!me) return;

        // 1) Önce Cambio kontrolü: El puanı <= 6 ise ve henüz kimse Cambio dememiş
        if (s.cambioCaller === null && s.turnCount >= 4) {
          const myScore = me.cards.reduce((sum, c) => sum + c.value, 0);
          if (myScore <= 6 && Math.random() < 0.65) {
            s.callCambio();
            return; // Cambio dendi, kart çekme
          }
        }

        // 2) Cambio demediyse kart çek
        const topDiscard = s.discardPile[s.discardPile.length - 1];
        const highestMyCard = me.cards.reduce((max, c) => Math.max(max, c.value), -10);
        if (topDiscard && topDiscard.value <= 4 && topDiscard.value < highestMyCard) {
          s.drawFromDiscard();
        } else {
          s.drawFromDeck();
        }
        return;
      }

      // ── ACTION FAZI ───────────────────────────────────────────────
      if (s.phase === 'action' && s.drawnCard) {
        const card = s.drawnCard;
        const power = getPower(card.rank, card.suit);
        const me = s.players.find(p => p.seat === botSeat);
        if (!me || me.cards.length === 0) {
          s.discardDrawn(botSeat);
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

        // Açık desteden çekilmişse MUTLAKA takas yap
        if (s.drawnFrom === 'discard') {
          s.swapCard(highestIndex, botSeat);
          return;
        }

        // Desteden çekildiyse: Kart değerine göre karar ver
        if (card.value <= 4 && card.value < highestValue) {
          s.swapCard(highestIndex, botSeat);
        } else if (power) {
          // Güç kartı: Çöpe at ve gücü kullan
          s.discardDrawn(botSeat);
        } else if (card.value < highestValue && highestValue >= 8) {
          // Elimde çok yüksek kart varsa orta şeker kartla bile değiştir
          s.swapCard(highestIndex, botSeat);
        } else {
          // Kötü kart, güç yok: Çöpe at
          s.discardDrawn(botSeat);
        }
        return;
      }

      // ── POWER FAZI ───────────────────────────────────────────────
      if (s.phase === 'power' && s.activePower) {
        const power = s.activePower;
        const otherPlayers = s.players.filter(p => p.seat !== botSeat && p.cards.length > 0);
        const me = s.players.find(p => p.seat === botSeat);
        if (!me || me.cards.length === 0 || otherPlayers.length === 0) {
          s.skipPower(botSeat);
          return;
        }

        const randomOpponent = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        const randomOpponentPos = Math.floor(Math.random() * randomOpponent.cards.length);

        // Kendi en yüksek kartını bul
        let highestMyValue = -100;
        let highestMyIndex = 0;
        me.cards.forEach((c, idx) => {
          if (c.value > highestMyValue) {
            highestMyValue = c.value;
            highestMyIndex = idx;
          }
        });

        // En düşük rakip kartını bul
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
        } else if (power === 'peek_other') {
          s.usePower('peek_other', randomOpponent.seat, randomOpponentPos, undefined, false, botSeat);
        } else if (power === 'blind_swap') {
          if (highestMyValue >= 5) {
            s.usePower('blind_swap', randomOpponent.seat, randomOpponentPos, highestMyIndex, false, botSeat);
          } else {
            s.skipPower(botSeat);
          }
        } else if (power === 'spy_swap') {
          // Önce rakibin kartına bakar (1. aşama), 1.5sn sonra takaslar veya pas geçer (2. aşama)
          s.usePower('spy_swap', randomOpponent.seat, lowestOpponentPos, undefined, false, botSeat);
          setTimeout(() => {
            const currentS = useGameStore.getState();
            if (currentS.phase !== 'power' || currentS.activePower !== 'spy_swap') return;
            if (lowestOpponentValue < highestMyValue) {
              currentS.usePower('spy_swap', randomOpponent.seat, lowestOpponentPos, highestMyIndex, false, botSeat);
            } else {
              currentS.skipPower(botSeat);
            }
          }, 1500);
        }
        return;
      }

    }, getRandomDelay(1000, 2000));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

  }, [phase, currentTurn, peekState, activePower, drawnCard, isOnlineMode, isGameOver]);
}
