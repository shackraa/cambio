import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getPower } from '../engine/gameEngine';
import type { GameEvent } from './useRealtimeGame';
import type { Card } from '../types/game';
import {
  resetBotMemory,
  rememberCard,
  knowsCard,
  recalledCard,
  estimateValue,
  UNKNOWN_CARD_ESTIMATE,
} from '../utils/botMemory';

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

/** Botun kendi elindeki en kötü (tahmini en yüksek puanlı) kartın konumu — sadece bildiği/tahmin ettiği değerlerle */
function worstOwnCard(botSeat: number, cards: Card[]) {
  let idx = -1;
  let val = -100;
  cards.forEach((c, i) => {
    if (c.isGhost) return;
    const v = estimateValue(botSeat, c);
    // Eşit tahminde bilinmeyen kart yerine bilinen yüksek kartı tercih et
    if (v > val || (v === val && knowsCard(botSeat, c))) {
      val = v;
      idx = i;
    }
  });
  return { idx, val };
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

  // Yeni el dağıtılırken bot hafızası sıfırlanır (kart id'leri her elde aynı olduğu için zorunlu)
  useEffect(() => {
    if (phase === 'peek' && peekState === 'dealing') {
      resetBotMemory();
    }
  }, [phase, peekState]);

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

    // ── 1) PEEK FAZI: Botlar 2 kart seçer ve SADECE o 2 kartı hafızaya alır ──
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
                const botNow = s.players.find((p) => p.id === bot.id);
                picked.forEach((p) => {
                  s.peekSelectedPositions.push({ playerId: bot.id, pos: p });
                  if (botNow?.cards[p]) {
                    rememberCard(bot.seat, botNow.cards[p] as Card);
                  }
                  if (isOnlineMode && sendAction) {
                    sendAction(
                      { type: 'PEEK_CARD_SELECT', seat: bot.seat, pos: p },
                      bot.seat
                    );
                  }
                });
              }
            });
          }, 900 + idx * 450);
          timeouts.push(timeout);
        }
      });
      return () => timeouts.forEach((t) => clearTimeout(t));
    }

    // ── 2) STICK WINDOW: Bot SADECE bildiği ve eşleşen kartı yapıştırır ──
    if (phase === 'stick_window' && discardPile.length > 0) {
      const topDiscard = discardPile[discardPile.length - 1];
      if (!topDiscard) return;

      const bots = players.filter(
        (p) => isBotPlayer(p, isOnlineMode) && p.cards.length > 0
      );

      // Bilinen + eşleşen + Kırmızı K (-1) olmayan kartlar aday olur. Bakmadığı kartı ASLA yapıştırmaz!
      const matchingCandidates: Array<{ botSeat: number; cardId: string }> = [];
      bots.forEach((bot) => {
        const match = bot.cards.find((c) => {
          const r = recalledCard(bot.seat, c);
          return r !== null && r.rank === topDiscard.rank && r.value >= 0;
        });
        if (match) matchingCandidates.push({ botSeat: bot.seat, cardId: match.id });
      });

      if (matchingCandidates.length > 0) {
        const stickChance =
          difficulty === 'grandmaster' ? 0.92 : difficulty === 'tactical' ? 0.75 : 0.5;

        if (Math.random() <= stickChance) {
          const chosen =
            matchingCandidates[Math.floor(Math.random() * matchingCandidates.length)];
          const reactionMs =
            difficulty === 'grandmaster'
              ? getRandomDelay(1000, 1600)
              : getRandomDelay(1300, 2200);

          const stickTimer = setTimeout(() => {
            const cur = useGameStore.getState();
            const curTop = cur.discardPile[cur.discardPile.length - 1];
            if (cur.phase !== 'stick_window' || !curTop || curTop.id !== topDiscard.id) {
              return;
            }
            const botPlayer = cur.players.find((p) => p.seat === chosen.botSeat);
            if (!botPlayer) return;
            const currentPos = botPlayer.cards.findIndex((c) => c.id === chosen.cardId);
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

    // ── 3) GIVE CARD: Bot bildiği en yüksek kartı verir (bilmiyorsa rastgele bilinmeyen) ──
    if (phase === 'give_card' && giveCardInitiator !== undefined) {
      const initiatorPlayer = players.find((p) => p.seat === giveCardInitiator);
      if (initiatorPlayer && isBotPlayer(initiatorPlayer, isOnlineMode)) {
        const giveTimer = setTimeout(() => {
          const cur = useGameStore.getState();
          if (cur.phase !== 'give_card') return;
          const me = cur.players.find((p) => p.seat === giveCardInitiator);
          if (!me || me.cards.length === 0) return;

          const { idx } = worstOwnCard(giveCardInitiator, me.cards as Card[]);
          const givePos = idx === -1 ? 0 : idx;

          cur.giveCardToOpponent(givePos, giveCardInitiator);
          broadcastBotMove(
            { type: 'GIVE_CARD', position: givePos, initiatorSeat: giveCardInitiator },
            giveCardInitiator
          );
        }, 1200);
        return () => clearTimeout(giveTimer);
      }
      return;
    }

    const currentPlayer = players.find((p) => p.seat === currentTurn);
    if (!currentPlayer || !isBotPlayer(currentPlayer, isOnlineMode)) return;

    const botSeat = currentPlayer.seat;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const s = useGameStore.getState();

      // ── DRAW FAZI ──────────────────────────────────────────────────
      if (s.phase === 'draw') {
        const me = s.players.find((p) => p.seat === botSeat);
        if (!me) return;

        // Cambio kararı SADECE botun bildiği/tahmin ettiği puanla verilir
        const cards = me.cards as Card[];
        const unknownCount = cards.filter((c) => !knowsCard(botSeat, c)).length;
        const estScore = cards.reduce((sum, c) => sum + estimateValue(botSeat, c), 0);
        const maxUnknown = difficulty === 'grandmaster' ? 0 : 1;
        const cambioThreshold =
          difficulty === 'grandmaster' ? 6 : difficulty === 'tactical' ? 7 : 9;

        if (
          s.cambioCaller === null &&
          s.turnCount >= 3 &&
          (cards.length === 0 ||
            (unknownCount <= maxUnknown && estScore <= cambioThreshold))
        ) {
          s.callCambio();
          broadcastBotMove({ type: 'CALL_CAMBIO', seat: botSeat }, botSeat);
          return;
        }

        // Çöpteki açık kart (herkes görür) elindeki en kötü karttan çok daha iyiyse onu al
        const topDiscard = s.discardPile[s.discardPile.length - 1];
        const { val: worstVal } = worstOwnCard(botSeat, cards);
        const maxAcceptableDiscard = difficulty === 'grandmaster' ? 3 : 4;

        if (
          topDiscard &&
          cards.length > 0 &&
          topDiscard.value <= maxAcceptableDiscard &&
          topDiscard.value < worstVal
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
        const power = s.drawnFrom === 'deck' ? getPower(card.rank, card.suit) : null;
        const me = s.players.find((p) => p.seat === botSeat);
        if (!me || me.cards.length === 0) {
          s.discardDrawn(botSeat);
          broadcastBotMove({ type: 'DISCARD_DRAWN' }, botSeat);
          return;
        }

        const doSwap = (pos: number) => {
          rememberCard(botSeat, card); // Eline aldığı kartı gördü → hafızaya al
          s.swapCard(pos, botSeat);
          broadcastBotMove({ type: 'SWAP_CARD', position: pos }, botSeat);
        };
        const doDiscard = () => {
          s.discardDrawn(botSeat);
          broadcastBotMove({ type: 'DISCARD_DRAWN' }, botSeat);
        };

        let { idx: worstIdx, val: worstVal } = worstOwnCard(botSeat, me.cards as Card[]);
        if (worstIdx === -1) worstIdx = 0;

        // Casual bot bazen en kötü kart yerine rastgele bir kartı seçer (ama bildiği -1/0'ı asla)
        if (difficulty === 'casual' && Math.random() < 0.25) {
          const pool = me.cards
            .map((c, i) => ({ i, v: estimateValue(botSeat, c as Card) }))
            .filter((x) => x.v > 0 && x.v > card.value);
          if (pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            worstIdx = pick.i;
            worstVal = pick.v;
          }
        }

        // Çöpten alınan kart mutlaka elde bir kartla değiştirilmelidir
        if (s.drawnFrom === 'discard') {
          doSwap(worstIdx);
          return;
        }

        // Kırmızı K (-1) veya Joker (0) asla çöpe atılmaz
        if (card.value <= 0 && worstVal > card.value) {
          doSwap(worstIdx);
          return;
        }

        // Düşük kart (≤4) bildiği/tahmin ettiği en kötü karttan iyiyse değiştir
        if (card.value <= 4 && card.value < worstVal) {
          doSwap(worstIdx);
        } else if (power) {
          doDiscard();
        } else if (card.value < worstVal && worstVal >= 8) {
          doSwap(worstIdx);
        } else if (card.value <= 5 && worstVal === UNKNOWN_CARD_ESTIMATE && !knowsCard(botSeat, me.cards[worstIdx] as Card)) {
          // Ortalamanın altındaki kartı bilinmeyen bir kartla değiştirmek mantıklıdır
          doSwap(worstIdx);
        } else {
          doDiscard();
        }
        return;
      }

      // ── POWER FAZI ───────────────────────────────────────────────
      if (s.phase === 'power' && s.activePower) {
        const power = s.activePower;
        const me = s.players.find((p) => p.seat === botSeat);
        // Cambio diyen oyuncunun kartları kilitlidir: takas hedefi olamaz
        const opponents = s.players.filter(
          (p) => p.seat !== botSeat && p.cards.length > 0
        );
        const swapTargets = opponents.filter((p) => p.seat !== s.cambioCaller);

        if (!me || me.cards.length === 0 || opponents.length === 0) {
          s.skipPower(botSeat);
          broadcastBotMove({ type: 'SKIP_POWER' }, botSeat);
          return;
        }

        const myCards = me.cards as Card[];
        const { idx: worstIdx, val: worstVal } = worstOwnCard(botSeat, myCards);

        if (power === 'peek_own') {
          // Bilmediği bir kartına bakar (hepsini biliyorsa rastgele)
          const unknownIdx = myCards
            .map((c, i) => (knowsCard(botSeat, c) ? -1 : i))
            .filter((i) => i !== -1);
          const pos =
            unknownIdx.length > 0
              ? unknownIdx[Math.floor(Math.random() * unknownIdx.length)]
              : Math.floor(Math.random() * myCards.length);
          rememberCard(botSeat, myCards[pos]);
          s.usePower('peek_own', botSeat, pos, undefined, false, botSeat);
          broadcastBotMove(
            { type: 'USE_POWER', power: 'peek_own', targetSeat: botSeat, targetPos: pos },
            botSeat
          );
          return;
        }

        if (power === 'peek_other') {
          const opp = opponents[Math.floor(Math.random() * opponents.length)];
          const unknownIdx = (opp.cards as Card[])
            .map((c, i) => (knowsCard(botSeat, c) ? -1 : i))
            .filter((i) => i !== -1);
          const pos =
            unknownIdx.length > 0
              ? unknownIdx[Math.floor(Math.random() * unknownIdx.length)]
              : Math.floor(Math.random() * opp.cards.length);
          rememberCard(botSeat, opp.cards[pos] as Card);
          s.usePower('peek_other', opp.seat, pos, undefined, false, botSeat);
          broadcastBotMove(
            { type: 'USE_POWER', power: 'peek_other', targetSeat: opp.seat, targetPos: pos },
            botSeat
          );
          return;
        }

        if (swapTargets.length === 0 || worstIdx === -1) {
          s.skipPower(botSeat);
          broadcastBotMove({ type: 'SKIP_POWER' }, botSeat);
          return;
        }

        // Rakiplerde bildiği en düşük kartı bul (bilmiyorsa rastgele bir rakip kartı)
        let best: { seat: number; pos: number; val: number } | null = null;
        swapTargets.forEach((p) => {
          (p.cards as Card[]).forEach((c, i) => {
            const r = recalledCard(botSeat, c);
            if (r && (!best || r.value < best.val)) best = { seat: p.seat, pos: i, val: r.value };
          });
        });
        const randomOpp = swapTargets[Math.floor(Math.random() * swapTargets.length)];
        const randomTarget = {
          seat: randomOpp.seat,
          pos: Math.floor(Math.random() * randomOpp.cards.length),
          val: UNKNOWN_CARD_ESTIMATE,
        };

        if (power === 'blind_swap') {
          const knownBest = best as { seat: number; pos: number; val: number } | null;
          const target = knownBest && knownBest.val < worstVal ? knownBest : randomTarget;
          // Kör takas sadece elde bildiği yüksek bir kart (≥7) varsa ya da iyi bir hedef biliyorsa mantıklıdır
          if (worstVal >= 7 && target.val < worstVal) {
            const givenCard = myCards[worstIdx];
            s.usePower('blind_swap', target.seat, target.pos, worstIdx, false, botSeat);
            broadcastBotMove(
              {
                type: 'USE_POWER',
                power: 'blind_swap',
                targetSeat: target.seat,
                targetPos: target.pos,
                swapWith: worstIdx,
              },
              botSeat
            );
            // Kör takasta gelen kartı görmez; verdiği kartı zaten biliyordu
            void givenCard;
          } else {
            s.skipPower(botSeat);
            broadcastBotMove({ type: 'SKIP_POWER' }, botSeat);
          }
          return;
        }

        if (power === 'spy_swap') {
          const knownBest = best as { seat: number; pos: number; val: number } | null;
          const target = knownBest ?? randomTarget;
          const targetPlayer = s.players.find((p) => p.seat === target.seat);
          const seenCard = targetPlayer?.cards[target.pos] as Card | undefined;
          rememberCard(botSeat, seenCard); // 1. aşama: rakibin kartını gördü
          s.usePower('spy_swap', target.seat, target.pos, undefined, false, botSeat);
          broadcastBotMove(
            { type: 'USE_POWER', power: 'spy_swap', targetSeat: target.seat, targetPos: target.pos },
            botSeat
          );
          setTimeout(() => {
            const cs = useGameStore.getState();
            if (cs.phase !== 'power' || cs.activePower !== 'spy_swap') return;
            const seenVal = seenCard ? seenCard.value : UNKNOWN_CARD_ESTIMATE;
            if (seenVal < worstVal) {
              cs.usePower('spy_swap', target.seat, target.pos, worstIdx, false, botSeat);
              broadcastBotMove(
                {
                  type: 'USE_POWER',
                  power: 'spy_swap',
                  targetSeat: target.seat,
                  targetPos: target.pos,
                  swapWith: worstIdx,
                },
                botSeat
              );
            } else {
              cs.skipPower(botSeat);
              broadcastBotMove({ type: 'SKIP_POWER' }, botSeat);
            }
          }, 2400);
        }
        return;
      }
    }, getRandomDelay(1500, 2500));

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
