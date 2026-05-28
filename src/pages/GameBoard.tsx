import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore, advanceTurn } from '../store/useGameStore';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { PlayerArea } from '../components/PlayerArea';
import { CenterArea } from '../components/CenterArea';
import { TurnIndicator } from '../components/TurnIndicator';
import { ChatPanel } from '../components/ChatPanel';
import { GameCard } from '../components/GameCard';
import { GameLog } from '../components/GameLog';
import { RulesPanel } from '../components/RulesPanel';
import { GameBackgroundOverlay } from '../components/GameBackgroundOverlay';
import { Leaderboard } from '../components/Leaderboard';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';
import { useBotAI } from '../hooks/useBotAI';

export function GameBoard() {
  const { code } = useParams<{ code: string }>();

  const [lobbyInfo] = useState(() => ({
    playerId:  sessionStorage.getItem('playerId') ?? 'local',
    seat:      parseInt(sessionStorage.getItem('seat') ?? '0', 10),
    roomId:    sessionStorage.getItem('roomId') ?? '',
    isHost:    sessionStorage.getItem('isHost') === 'true',
  }));

  const langStore = useLangStore();
  const t = translations[langStore.lang];

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
    peekPhaseEndTime,
    swappingCards,
    stickCard,
    giveCardToOpponent
  } = useGameStore();

  const { sendAction, syncGameState, loadGameState, initGameInDB } = useRealtimeGame({
    roomCode: code ?? '',
    roomId: lobbyInfo.roomId,
    myPlayerId: lobbyInfo.playerId,
    mySeat: lobbyInfo.seat,
    isHost: lobbyInfo.isHost,
  });

  // Bot Yapay Zekasını Başlat (sadece online değilse çalışır)
  useBotAI(isOnlineMode);

  const [cambioFlash, setCambioFlash] = useState(false);
  const [powerSelection, setPowerSelection] = useState<{ seat: number; pos: number; step: number } | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);

  const transitionPeekState = useGameStore(s => s.transitionPeekState);
  const peekSelectedPositions = useGameStore(s => s.peekSelectedPositions);
  const peekState = useGameStore(s => s.peekState);

  // Peek fazı: Seçimlerin tamamlanmasını dinleyen effect
  useEffect(() => {
    if (phase === 'peek' && peekState === 'select') {
      const everyoneReady = peekSelectedPositions.length >= players.filter(p => p.isOnline || !isOnlineMode).length * 2;
      if (everyoneReady) {
        if (!isOnlineMode || lobbyInfo.isHost) {
          transitionPeekState('highlight');
          if (isOnlineMode) sendAction({ type: 'PEEK_STATE_CHANGE', state: 'highlight' });
        }
      }
    }
  }, [phase, peekState, peekSelectedPositions.length, players, isOnlineMode, lobbyInfo.isHost, transitionPeekState, sendAction]);

  // Peek fazı: oyun mantığını garantileyen sağlam zamanlayıcı (Failsafe Timeout)
  useEffect(() => {
    if (phase === 'peek') {
      const msLeft = Math.max(0, (peekPhaseEndTime || Date.now()) - Date.now());
      const timer = setTimeout(() => {
        // Eğer online oyun ise state transition'ı sadece Host yapar ve broadcast eder
        if (isOnlineMode && !lobbyInfo.isHost) return;

        let nextState: any = null;
        if (peekState === 'dealing') nextState = 'starting';
        else if (peekState === 'starting') nextState = 'select';
        else if (peekState === 'select') return; // SEÇİM İÇİN SÜRE YOK, HERKES SEÇENE KADAR BEKLE
        else if (peekState === 'highlight') nextState = 'reveal';
        else if (peekState === 'reveal') {
          endPeekPhase();
          if (isOnlineMode && lobbyInfo.isHost) {
            syncGameState();
            sendAction({ type: 'PEEK_PHASE_END' });
          }
          return;
        }

        if (nextState) {
          transitionPeekState(nextState);
          if (isOnlineMode) sendAction({ type: 'PEEK_STATE_CHANGE', state: nextState });
        }

      }, msLeft);
      return () => clearTimeout(timer);
    }
  }, [phase, peekState, peekPhaseEndTime, endPeekPhase, transitionPeekState, isOnlineMode, lobbyInfo.isHost, syncGameState, sendAction]);

  useEffect(() => {
    if (cambioCaller !== null) {
      setCambioFlash(true);
      const timer = setTimeout(() => setCambioFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [cambioCaller]);

  useEffect(() => {
    if (isOnlineMode) {
      loadGameState();
    } else {
      initGame('Sen', ['Ahmet', 'Zeliha', 'Mehmet']);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const me = players.find(p => p.seat === lobbyInfo.seat);
  const myTurn = currentTurn === lobbyInfo.seat;
  const currentPlayer = players.find(p => p.seat === currentTurn);

  useEffect(() => {
    if (phase === 'stick_window') {
      const t = setTimeout(async () => {
        advanceTurn(useGameStore.getState());
        if (isOnlineMode && myTurn) await syncGameState();
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [phase, myTurn, isOnlineMode, syncGameState]);

  const doAction = useCallback((fn: () => void, event?: Parameters<typeof sendAction>[0]) => {
    fn();
    if (isOnlineMode && event) sendAction(event);
    if (isOnlineMode && myTurn) {
      setTimeout(() => syncGameState(), 100);
    }
  }, [isOnlineMode, myTurn, sendAction, syncGameState]);

  // endPeekPhase used directly where needed

  const handleUsePower = useCallback((targetSeat: number, targetPos: number, swapWith?: number) => {
    if (activePower) {
      doAction(
        () => usePower(activePower, targetSeat, targetPos, swapWith),
        { type: 'USE_POWER', power: activePower, targetSeat, targetPos, swapWith }
      );
    }
  }, [activePower, usePower, doAction]);

  // Yeni genel kart tıklama yöneticisi
  const handleCardClick = useCallback((seat: number, pos: number) => {
    if (phase === 'peek') {
      const peekState = useGameStore.getState().peekState;
      if (peekState !== 'select') return;
      if (seat !== lobbyInfo.seat) return; // Sadece kendi kartlarını seçebilir
      
      const state = useGameStore.getState();
      const me = state.players.find(p => p.seat === lobbyInfo.seat);
      if (!me) return;

      const mySelections = state.peekSelectedPositions.filter(p => p.playerId === me.id);
      if (mySelections.length >= 2) return;
      if (mySelections.find(s => s.pos === pos)) return; // zaten seçili

      useGameStore.setState(s => {
        s.peekSelectedPositions.push({ playerId: me.id, pos });
      });
      if (isOnlineMode) {
        sendAction({ type: 'PEEK_CARD_SELECT', seat, pos });
      }
      return;
    }

    if (phase === 'stick_window') {
      const topDiscard = discardPile[discardPile.length - 1];
      if (topDiscard) {
        doAction(() => stickCard(seat, pos, topDiscard.id, lobbyInfo.seat), {
          type: 'STICK_CARD',
          targetSeat: seat,
          position: pos,
          discardCardId: topDiscard.id,
          initiatorSeat: lobbyInfo.seat
        });
      }
      return;
    }

    if (phase === 'give_card') {
      if (seat === lobbyInfo.seat) {
        doAction(() => giveCardToOpponent(pos, lobbyInfo.seat), {
          type: 'GIVE_CARD',
          position: pos,
          initiatorSeat: lobbyInfo.seat
        });
      }
      return;
    }

    if (phase === 'action' && seat === lobbyInfo.seat && myTurn) {
      doAction(() => swapCard(pos), { type: 'SWAP_CARD', position: pos });
      return;
    }

    if (phase !== 'power' || !activePower || !myTurn) return;

    if (activePower === 'peek_own') {
      if (seat === lobbyInfo.seat) doAction(() => handleUsePower(seat, pos));
    } 
    else if (activePower === 'peek_other') {
      if (seat !== lobbyInfo.seat) doAction(() => handleUsePower(seat, pos));
    }
    else if (activePower === 'blind_swap') {
      if (!powerSelection) {
        if (seat === lobbyInfo.seat) setPowerSelection({ seat, pos, step: 1 });
      } else {
        if (seat !== lobbyInfo.seat) {
          doAction(() => handleUsePower(seat, pos, powerSelection.pos));
          setPowerSelection(null);
        }
      }
    }
    else if (activePower === 'spy_swap') {
      if (!powerSelection) {
        if (seat !== lobbyInfo.seat) {
          setPowerSelection({ seat, pos, step: 1 });
          // Hemen kartı göster (usePower'ı eksik argümanla çağırırsak sadece gösterir)
          doAction(() => handleUsePower(seat, pos));
        }
      } else {
        if (seat === lobbyInfo.seat) {
          doAction(() => handleUsePower(powerSelection.seat, powerSelection.pos, pos));
          setPowerSelection(null);
        }
      }
    }
  }, [phase, activePower, myTurn, lobbyInfo.seat, powerSelection, handleUsePower, doAction, discardPile, stickCard, giveCardToOpponent, swapCard]);

  return (
    <div className="min-h-screen flex flex-col p-3 gap-3 relative overflow-hidden">
      {!isOnlineMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1
                        bg-orange-900/40 border border-orange-500/30
                        rounded-full text-orange-300 text-xs pointer-events-none">
          {t.demoMode}
        </div>
      )}

      {/* Sağ Üst Butonlar (Dil ve Tam Ekran) */}
      <div className="absolute top-4 right-6 z-50 flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={langStore.toggleLang}
          className="px-4 py-3 bg-black/50 hover:bg-black/70 border-2 border-[var(--gold)]/40 rounded-full text-[var(--gold)] font-bold text-sm transition-colors shadow-2xl backdrop-blur-md cursor-pointer shrink-0 min-w-[80px]"
        >
          {langStore.lang === 'tr' ? 'EN' : 'TR'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.85, rotate: -3 }}
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              if (document.exitFullscreen) document.exitFullscreen();
            }
          }}
          className="px-6 py-3 bg-black/50 hover:bg-black/70 border-2 border-[var(--gold)]/40 rounded-full text-[var(--gold)] font-bold text-sm flex items-center gap-3 transition-colors shadow-2xl backdrop-blur-md cursor-pointer whitespace-nowrap shrink-0 justify-center min-w-[160px]"
          title="Tam Ekran (Aç/Kapat)"
        >
          <span className="tracking-widest">{t.fullScreen}</span>
          <span className="text-xl leading-none drop-shadow-[0_0_10px_rgba(212,168,67,1)]">⛶</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {cambioFlash && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/30 backdrop-blur-sm pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.h2
              className="text-8xl font-black text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)] tracking-widest font-['Cinzel']"
              initial={{ scale: 0.2, rotate: -10 }}
              animate={{ scale: 1.2, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.6 }}
            >
              CAMBIO!
            </motion.h2>
            {cambioCaller !== null && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-2 text-center text-red-500 text-[10px] uppercase tracking-widest font-bold"
              >
                {t.cambioRoundTurnsLeft(4 - currentTurn)}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1
        className="text-center font-['Cinzel'] text-2xl font-black tracking-widest shrink-0"
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

      <div className="flex flex-1 gap-8 px-8 mt-16 relative z-10">
        <div className="hidden lg:flex flex-col w-[320px] ml-12 shrink-0 z-50 gap-4">
          <div className="px-8 py-5 bg-black/60 border-2 border-[var(--gold)]/50 rounded-2xl flex items-center gap-4 backdrop-blur-md shadow-2xl whitespace-nowrap shrink-0">
            <span className="text-white/50 text-xs font-black uppercase tracking-[0.25em]">ODA KODU</span>
            <div className="h-5 w-px bg-white/30 shrink-0"></div>
            <span className="text-[var(--gold)] text-2xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(212,168,67,0.8)]">
              {code ?? 'DEMO'}
            </span>
          </div>
          <div className="flex-1 min-h-0 basis-1/2">
            <GameLog />
          </div>
          <div className="flex-1 min-h-0 basis-1/2">
            <ChatPanel 
              sendAction={sendAction} 
              myPlayerId={lobbyInfo.playerId} 
              myNickname={players.find(p => p.id === lobbyInfo.playerId)?.nickname || 'Oyuncu'} 
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div
            className="relative w-full rounded-[36px] flex-1 flex flex-col"
            style={{
              background: 'radial-gradient(ellipse at center, #1a7a55 0%, #0a5c40 50%, #063d2a 100%)',
              boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.3)',
              border: '2px solid rgba(212,168,67,0.25)',
              minHeight: '460px',
            }}
          >
            <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-4 w-max pointer-events-none">
              <GameBackgroundOverlay myPlayerId={lobbyInfo.playerId} />
            </div>
            
            <AnimatePresence>
              {phase === 'power' && activePower && (
                <motion.div
                  className="absolute top-[28%] left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center gap-4 w-max pointer-events-none"
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                >
                  <span className="text-[var(--gold)] text-4xl font-black tracking-widest uppercase drop-shadow-[0_0_20px_rgba(212,168,67,0.8)] text-center">
                    {myTurn ? (
                      <>
                        {activePower === 'peek_own' && t.banner_peek_own}
                        {activePower === 'peek_other' && t.banner_peek_other}
                        {activePower === 'spy_swap' && t.banner_spy_swap}
                        {activePower === 'blind_swap' && t.banner_blind_swap}
                      </>
                    ) : (
                      t.banner_opponent_power(currentPlayer?.nickname || '')
                    )}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center pt-5">
              {players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2) && (
                <PlayerArea 
                  player={players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2)!} 
                  position="top"
                  onCardClick={(pos) => handleCardClick(players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2)!.seat, pos)} 
                  highlightPositions={powerSelection?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2)!.seat ? [powerSelection.pos] : []}
                  drawnCard={drawnCard}
                />
              )}
            </div>

            <div className="flex flex-1 items-center justify-between px-8">
              {players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1) && (
                <PlayerArea 
                  player={players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1)!} 
                  position="left" 
                  onCardClick={(pos) => handleCardClick(players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1)!.seat, pos)}
                  highlightPositions={powerSelection?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1)!.seat ? [powerSelection.pos] : []}
                  drawnCard={drawnCard}
                />
              )}

              <div className="relative flex flex-col items-center">
                <CenterArea 
                  deckCount={deck.length} 
                  discardPile={discardPile}
                  canDraw={myTurn && phase === 'draw'}
                  onDrawFromDeck={() => doAction(() => drawFromDeck(), { type: 'DRAW_FROM_DECK' })}
                  onDrawFromDiscard={() => doAction(() => drawFromDiscard(), { type: 'DRAW_FROM_DISCARD' })}
                  myPlayerId={lobbyInfo.playerId}
                />

                <AnimatePresence>
                  {phase === 'power' && activePower && (
                    <motion.div
                      className="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4 w-max pointer-events-none"
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    >
                      <span className="text-white text-2xl font-bold drop-shadow-xl text-center bg-black/60 px-8 py-3 rounded-full border border-[var(--gold)]/30 backdrop-blur-md">
                        {myTurn ? (
                          <>
                            {activePower === 'peek_own' && t.hint_peek_own}
                            {activePower === 'peek_other' && t.hint_peek_other}
                            {activePower === 'spy_swap' && (!powerSelection ? t.hint_spy_swap_1 : t.hint_spy_swap_2)}
                            {activePower === 'blind_swap' && (!powerSelection ? t.hint_blind_swap_1 : t.hint_blind_swap_2)}
                          </>
                        ) : t.hint_waiting}
                      </span>
                      
                      {myTurn && activePower === 'spy_swap' && powerSelection && (
                        <div className="pointer-events-auto">
                          <motion.button
                            className="mt-2 px-8 py-3 bg-red-600 hover:bg-red-500 border-2 border-red-400 rounded-xl text-white font-black text-lg shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => doAction(() => skipPower(), { type: 'SKIP_POWER' })}
                          >
                            {t.hint_skip}
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}
                  {phase === 'give_card' && (
                    <motion.div
                      className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 w-max"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                    >
                      <span className="text-white/30 text-3xl font-black tracking-widest uppercase drop-shadow-xl text-center pointer-events-none">
                        {myTurn ? 'Doğru Bildin!' : `${currentPlayer?.nickname} Doğru Bildi!`}
                      </span>
                      <span className="text-white/40 text-base font-bold drop-shadow-md text-center pointer-events-none">
                        {myTurn ? 'Rakibe vermek için kendi kartlarından birini seç.' : 'Rakibe vermek için bir kart seçiyor...'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Takas (Swap) Animasyonu ─── */}
                <AnimatePresence>
                  {swappingCards && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none gap-8">
                      <GameCard card={swappingCards.card1} highlight className="!drop-shadow-[0_0_40px_rgba(212,168,67,1)] scale-125" />
                      <GameCard card={swappingCards.card2} highlight className="!drop-shadow-[0_0_40px_rgba(212,168,67,1)] scale-125" />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3) && (
                <PlayerArea 
                  player={players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3)!} 
                  position="right" 
                  onCardClick={(pos) => handleCardClick(players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3)!.seat, pos)}
                  highlightPositions={powerSelection?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3)!.seat ? [powerSelection.pos] : []}
                  drawnCard={drawnCard}
                />
              )}
            </div>

            {/* Alt: Sen */}
            <div className="flex flex-col items-center pb-5 gap-2">
              {me && (
                <PlayerArea
                  player={me}
                  position="bottom"
                  isMe
                  onCardClick={(pos) => handleCardClick(me.seat, pos)}
                  highlightPositions={
                    phase === 'give_card'
                      ? me.cards.map((_, i) => i) // give_card sırasında tüm kendi kartlarımız parlasın
                      : powerSelection?.seat === me.seat 
                        ? [powerSelection.pos] 
                        : []
                  }
                  drawnCard={drawnCard}
                  onDiscardDrawn={() => doAction(discardDrawn, { type: 'DISCARD_DRAWN' })}
                />
              )}
            </div>
          </div>

          {/* Alt Kontrol Çubuğu */}
          <div className="flex items-center gap-4 flex-wrap justify-center shrink-0 py-2">
            <TurnIndicator
              currentPlayerName={currentPlayer?.nickname ?? '—'}
              phase={phase}
              myTurn={myTurn}
            />

            {myTurn && phase === 'draw' && cambioCaller === null && (
              <motion.button
                className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-xl font-bold
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

            {phase === 'results' && (
              <motion.button
                className="px-6 py-2 bg-[var(--gold)] text-black font-bold rounded-xl shadow-[0_0_15px_rgba(212,168,67,0.5)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => useGameStore.getState().initGame('Sen', ['Ahmet', 'Zeliha', 'Mehmet'])}
              >
                🔄 Tekrar Oyna
              </motion.button>
            )}

            {/* 🛠 Reset — 5s geri sayımlı */}
            <motion.button
              className={`px-6 py-3 border rounded-xl text-xs font-mono transition-colors ${
                resetCountdown !== null
                  ? 'bg-red-900/60 border-red-500/60 text-red-300'
                  : 'bg-black/50 hover:bg-black/70 border border-white/20 text-white/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                if (resetCountdown !== null) return; // zaten sayiyor
                let count = 5;
                setResetCountdown(count);
                const interval = setInterval(() => {
                  count--;
                  if (count <= 0) {
                    clearInterval(interval);
                    setResetCountdown(null);
                    if (isOnlineMode) {
                      initGameInDB().then(() => loadGameState());
                    } else {
                      initGame('Sen', ['Ahmet', 'Zeliha', 'Mehmet']);
                    }
                  } else {
                    setResetCountdown(count);
                  }
                }, 1000);
              }}
              title="Oyunu sıfırla"
            >
              {resetCountdown !== null ? `⏳ ${resetCountdown}s’de reset...` : '🔄 Reset'}
            </motion.button>
          </div>
        </div>

        {/* SAĞ: Kural Tablosu ve Liderlik Tablosu */}
        <div className="hidden lg:flex w-[400px] shrink-0 flex-col gap-6 z-50">
          <RulesPanel />
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
