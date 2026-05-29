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
    const { players, discardPile, peekSelectedPositions, drawFromDeck, drawFromDiscard, swapCard, discardDrawn, usePower, skipPower, callCambio } = state;
    
    // Eğer PEEK phase ise, tüm botlar kendi kartlarını seçmeli
    if (phase === 'peek' && peekState === 'select') {
      const bots = players.filter(p => p.seat !== 0);
      
      bots.forEach(bot => {
        const hasSelected = peekSelectedPositions.filter(pos => pos.playerId === bot.id).length >= 2;
        if (!hasSelected) {
          const timeout = setTimeout(() => {
            // İki rastgele kartını seç
            useGameStore.setState((s) => {
              const mySelections = s.peekSelectedPositions.filter(p => p.playerId === bot.id);
              if (mySelections.length < 2) {
                // Rastgele 2 pozisyon seç (0,1,2,3)
                const available = [0,1,2,3].filter(pos => !mySelections.some(m => m.pos === pos));
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
      const currentState = useGameStore.getState();
      
      if (currentState.phase === 'draw') {
        // Çekme aşaması: Çöpteki karta bak, iyi bir kartsa (0-5) al, yoksa desteden çek
        const topDiscard = currentState.discardPile[currentState.discardPile.length - 1];
        if (topDiscard && topDiscard.value >= 0 && topDiscard.value <= 5) {
          currentState.drawFromDiscard();
        } else {
          currentState.drawFromDeck();
        }
      } 
      else if (currentState.phase === 'action' && currentState.drawnCard) {
        // Kart elinde: Karar ver
        const card = currentState.drawnCard;
        const power = getPower(card.rank, card.suit);
        const me = currentState.players.find(p => p.seat === botSeat);

        if (!me) return;

        // Eğer kart iyi bir kartsa (<= 5)
        if (card.value <= 5) {
          // En yüksek değerli kartını bul
          let highestValue = -100;
          let highestIndex = 0;

          me.cards.forEach((c, idx) => {
            if (c.value > highestValue) {
              highestValue = c.value;
              highestIndex = idx;
            }
          });

          // Yeni kart daha iyi kartlarından birinden iyiyse takas yap
          if (card.value < highestValue) {
            currentState.swapCard(highestIndex, botSeat);
          } else {
            currentState.discardDrawn(botSeat);
          }
        }
        else if (power && currentState.drawnFrom === 'deck') {
          // Güç kartı ve desteden çekildi: Çöpe at ve gücü kullan
          currentState.discardDrawn(botSeat);
        }
        else {
          // Kötü bir kart, çöpe at
          currentState.discardDrawn(botSeat);
        }
      }
      else if (currentState.phase === 'power' && currentState.activePower) {
        // Güç kullanma aşaması
        const power = currentState.activePower;
        const otherPlayers = currentState.players.filter(p => p.seat !== botSeat);
        if (otherPlayers.length === 0) return;

        const me = currentState.players.find(p => p.seat === botSeat);
        if (!me) return;

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
          // Rastgele bir kendi kartına bak (GUI'da bir şey olmaz ama state geçer)
          currentState.usePower('peek_own', botSeat, Math.floor(Math.random() * 4), undefined, false, botSeat);
        } 
        else if (power === 'peek_other') {
          currentState.usePower('peek_other', randomOpponent.seat, randomOpponentPos, undefined, false, botSeat);
        }
        else if (power === 'blind_swap') {
          // Kendi en kötü kartını rakibin en iyi (en düşük) kartı ile değiştir
          currentState.usePower('blind_swap', randomOpponent.seat, lowestOpponentPos, highestMyIndex, false, botSeat);
        }
        else if (power === 'spy_swap') {
          // Bak ve karar ver: Rakibin kartı benim en yüksek kartımdan küçükse takas et
          // Bot hile yaptığı için anında bilir
          if (lowestOpponentValue < highestMyValue) {
            currentState.usePower('spy_swap', randomOpponent.seat, lowestOpponentPos, highestMyIndex, false, botSeat);
          } else {
            currentState.skipPower(botSeat);
          }
        }
      }
      
      // Cambio çağırması: Her draw phase başında sıra bot'taysa check et
      if (currentState.phase === 'draw' && !currentState.cambioCaller) {
        const me = currentState.players.find(p => p.seat === currentState.currentTurn);
        if (me && me.seat !== 0) { // Sadece bot kontrol et
          const myScore = me.cards.reduce((sum, c) => sum + c.value, 0);
          // El puanı 7'den az veya çok iyi kartlar varsa Cambio de
          if (myScore <= 7 && Math.random() < 0.5) {
            currentState.callCambio();
          }
        }
      }

    }, getRandomDelay(1500, 3000));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

  }, [phase, currentTurn, peekState, activePower, drawnCard, isOnlineMode, isGameOver]);

}
