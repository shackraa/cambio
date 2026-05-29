import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getPower } from '../engine/gameEngine';

function getRandomDelay(min = 1000, max = 2500) {
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

      bots.forEach(bot => {
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
          }, getRandomDelay(1500, 3000));
          return () => clearTimeout(timeout);
        }
      });
      return;
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

        // 1) Önce Cambio kontrolü: El puanı <= 7 ise ve henüz kimse Cambio dememiş
        if (!s.cambioCaller) {
          const myScore = me.cards.reduce((sum, c) => sum + c.value, 0);
          if (myScore <= 7 && Math.random() < 0.6) {
            s.callCambio();
            return; // Cambio dendi, kart çekme
          }
        }

        // 2) Cambio demediyse kart çek
        const topDiscard = s.discardPile[s.discardPile.length - 1];
        if (topDiscard && topDiscard.value >= 0 && topDiscard.value <= 5) {
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
        if (!me) return;

        // Açık desteden çekilmişse MUTLAKA takas yap (zaten iyi bir kart seçti)
        if (s.drawnFrom === 'discard') {
          let highestValue = -100;
          let highestIndex = 0;
          me.cards.forEach((c, idx) => {
            if (c.value > highestValue) {
              highestValue = c.value;
              highestIndex = idx;
            }
          });
          s.swapCard(highestIndex, botSeat);
          return;
        }

        // Desteden çekildiyse: Kart değerine göre karar ver
        if (card.value <= 5) {
          // İyi kart: En yüksek kartla değiştir (eğer daha iyiyse)
          let highestValue = -100;
          let highestIndex = 0;
          me.cards.forEach((c, idx) => {
            if (c.value > highestValue) {
              highestValue = c.value;
              highestIndex = idx;
            }
          });

          if (card.value < highestValue) {
            s.swapCard(highestIndex, botSeat);
          } else {
            // Kart elimizdekilerden daha kötü: Güç varsa kullan, yoksa at
            if (power) {
              s.discardDrawn(botSeat); // Güç kartı → çöpe at, güç aktif olacak
            } else {
              s.discardDrawn(botSeat);
            }
          }
        } else if (power) {
          // Güç kartı ama kötü: Çöpe at ve gücü kullan
          s.discardDrawn(botSeat);
        } else {
          // Kötü kart, güç yok: Çöpe at
          s.discardDrawn(botSeat);
        }
        return;
      }

      // ── POWER FAZI ───────────────────────────────────────────────
      if (s.phase === 'power' && s.activePower) {
        const power = s.activePower;
        const otherPlayers = s.players.filter(p => p.seat !== botSeat);
        if (otherPlayers.length === 0) return;

        const me = s.players.find(p => p.seat === botSeat);
        if (!me) return;

        const randomOpponent = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        const randomOpponentPos = Math.floor(Math.random() * Math.max(1, randomOpponent.cards.length));

        // Kendi en yüksek kartını bul
        let highestMyValue = -100;
        let highestMyIndex = 0;
        me.cards.forEach((c, idx) => {
          if (c.value > highestMyValue) {
            highestMyValue = c.value;
            highestMyIndex = idx;
          }
        });

        // En düşük rakip kartını bul (bot her şeyi biliyor — AI avantajı)
        let lowestOpponentValue = 100;
        let lowestOpponentPos = 0;
        randomOpponent.cards.forEach((c, idx) => {
          if (c.value < lowestOpponentValue) {
            lowestOpponentValue = c.value;
            lowestOpponentPos = idx;
          }
        });

        if (power === 'peek_own') {
          const randomMyPos = Math.floor(Math.random() * Math.max(1, me.cards.length));
          s.usePower('peek_own', botSeat, randomMyPos, undefined, false, botSeat);
        } else if (power === 'peek_other') {
          s.usePower('peek_other', randomOpponent.seat, randomOpponentPos, undefined, false, botSeat);
        } else if (power === 'blind_swap') {
          s.usePower('blind_swap', randomOpponent.seat, lowestOpponentPos, highestMyIndex, false, botSeat);
        } else if (power === 'spy_swap') {
          if (lowestOpponentValue < highestMyValue) {
            s.usePower('spy_swap', randomOpponent.seat, lowestOpponentPos, highestMyIndex, false, botSeat);
          } else {
            s.skipPower(botSeat);
          }
        }
        return;
      }

    }, getRandomDelay(1200, 2500));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

  }, [phase, currentTurn, peekState, activePower, drawnCard, isOnlineMode, isGameOver]);
}
