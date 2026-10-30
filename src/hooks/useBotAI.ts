import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getPower } from '../engine/gameEngine';
import type { GameEvent } from './useRealtimeGame';

function getRandomDelay(min = 1200, max = 2100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isBotPlayer(
  player: { id: string; seat: number },
  isOnlineMode: boolean
): boolean {
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
  const discardTopId = useGameStore(
    (s) => s.discardPile[s.discardPile.length - 1]?.id ?? null
  );
  const giveCardInitiator = useGameStore((s) => s.giveCardInitiator);
  const isGameOver = useGameStore(
    (s) => s.winner !== null || s.phase === 'results'
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Online modda sadece Host olan cihaz botların hamlelerini hesaplar ve odaya yayınlar
    if ((isOnlineMode && !isHost) || isGameOver) return;

    const state = useGameStore.getState();
    const { players, peekSelectedPositions, discardPile } = state;
    const difficulty =
      (sessionStorage.getItem('botDifficulty') as
        | 'casual'
        | 'tactical'
        | 'grandmaster') || 'tactical';

    const broadcastBotMove = (ev: GameEvent, seat: number) => {
      if (isOnlineMode && sendAction) {
        sendAction(ev, seat);
        setTimeout(() => {
          syncGameState?.();
        }, 120);
      }
    };

    // ── 1) PEEK FAZI: Tüm botlar kendi kartlarını seçmeli ──────────────
    if (phase === 'peek' && peekState === 'select') {
      const bots = players.filter((p) => isBotPlayer(p, isOnlineMode));
      const timeouts: ReturnType<typeof setTimeout>[] = [];

      bots.forEach((bot, idx) => {
        const hasSelected =
          peekSelectedPositions.filter((pos) => pos.playerId === bot.id)
            .length >= 2;
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
                    sendAction(
                      { type: 'PEEK_CARD_SELECT', seat: bot.seat, pos: p },
                      bot.seat
                    );
                  }
                });
              }
            });
          }, 700 + idx * 380);
          timeouts.push(timeout);
        }
      });
      return () => timeouts.forEach((t) => clearTimeout(t));
    }

    // ── 2) STICK WINDOW (ORTAYA KART YAPIŞTIRMA & KART EKSİLTME!) ─────
    // Sıra kimde olursa olsun, ortaya atılan kartla aynı sayıda kartı olan botlar refleksle kartını ortaya yapıştırıp elinden kart eksiltir!
    if (phase === 'stick_window' && discardPile.length > 0) {
      const topDiscard = discardPile[discardPile.length - 1];
      if (!topDiscard) return;

      const bots = players.filter(
        (p) => isBotPlayer(p, isOnlineMode) && p.cards.length > 0
      );

      // Elinde topDiscard.rank ile eşleşen kartı olan botları bul
      // ÖNEMLİ: Kırmızı Papaz (-1 puan) oyundaki en değerli karttır; botlar ASLA kendi elindeki -1 puanlık Kırmızı K'yi çöpe yapıştırıp elinden çıkarmaz!
      const matchingCandidates: Array<{ botSeat: number; cardPos: number }> = [];
      bots.forEach((bot) => {
        const matchIdx = bot.cards.findIndex(
          (c) => c.rank === topDiscard.rank && c.value >= 0
        );
        if (matchIdx !== -1) {
          matchingCandidates.push({ botSeat: bot.seat, cardPos: matchIdx });
        }
      });

      if (matchingCandidates.length > 0) {
        // Zorluk seviyesine göre botun eşleşmeyi fark edip yapıştırma ihtimali
        const stickChance =
          difficulty === 'grandmaster'
            ? 0.95
            : difficulty === 'tactical'
              ? 0.82
              : 0.65;

        if (Math.random() <= stickChance) {
          const chosen =
            matchingCandidates[
              Math.floor(Math.random() * matchingCandidates.length)
            ];
          const reactionMs =
            difficulty === 'grandmaster'
              ? getRandomDelay(800, 1250)
              : getRandomDelay(950, 1550);

          const stickTimer = setTimeout(() => {
            const cur = useGameStore.getState();
            const curTop = cur.discardPile[cur.discardPile.length - 1];
            if (cur.phase !== 'stick_window' || !curTop || curTop.id !== topDiscard.id) {
              return;
            }
            const botPlayer = cur.players.find((p) => p.seat === chosen.botSeat);
            if (!botPlayer) return;
            const currentPos = botPlayer.cards.findIndex(
              (c) => c.rank === curTop.rank && c.value >= 0
            );
            if (currentPos === -1) return;

            cur.stickCard(chosen.botSeat, currentPos, curTop.id, chosen.botSeat);
            broadcastBotMove(
              {
                type: 'STICK_CARD',
                targetSeat: chosen.botSeat,
                position: currentPos,
                discardCardId: curTop.id,
                initiatorSeat: chosen.botSeat,
              },
              chosen.botSeat
            );
          }, reactionMs);

          return () => clearTimeout(stickTimer);
        }
      }
      return;
    }

    // ── 3) GIVE CARD FAZI (Bot rakibin kartını yapıştırdıysa kendi en yüksek kartını verir) ──
    if (phase === 'give_card' && giveCardInitiator !== undefined) {
      const initiatorPlayer = players.find((p) => p.seat === giveCardInitiator);
      if (initiatorPlayer && isBotPlayer(initiatorPlayer, isOnlineMode)) {
        const giveTimer = setTimeout(() => {
          const cur = useGameStore.getState();
          if (cur.phase !== 'give_card') return;
          const me = cur.players.find((p) => p.seat === giveCardInitiator);
          if (!me || me.cards.length === 0) return;

          let highestVal = -100;
          let highestIdx = 0;
          me.cards.forEach((c, idx) => {
            if (c.value > highestVal) {
              highestVal = c.value;
              highestIdx = idx;
            }
          });

          cur.giveCardToOpponent(highestIdx, giveCardInitiator);
          broadcastBotMove(
            {
              type: 'GIVE_CARD',
              position: highestIdx,
              initiatorSeat: giveCardInitiator,
            },
            giveCardInitiator
          );
        }, 950);
        return () => clearTimeout(giveTimer);
      }
      return;
    }

    const currentPlayer = players.find((p) => p.seat === currentTurn);
    // Sıra bir botta değilse hiçbir şey yapma
    if (!currentPlayer || !isBotPlayer(currentPlayer, isOnlineMode)) return;

    const botSeat = currentPlayer.seat;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const s = useGameStore.getState();

      // ── DRAW FAZI ──────────────────────────────────────────────────
      if (s.phase === 'draw') {
        const me = s.players.find((p) => p.seat === botSeat);
        if (!me) return;

        // Eğer bot tüm kartlarını yapıştırıp bitirdiyse (0 kart) veya çok az kartı kaldıysa hemen Cambio der!
        const cambioThreshold =
          difficulty === 'grandmaster' ? 7 : difficulty === 'tactical' ? 6 : 4;
        const cambioChance =
          difficulty === 'grandmaster'
            ? 0.88
            : difficulty === 'tactical'
              ? 0.68
              : 0.48;

        const myScore = me.cards.reduce((sum, c) => sum + c.value, 0);
        if (
          s.cambioCaller === null &&
          (me.cards.length === 0 ||
            (me.cards.length <= 2 && myScore <= cambioThreshold) ||
            (s.turnCount >= 4 &&
              myScore <= cambioThreshold &&
              Math.random() < cambioChance))
        ) {
          s.callCambio();
          broadcastBotMove({ type: 'CALL_CAMBIO', seat: botSeat }, botSeat);
          return;
        }

        // 2) Cambio demediyse kart çek
        const topDiscard = s.discardPile[s.discardPile.length - 1];
        const highestMyCard = me.cards.reduce(
          (max, c) => Math.max(max, c.value),
          -10
        );
        const maxAcceptableDiscard = difficulty === 'grandmaster' ? 3 : 4;

        if (
          topDiscard &&
          me.cards.length > 0 &&
          topDiscard.value <= maxAcceptableDiscard &&
          topDiscard.value < highestMyCard
        ) {
          s.drawFromDiscard();
          broadcastBotMove({ type: 'DRAW_FROM_DISCARD' }, botSeat);
        } else {
          s.drawFromDeck();
          broadcastBotMove({ type: 'DRAW_FROM_DECK' }, botSeat);
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
          broadcastBotMove({ type: 'DISCARD_DRAWN' }, botSeat);
          return;
        }

        let highestValue = -100;
        let highestIndex = 0;
        me.cards.forEach((c, idx) => {
          if (c.value > highestValue) {
            highestValue = c.value;
            highestIndex = idx;
          }
        });

        // Kırmızı Papaz (-1 puan) veya Joker (0 puan) çekildiyse ve elde daha yüksek puanlı bir kart varsa,
        // bot zorluğu ne olursa olsun ASLA çöpe atılmaz; her zaman elde tutulur!
        if (card.value <= 0 && highestValue > card.value) {
          s.swapCard(highestIndex, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: highestIndex }, botSeat);
          return;
        }

        if (difficulty === 'casual' && Math.random() < 0.25) {
          // Casual modda bile -1 (Kırmızı K) veya 0 (Joker) olan kartı elden çıkarma!
          const swappableIndices = me.cards
            .map((c, idx) => ({ val: c.value, idx }))
            .filter((item) => item.val > 0 && item.val > card.value);
          if (swappableIndices.length > 0) {
            const pick =
              swappableIndices[
                Math.floor(Math.random() * swappableIndices.length)
              ];
            highestIndex = pick.idx;
            highestValue = pick.val;
          }
        }

        if (s.drawnFrom === 'discard') {
          s.swapCard(highestIndex, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: highestIndex }, botSeat);
          return;
        }

        if (card.value <= 4 && card.value < highestValue) {
          s.swapCard(highestIndex, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: highestIndex }, botSeat);
        } else if (power) {
          s.discardDrawn(botSeat);
          broadcastBotMove({ type: 'DISCARD_DRAWN' }, botSeat);
        } else if (card.value < highestValue && highestValue >= 8) {
          s.swapCard(highestIndex, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: highestIndex }, botSeat);
        } else {
          s.discardDrawn(botSeat);
          broadcastBotMove({ type: 'DISCARD_DRAWN' }, botSeat);
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
          broadcastBotMove({ type: 'SKIP_POWER' }, botSeat);
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
          broadcastBotMove(
            {
              type: 'USE_POWER',
              power: 'peek_own',
              targetSeat: botSeat,
              targetPos: randomMyPos,
            },
            botSeat
          );
        } else if (power === 'peek_other') {
          s.usePower(
            'peek_other',
            randomOpponent.seat,
            randomOpponentPos,
            undefined,
            false,
            botSeat
          );
          broadcastBotMove(
            {
              type: 'USE_POWER',
              power: 'peek_other',
              targetSeat: randomOpponent.seat,
              targetPos: randomOpponentPos,
            },
            botSeat
          );
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
            broadcastBotMove(
              {
                type: 'USE_POWER',
                power: 'blind_swap',
                targetSeat: randomOpponent.seat,
                targetPos: randomOpponentPos,
                swapWith: highestMyIndex,
              },
              botSeat
            );
          } else {
            s.skipPower(botSeat);
            broadcastBotMove({ type: 'SKIP_POWER' }, botSeat);
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
          broadcastBotMove(
            {
              type: 'USE_POWER',
              power: 'spy_swap',
              targetSeat: randomOpponent.seat,
              targetPos: lowestOpponentPos,
            },
            botSeat
          );
          setTimeout(() => {
            const currentS = useGameStore.getState();
            if (
              currentS.phase !== 'power' ||
              currentS.activePower !== 'spy_swap'
            )
              return;
            if (lowestOpponentValue < highestMyValue) {
              currentS.usePower(
                'spy_swap',
                randomOpponent.seat,
                lowestOpponentPos,
                highestMyIndex,
                false,
                botSeat
              );
              broadcastBotMove(
                {
                  type: 'USE_POWER',
                  power: 'spy_swap',
                  targetSeat: randomOpponent.seat,
                  targetPos: lowestOpponentPos,
                  swapWith: highestMyIndex,
                },
                botSeat
              );
            } else {
              currentS.skipPower(botSeat);
              broadcastBotMove({ type: 'SKIP_POWER' }, botSeat);
            }
          }, 2200);
        }
        return;
      }
    }, getRandomDelay(1000, 1850));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    phase,
    currentTurn,
    peekState,
    activePower,
    drawnCard,
    discardTopId,
    giveCardInitiator,
    isOnlineMode,
    isHost,
    isGameOver,
    sendAction,
    syncGameState,
  ]);
}
