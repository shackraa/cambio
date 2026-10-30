import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useEffect, useCallback, useState, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore, advanceTurn } from '../store/useGameStore';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { PlayerArea } from '../components/PlayerArea';
import { CenterArea } from '../components/CenterArea';
import { TurnIndicator } from '../components/TurnIndicator';
import { ChatPanel } from '../components/ChatPanel';
import { GameLog } from '../components/GameLog';
import { RulesPanel } from '../components/RulesPanel';
import { GameBackgroundOverlay } from '../components/GameBackgroundOverlay';
import { Leaderboard } from '../components/Leaderboard';
import { ToastContainer } from '../components/ToastContainer';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';
import { useBotAI } from '../hooks/useBotAI';

export function GameBoard() {
  const { code } = useParams<{ code: string }>();

  const [lobbyInfo] = useState(() => ({
    playerId:  sessionStorage.getItem('playerId') ?? 'player-0',
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
    remainingTurns,
    peekPhaseEndTime,
    swappingCards,
    stickCard,
    giveCardToOpponent,
    lastSwappedPositions,
    turnCount,
    winner,
    finalScores,
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
  const [stickTimeLeft, setStickTimeLeft] = useState<number | null>(null);
  const [betweenHands, setBetweenHands] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(true);

  // Global sahne ölçeği
  const [stageScale, setStageScale] = useState(1);
  useLayoutEffect(() => {
    const updateScale = () => {
      const scaleW = window.innerWidth / 1920;
      const scaleH = window.innerHeight / 1080;
      setStageScale(Math.min(scaleW, scaleH));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const transitionPeekState = useGameStore(s => s.transitionPeekState);
  const peekSelectedPositions = useGameStore(s => s.peekSelectedPositions);
  const peekState = useGameStore(s => s.peekState);

  // Faz değiştiğinde geçici powerSelection temizlensin, results açılırsa modal gösterilsin
  useEffect(() => {
    if (phase !== 'power') {
      setPowerSelection(null);
    }
    if (phase === 'results') {
      setShowResultsModal(true);
    }
  }, [phase]);

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
        if (isOnlineMode && !lobbyInfo.isHost) return;

        let nextState: any = null;
        if (peekState === 'dealing') nextState = 'starting';
        else if (peekState === 'starting') nextState = 'select';
        else if (peekState === 'select') return; // Seçim için herkesin seçmesini bekle
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
      setStickTimeLeft(3);
      const interval = setInterval(() => {
        setStickTimeLeft(prev => {
          if (prev === null || prev <= 1) { clearInterval(interval); return null; }
          return prev - 1;
        });
      }, 1000);
      const timer = setTimeout(async () => {
        clearInterval(interval);
        setStickTimeLeft(null);
        // Eller arası kısa geçiş göstergesi
        setBetweenHands(true);
        setTimeout(async () => {
          setBetweenHands(false);
          advanceTurn(useGameStore.getState());
          if (isOnlineMode && myTurn) await syncGameState();
        }, 400);
      }, 3000);
      return () => { clearTimeout(timer); clearInterval(interval); setStickTimeLeft(null); };
    }
  }, [phase, myTurn, isOnlineMode, syncGameState]);

  const doAction = useCallback((fn: () => void, event?: Parameters<typeof sendAction>[0]) => {
    fn();
    if (isOnlineMode && event) sendAction(event);
    if (isOnlineMode && myTurn) {
      setTimeout(() => syncGameState(), 100);
    }
  }, [isOnlineMode, myTurn, sendAction, syncGameState]);

  const handleUsePower = useCallback((targetSeat: number, targetPos: number, swapWith?: number) => {
    if (activePower) {
      doAction(
        () => usePower(activePower, targetSeat, targetPos, swapWith),
        { type: 'USE_POWER', power: activePower, targetSeat, targetPos, swapWith }
      );
    }
  }, [activePower, usePower, doAction]);

  // Bir oyuncunun kartlarıyla şu an etkileşime girilip girilemeyeceğini hesapla (hover/click için)
  const canInteractWithSeat = useCallback((seat: number) => {
    const isMySeat = seat === lobbyInfo.seat;
    if (phase === 'peek') {
      return peekState === 'select' && isMySeat;
    }
    if (phase === 'stick_window') {
      return discardPile.length > 0;
    }
    if (phase === 'give_card') {
      return isMySeat;
    }
    if (phase === 'action' && myTurn) {
      return isMySeat;
    }
    if (phase === 'power' && activePower && myTurn) {
      if (activePower === 'peek_own') return isMySeat;
      if (activePower === 'peek_other') return !isMySeat;
      if (activePower === 'blind_swap') return !powerSelection ? isMySeat : !isMySeat;
      if (activePower === 'spy_swap') return !powerSelection ? !isMySeat : isMySeat;
    }
    return false;
  }, [phase, peekState, lobbyInfo.seat, discardPile.length, myTurn, activePower, powerSelection]);

  // Genel kart tıklama yöneticisi
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
      if (seat === lobbyInfo.seat) handleUsePower(seat, pos);
    } 
    else if (activePower === 'peek_other') {
      if (seat !== lobbyInfo.seat) handleUsePower(seat, pos);
    }
    else if (activePower === 'blind_swap') {
      if (!powerSelection) {
        if (seat === lobbyInfo.seat) setPowerSelection({ seat, pos, step: 1 });
      } else {
        if (seat !== lobbyInfo.seat) {
          handleUsePower(seat, pos, powerSelection.pos);
          setPowerSelection(null);
        } else {
          // Fikrini değiştirip kendi başka bir kartını seçerse
          setPowerSelection({ seat, pos, step: 1 });
        }
      }
    }
    else if (activePower === 'spy_swap') {
      if (!powerSelection) {
        if (seat !== lobbyInfo.seat) {
          setPowerSelection({ seat, pos, step: 1 });
          // Hemen kartı göster (usePower'ı eksik argümanla çağırırsak sadece gösterir)
          handleUsePower(seat, pos);
        }
      } else {
        if (seat === lobbyInfo.seat) {
          handleUsePower(powerSelection.seat, powerSelection.pos, pos);
          setPowerSelection(null);
        }
      }
    }
  }, [phase, activePower, myTurn, lobbyInfo.seat, powerSelection, handleUsePower, doAction, discardPile, stickCard, giveCardToOpponent, swapCard, isOnlineMode, sendAction]);

  const getSwapHighlightsForSeat = (seat: number) =>
    lastSwappedPositions.filter(p => p.seat === seat).map(p => p.pos);

  const topPlayer = players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2);
  const leftPlayer = players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1);
  const rightPlayer = players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3);
  const winnerPlayer = winner !== null ? players.find(p => p.seat === winner) : null;

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden bg-[#020806] relative">
      <ToastContainer />

      {/* Eller arası geçiş overlay */}
      <AnimatePresence>
        {betweenHands && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="text-center"
            >
              <div className="text-[var(--gold)] text-2xl font-black tracking-widest drop-shadow-[0_0_20px_rgba(212,168,67,0.8)]">{t.passingTurn}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cambioFlash && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-sm pointer-events-none"
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
                className="mt-4 text-center text-red-300 text-lg uppercase tracking-widest font-bold bg-black/60 px-6 py-2 rounded-full border border-red-500/40"
              >
                {t.cambioRoundTurnsLeft(remainingTurns)}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Oyun Sonu Kazanan Kutlama Modalı */}
      <AnimatePresence>
        {phase === 'results' && showResultsModal && (
          <motion.div
            className="fixed inset-0 z-[180] flex items-center justify-center bg-black/65 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-lg rounded-3xl p-8 flex flex-col items-center text-center border-2 border-[var(--gold)]/60 shadow-[0_0_80px_rgba(212,168,67,0.35)]"
              style={{
                background: 'radial-gradient(ellipse at top, #133b2b 0%, #071912 100%)',
              }}
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <div className="text-5xl mb-2">🏆</div>
              <h2 className="text-3xl font-black text-[var(--gold)] tracking-widest uppercase font-['Cinzel']">
                {winnerPlayer ? `${winnerPlayer.nickname} KAZANDI!` : 'EL BİTTİ!'}
              </h2>
              <p className="text-white/50 text-xs uppercase tracking-widest mt-1 mb-6">
                En düşük puanla eli tamamladı
              </p>

              <div className="w-full space-y-2.5 mb-7">
                {[...finalScores]
                  .sort((a, b) => a.score - b.score)
                  .map((fs, idx) => {
                    const p = players.find(pl => pl.seat === fs.seat);
                    const isWin = fs.seat === winner;
                    return (
                      <div
                        key={fs.seat}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                          isWin
                            ? 'bg-[var(--gold)]/20 border-[var(--gold)] text-white shadow-[0_0_20px_rgba(212,168,67,0.25)]'
                            : 'bg-black/40 border-white/10 text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            isWin ? 'bg-[var(--gold)] text-black' : 'bg-white/10 text-white/60'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-sm">{p?.nickname ?? `Oyuncu ${fs.seat}`}</span>
                          {fs.calledCambio && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              fs.cambioModifier === -10
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {fs.cambioModifier === -10 ? 'CAMBIO (-10)' : 'CAMBIO (+10)'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {fs.cambioModifier !== 0 && fs.baseScore !== undefined && (
                            <span className="text-xs text-white/40 line-through">{fs.baseScore}</span>
                          )}
                          <span className="text-lg font-black text-[var(--gold)]">{fs.score} pt</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Masayı İncele
                </button>
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    if (isOnlineMode) {
                      initGameInDB().then(() => loadGameState());
                    } else {
                      initGame('Sen', ['Ahmet', 'Zeliha', 'Mehmet']);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-black text-black text-sm shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96c)' }}
                >
                  {t.playAgain}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1920x1080 Scalable Stage */}
      <div 
        className="absolute top-1/2 left-1/2 origin-center shrink-0 flex flex-col p-8 gap-4"
        style={{
          width: '1920px',
          height: '1080px',
          transform: `translate(-50%, -50%) scale(${stageScale})`
        }}
      >
        {/* Sağ Üst Butonlar */}
        <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.0 }}
            onClick={langStore.toggleLang}
            className="px-4 py-3 bg-black/50 hover:bg-black/70 border-2 border-[var(--gold)]/40 rounded-full text-[var(--gold)] font-bold text-sm transition-colors shadow-2xl backdrop-blur-md cursor-pointer shrink-0 min-w-[80px]"
          >
            {t.chooseLanguage}
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

        <motion.div
          className="flex flex-col items-center gap-1 shrink-0 mt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-md font-['Cinzel']">
            CAMBIO
          </h1>
          <p className="text-emerald-400 text-sm tracking-widest uppercase font-bold">
            THE CARD GAME
          </p>
        </motion.div>

      <div className="flex flex-1 min-h-0 gap-8 px-8 relative z-10">
        <div className="hidden lg:flex flex-col w-[320px] ml-12 shrink-0 z-50 gap-4">
          <div className="px-8 py-5 bg-[#0A1F17]/80 border border-emerald-500/10 rounded-[2rem] flex items-center gap-4 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] whitespace-nowrap shrink-0">
            <span className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em]">ODA KODU</span>
            <div className="h-5 w-px bg-white/10 shrink-0"></div>
            <span className="text-emerald-400 text-2xl font-black tracking-[0.2em] drop-shadow-md">
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

        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <LayoutGroup id="cards">
          <div
            className="relative w-full rounded-[36px] flex-1 min-h-0 flex flex-col justify-between"
            style={{
              background: 'radial-gradient(ellipse at center, #1a7a55 0%, #084d35 60%, #04261a 100%)',
              boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 150px rgba(0,0,0,0.9)',
              border: '2px solid rgba(212,168,67,0.15)',
              minHeight: '300px',
            }}
          >
            <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-4 w-max pointer-events-none">
              <GameBackgroundOverlay myPlayerId={me?.id ?? lobbyInfo.playerId} />
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

            {/* ─── Grid Layout: 3 satır × 3 sütun ─── */}
            <div
              className="flex-1 min-h-0 grid px-3 py-3"
              style={{ gridTemplateRows: 'auto auto auto', gridTemplateColumns: 'auto 1fr auto', alignContent: 'space-between' }}
            >
              {/* Üst orta: Karşı oyuncu */}
              <div className="col-start-2 row-start-1 flex justify-center items-start">
                {topPlayer && (
                  <PlayerArea
                    player={topPlayer}
                    position="top"
                    canInteract={canInteractWithSeat(topPlayer.seat)}
                    onCardClick={(pos) => handleCardClick(topPlayer.seat, pos)}
                    highlightPositions={powerSelection?.seat === topPlayer.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={getSwapHighlightsForSeat(topPlayer.seat)}
                    drawnCard={drawnCard}
                  />
                )}
              </div>

              {/* Sol: Ahmet */}
              <div className="col-start-1 row-start-2 flex items-center">
                {leftPlayer && (
                  <PlayerArea
                    player={leftPlayer}
                    position="left"
                    canInteract={canInteractWithSeat(leftPlayer.seat)}
                    onCardClick={(pos) => handleCardClick(leftPlayer.seat, pos)}
                    highlightPositions={powerSelection?.seat === leftPlayer.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={getSwapHighlightsForSeat(leftPlayer.seat)}
                    drawnCard={drawnCard}
                  />
                )}
              </div>

              {/* Merkez: Deste + Çöp */}
              <div className="col-start-2 row-start-2 flex items-center justify-center">
              <div className="relative flex flex-col items-center">
                <CenterArea 
                  deck={deck}
                  discardPile={discardPile}
                  canDraw={myTurn && phase === 'draw'}
                  onDrawFromDeck={() => doAction(() => drawFromDeck(), { type: 'DRAW_FROM_DECK' })}
                  onDrawFromDiscard={() => doAction(() => drawFromDiscard(), { type: 'DRAW_FROM_DISCARD' })}
                  myPlayerId={lobbyInfo.playerId}
                />

                <AnimatePresence>
                  {phase === 'power' && activePower && (
                    <motion.div
                      className="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 w-max pointer-events-none"
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    >
                      <span className="text-white text-xl font-bold drop-shadow-xl text-center bg-black/70 px-7 py-2.5 rounded-full border border-[var(--gold)]/40 backdrop-blur-md">
                        {myTurn ? (
                          <>
                            {activePower === 'peek_own' && t.hint_peek_own}
                            {activePower === 'peek_other' && t.hint_peek_other}
                            {activePower === 'spy_swap' && (!powerSelection ? t.hint_spy_swap_1 : t.hint_spy_swap_2)}
                            {activePower === 'blind_swap' && (!powerSelection ? t.hint_blind_swap_1 : t.hint_blind_swap_2)}
                          </>
                        ) : t.hint_waiting}
                      </span>
                      
                      {myTurn && (activePower === 'blind_swap' || (activePower === 'spy_swap' && powerSelection)) && (
                        <div className="pointer-events-auto">
                          <motion.button
                            className="mt-1 px-6 py-2.5 bg-red-600/90 hover:bg-red-500 border-2 border-red-400 rounded-xl text-white font-black text-sm shadow-[0_0_20px_rgba(220,38,38,0.6)] cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setPowerSelection(null);
                              doAction(() => skipPower(), { type: 'SKIP_POWER' });
                            }}
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
                      <span className="text-[var(--gold)] text-3xl font-black tracking-widest uppercase drop-shadow-xl text-center pointer-events-none">
                        {myTurn ? 'Doğru Bildin!' : `${currentPlayer?.nickname} Doğru Bildi!`}
                      </span>
                      <span className="text-white/80 text-base font-bold bg-black/60 px-5 py-1.5 rounded-full border border-white/15 drop-shadow-md text-center pointer-events-none">
                        {myTurn ? 'Rakibe vermek için kendi kartlarından birini seç.' : 'Rakibe vermek için bir kart seçiyor...'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Swap tamamlandığında hafif gösterge */}
                <AnimatePresence>
                  {swappingCards && (
                    <motion.div
                      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1.1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.35 }}
                    >
                      <span className="text-[var(--gold)] text-6xl font-black drop-shadow-[0_0_25px_rgba(212,168,67,0.95)]">⇄</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>{/* merkez div kapanışı */}

              {/* Sağ: Mehmet */}
              <div className="col-start-3 row-start-2 flex items-center">
                {rightPlayer && (
                  <PlayerArea
                    player={rightPlayer}
                    position="right"
                    canInteract={canInteractWithSeat(rightPlayer.seat)}
                    onCardClick={(pos) => handleCardClick(rightPlayer.seat, pos)}
                    highlightPositions={powerSelection?.seat === rightPlayer.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={getSwapHighlightsForSeat(rightPlayer.seat)}
                    drawnCard={drawnCard}
                  />
                )}
              </div>

              {/* Alt orta: Sen */}
              <div className="col-start-2 row-start-3 flex flex-col items-center justify-end gap-2 pb-2">
              {me && (
                <PlayerArea
                  player={me}
                  position="bottom"
                  isMe
                  canInteract={canInteractWithSeat(me.seat)}
                  onCardClick={(pos) => handleCardClick(me.seat, pos)}
                  highlightPositions={
                    phase === 'give_card'
                      ? me.cards.map((_, i) => i)
                      : powerSelection?.seat === me.seat
                        ? [powerSelection.pos]
                        : []
                  }
                  swapHighlightPositions={getSwapHighlightsForSeat(me.seat)}
                  drawnCard={drawnCard}
                  onDiscardDrawn={() => doAction(discardDrawn, { type: 'DISCARD_DRAWN' })}
                />
              )}
              </div>{/* alt orta div kapanışı */}
            </div>{/* grid kapanışı */}
          </div>{/* yeşil masa kapanışı */}
          </LayoutGroup>

          <div className="shrink-0 rounded-[2rem] bg-[#0A1F17]/80 backdrop-blur-2xl border border-emerald-500/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] py-3">
            <TurnIndicator
              currentPlayerName={currentPlayer?.nickname ?? '—'}
              phase={phase}
              myTurn={myTurn}
              timeLeft={stickTimeLeft ?? undefined}
              cambioCaller={cambioCaller}
              turnCount={turnCount ?? 0}
              onCallCambio={() => doAction(callCambio, { type: 'CALL_CAMBIO', seat: lobbyInfo.seat })}
              onReset={async () => {
                if (resetCountdown !== null) return;
                let count = 3;
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
              resetCountdown={resetCountdown}
              onPlayAgain={() => {
                if (isOnlineMode) {
                  initGameInDB().then(() => loadGameState());
                } else {
                  useGameStore.getState().initGame('Sen', ['Ahmet', 'Zeliha', 'Mehmet']);
                }
              }}
            />
          </div>
        </div>

        {/* SAĞ: Kural Tablosu ve Liderlik Tablosu */}
        <div className="hidden lg:flex w-[400px] shrink-0 flex-col gap-6 z-50">
          <RulesPanel />
          <Leaderboard />
        </div>
      </div>
      </div>
    </div>
  );
}
