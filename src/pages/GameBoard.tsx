import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore, advanceTurn } from '../store/useGameStore';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { CenterArea } from '../components/CenterArea';
import { PlayerArea } from '../components/PlayerArea';
import { TurnIndicator } from '../components/TurnIndicator';
import { PeekPhase } from '../components/PeekPhase';
import { PowerModal } from '../components/PowerModal';
import { ResultsScreen } from './ResultsScreen';
import { GameCard } from '../components/GameCard';
import { useState } from 'react';

export function GameBoard() {
  const { code } = useParams<{ code: string }>();

  // Session'dan oyuncu bilgisi al (Lobby'den set edilmeli)
  const [lobbyInfo] = useState(() => ({
    playerId:  sessionStorage.getItem('playerId') ?? 'local',
    seat:      parseInt(sessionStorage.getItem('seat') ?? '0', 10),
    roomId:    sessionStorage.getItem('roomId') ?? '',
    isHost:    sessionStorage.getItem('isHost') === 'true',
  }));

  const isOnlineMode = lobbyInfo.roomId !== '';

  const {
    phase,
    players,
    currentTurn,
    drawnCard,
    discardPile,
    deck,
    activePower,
    initGame,
    endPeekPhase,
    drawFromDeck,
    drawFromDiscard,
    swapCard,
    discardDrawn,
    usePower,
    skipPower,
    callCambio,
    cambioCaller,
  } = useGameStore();

  // Online modda realtime hook
  const { sendAction, syncGameState, loadGameState } = useRealtimeGame({
    roomCode: code ?? '',
    roomId: lobbyInfo.roomId,
    myPlayerId: lobbyInfo.playerId,
    mySeat: lobbyInfo.seat,
    isHost: lobbyInfo.isHost,
  });

  const [cambioFlash, setCambioFlash] = useState(false);

  // Cambio çağrılınca flaş patlat
  useEffect(() => {
    if (cambioCaller !== null) {
      setCambioFlash(true);
      const timer = setTimeout(() => setCambioFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [cambioCaller]);

  // İlk yükleme
  useEffect(() => {
    if (isOnlineMode) {
      // Online: DB'den state yükle
      loadGameState();
    } else {
      // Offline (demo) modu
      initGame('Sen', ['Ahmet', 'Zeynep', 'Mert']);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const me = players.find(p => p.seat === lobbyInfo.seat);
  const myTurn = currentTurn === lobbyInfo.seat;
  const currentPlayer = players.find(p => p.seat === currentTurn);
  const opponents = players.filter(p => p.seat !== lobbyInfo.seat);

  // stick_window → sıra geçişi + DB sync
  useEffect(() => {
    if (phase === 'stick_window') {
      const t = setTimeout(async () => {
        advanceTurn(useGameStore.getState());
        if (isOnlineMode && myTurn) await syncGameState();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, myTurn, isOnlineMode, syncGameState]);

  // Aksiyon wrapper: local + broadcast
  const doAction = useCallback((fn: () => void, event?: Parameters<typeof sendAction>[0]) => {
    fn();
    if (isOnlineMode && event) sendAction(event);
    // action fazı bitince DB'yi güncelle
    if (isOnlineMode && myTurn) {
      setTimeout(() => syncGameState(), 100);
    }
  }, [isOnlineMode, myTurn, sendAction, syncGameState]);

  const handlePeekDone = useCallback(() => endPeekPhase(), [endPeekPhase]);

  const handleUsePower = useCallback((targetSeat: number, targetPos: number, swapWith?: number) => {
    if (activePower) {
      doAction(
        () => usePower(activePower, targetSeat, targetPos, swapWith),
        { type: 'USE_POWER', power: activePower, targetSeat, targetPos, swapWith }
      );
    }
  }, [activePower, usePower, doAction]);

  // Sonuç ekranı
  if (phase === 'results') return <ResultsScreen />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4 relative">

      {/* ─── Online/Offline rozeti ─── */}
      {!isOnlineMode && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-orange-900/40 border border-orange-500/30
                        rounded-full text-orange-300 text-xs">
          📴 Demo Modu
        </div>
      )}

      {/* ─── Peek Phase Overlay ─── */}
      {phase === 'peek' && me && (
        <PeekPhase myCards={me.cards} onDone={handlePeekDone} />
      )}

      {/* ─── Power Modal ─── */}
      {phase === 'power' && activePower && me && (
        <PowerModal
          power={activePower}
          myCards={me.cards}
          opponents={opponents}
          myTurn={myTurn}
          onUse={handleUsePower}
          onSkip={() => doAction(skipPower, { type: 'SKIP_POWER' })}
        />
      )}

      {/* ─── Cambio Flash Effect ─── */}
      <AnimatePresence>
        {cambioFlash && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/30 backdrop-blur-sm pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h2
              className="text-7xl md:text-9xl font-black text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)] tracking-widest font-['Cinzel']"
              initial={{ scale: 0.2, rotate: -10 }}
              animate={{ scale: 1.2, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.6 }}
            >
              CAMBIO!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Başlık ─── */}
      <motion.h1
        className="font-['Cinzel'] text-3xl font-black tracking-widest"
        style={{
          background: 'linear-gradient(135deg, #d4a843 0%, #f0c96c 50%, #d4a843 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.5))',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        CAMBIO
      </motion.h1>

      {/* ─── Ana Masa ─── */}
      <div className="relative w-full max-w-2xl transform scale-[0.80] sm:scale-90 md:scale-100 origin-center">
        <div
          className="absolute inset-0 rounded-[40px]"
          style={{
            background: 'radial-gradient(ellipse at center, #1a7a55 0%, #0a5c40 50%, #063d2a 100%)',
            boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.3)',
            border: '2px solid rgba(212,168,67,0.25)',
          }}
        />

        {/* Üst: seat 2 */}
        <div className="relative flex justify-center pt-6">
          {players.find(p => p.seat === 2) && (
            <PlayerArea player={players.find(p => p.seat === 2)!} position="top" />
          )}
        </div>

        {/* Orta: seat 1 | Merkez | seat 3 */}
        <div className="relative flex items-center justify-between px-4 py-4">
          {players.find(p => p.seat === 1) && (
            <PlayerArea player={players.find(p => p.seat === 1)!} position="left" />
          )}

          <CenterArea
            deckCount={deck.length}
            discardPile={discardPile}
            roomCode={code ?? 'DEMO'}
            canDraw={myTurn && phase === 'draw'}
            onDrawFromDeck={() => doAction(drawFromDeck, { type: 'DRAW_FROM_DECK' })}
            onDrawFromDiscard={() => doAction(drawFromDiscard, { type: 'DRAW_FROM_DISCARD' })}
          />

          {players.find(p => p.seat === 3) && (
            <PlayerArea player={players.find(p => p.seat === 3)!} position="right" />
          )}
        </div>

        {/* Alt: benim koltuğum */}
        <div className="relative flex justify-center pb-6">
          {me && (
            <PlayerArea
              player={me}
              position="bottom"
              isMe
              onCardClick={
                phase === 'action' && myTurn
                  ? (pos) => doAction(() => swapCard(pos), { type: 'SWAP_CARD', position: pos })
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* ─── Çekilen Kart ─── */}
      <AnimatePresence>
        {drawnCard && phase === 'action' && myTurn && (
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <p className="text-white/60 text-xs">Çektiğin kart — kartına ekle ya da at</p>
            <div className="flex items-center gap-4">
              <GameCard card={drawnCard} size="lg" />
              <div className="flex flex-col gap-2">
                <motion.button
                  className="px-4 py-2 bg-[var(--gold)]/20 hover:bg-[var(--gold)]/40
                             border border-[var(--gold)]/40 rounded-xl text-[var(--gold)]
                             text-xs font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => doAction(discardDrawn, { type: 'DISCARD_DRAWN' })}
                >
                  🗑 Çöpe At
                </motion.button>
                <span className="text-white/40 text-[10px] text-center">
                  ya da alttaki kartına tıkla
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Alt Kontrol Paneli ─── */}
      <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
        <TurnIndicator
          currentPlayerName={currentPlayer?.nickname ?? '—'}
          phase={phase}
          myTurn={myTurn}
        />

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {myTurn && phase === 'draw' && (
            <motion.button
              className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-xl font-bold
                         text-white text-sm shadow-lg border border-red-400/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => doAction(callCambio, { type: 'CALL_CAMBIO', seat: lobbyInfo.seat })}
            >
              🎯 CAMBIO!
            </motion.button>
          )}

          {phase === 'cambio_round' && (
            <motion.div
              className="px-4 py-2 bg-red-900/40 border border-red-500/40 rounded-xl
                         text-red-300 text-xs font-bold"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🎯 CAMBIO Turu! Kalan: {useGameStore.getState().remainingTurns} tur
            </motion.div>
          )}

          <motion.button
            className="px-4 py-2 bg-black/30 hover:bg-black/50 rounded-xl
                       text-white/60 text-xs border border-white/10"
            whileHover={{ scale: 1.03 }}
          >
            📜 Kurallar
          </motion.button>
        </div>
      </div>
    </div>
  );
}
