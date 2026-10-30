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
import { SoundManager } from '../utils/SoundManager';

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

  useEffect(() => {
    document.documentElement.lang = langStore.lang;
  }, [langStore.lang]);

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
  const [isMuted, setIsMuted] = useState(() => SoundManager.getMuted());

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
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden relative"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #166847 0%, #0b3c29 60%, #062317 100%)',
      }}
    >
      <ToastContainer />

      {/* Eller arası geçiş overlay */}
      <AnimatePresence>
        {betweenHands && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-emerald-950/35 backdrop-blur-[2px] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/55 backdrop-blur-md pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center px-14 py-8 rounded-3xl border border-[var(--gold)]/60"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(16, 68, 46, 0.96) 0%, rgba(7, 30, 20, 0.98) 100%)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 50px rgba(212,168,67,0.35)',
              }}
              initial={{ scale: 0.75, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <span className="text-xs font-extrabold uppercase tracking-[0.35em] text-[var(--gold)] mb-2">
                {langStore.lang === 'tr' ? 'SON TUR ÇAĞRISI' : 'FINAL ROUND CALLED'}
              </span>
              <h2
                className="text-7xl font-black tracking-[0.18em] font-['Cinzel'] text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #fffdf5 0%, #f0c96c 50%, #d4a843 100%)',
                  filter: 'drop-shadow(0 4px 20px rgba(212,168,67,0.5))',
                }}
              >
                CAMBIO
              </h2>
              {cambioCaller !== null && (
                <div className="mt-4 text-center text-white/85 text-xs uppercase tracking-[0.2em] font-bold bg-white/[0.06] px-5 py-2 rounded-full border border-white/15">
                  {t.cambioRoundTurnsLeft(remainingTurns)}
                </div>
              )}
            </motion.div>
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
              className="relative w-full max-w-lg rounded-3xl p-8 flex flex-col items-center text-center border border-[var(--gold)]/50 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
              style={{
                background: 'radial-gradient(ellipse at top, #133b2b 0%, #071912 100%)',
              }}
              initial={{ scale: 0.85, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--gold)]/15 border border-[var(--gold)]/40 flex items-center justify-center text-2xl mb-3">
                🏆
              </div>
              <h2 className="text-3xl font-black text-[var(--gold)] tracking-widest uppercase font-['Cinzel']">
                {winnerPlayer
                  ? langStore.lang === 'tr'
                    ? `${winnerPlayer.nickname} KAZANDI!`
                    : `${winnerPlayer.nickname} WINS!`
                  : langStore.lang === 'tr'
                    ? 'EL BİTTİ!'
                    : 'HAND OVER!'}
              </h2>
              <p className="text-white/50 text-xs uppercase tracking-widest mt-1 mb-6">
                {langStore.lang === 'tr'
                  ? 'En düşük puanla eli tamamladı'
                  : 'Finished the hand with the lowest score'}
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
                            ? 'bg-[var(--gold)]/18 border-[var(--gold)] text-white'
                            : 'bg-white/[0.04] border-white/10 text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                            isWin ? 'bg-[var(--gold)] text-black' : 'bg-white/10 text-white/60'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-sm">{p?.nickname ?? `Oyuncu ${fs.seat}`}</span>
                          {fs.calledCambio && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
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
                            <span className="text-xs text-white/40 line-through font-mono">{fs.baseScore}</span>
                          )}
                          <span className="text-base font-black font-mono text-[var(--gold)]">{fs.score} pt</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {langStore.lang === 'tr' ? 'Masayı İncele' : 'Inspect Table'}
                </button>
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    if (isOnlineMode) {
                      initGameInDB().then(() => loadGameState());
                    } else {
                      initGame(langStore.lang === 'tr' ? 'Sen' : 'You', ['Ahmet', 'Zeliha', 'Mehmet']);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-black text-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
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
        {/* Sağ Üst Kontroller: Ses Aç/Kapat + TR/EN Dil Seçici + Tam Ekran */}
        <div className="absolute top-7 right-8 z-50 flex items-center gap-2.5">
          {/* Ses Aç / Kapat */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = SoundManager.toggleMute();
              setIsMuted(nextMuted);
            }}
            className="btn-emerald-3d h-10 px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer"
            title={isMuted ? (langStore.lang === 'tr' ? 'Sesi Aç' : 'Unmute') : (langStore.lang === 'tr' ? 'Sesi Kapat' : 'Mute')}
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
            <span className="text-[11px] uppercase tracking-wider">
              {isMuted
                ? langStore.lang === 'tr' ? 'Sessiz' : 'Muted'
                : langStore.lang === 'tr' ? 'Ses' : 'Audio'}
            </span>
          </button>

          {/* Segmented TR | EN Dil Seçici */}
          <div className="luxury-panel h-10 p-1 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => langStore.setLang('tr')}
              className={`h-full px-3 rounded-lg text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
                langStore.lang === 'tr'
                  ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black shadow-xs'
                  : 'text-emerald-100/65 hover:text-white'
              }`}
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => langStore.setLang('en')}
              className={`h-full px-3 rounded-lg text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
                langStore.lang === 'en'
                  ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black shadow-xs'
                  : 'text-emerald-100/65 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Tam Ekran */}
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                if (document.exitFullscreen) document.exitFullscreen();
              }
            }}
            className="btn-emerald-3d h-10 px-4 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap"
            title={t.fullScreen}
          >
            <span className="tracking-wider uppercase text-[11px]">{t.fullScreen}</span>
            <span className="text-sm leading-none text-[var(--gold-light)]">⛶</span>
          </button>
        </div>

        {/* Üst Başlık: Kraliyet CAMBIO Arması (Royal Crest Header) */}
        <motion.div
          className="flex flex-col items-center shrink-0 mt-1"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="relative flex items-center gap-4 px-8 py-2 rounded-full border border-[var(--gold)]/45"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(16, 68, 46, 0.92) 0%, rgba(7, 30, 20, 0.96) 100%)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            {/* Sol Süs Arması */}
            <div className="flex items-center gap-1.5 text-[var(--gold)]">
              <span className="text-xs opacity-60">♦</span>
              <span className="text-sm">♠</span>
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-[var(--gold)]" />
            </div>

            <div className="flex flex-col items-center">
              <h1
                className="text-3xl font-black tracking-[0.26em] font-['Cinzel'] text-transparent bg-clip-text leading-none"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #fffdf7 0%, #fae19c 45%, #d4a843 85%, #9e731c 100%)',
                  filter: 'drop-shadow(0 2px 10px rgba(212,168,67,0.35))',
                }}
              >
                CAMBIO
              </h1>
              <span className="text-[9px] text-emerald-200/65 tracking-[0.34em] uppercase font-extrabold mt-1">
                {langStore.lang === 'tr' ? 'ROYAL TABLE EDITION' : 'ROYAL TABLE EDITION'}
              </span>
            </div>

            {/* Sağ Süs Arması */}
            <div className="flex items-center gap-1.5 text-[var(--gold)]">
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-[var(--gold)]" />
              <span className="text-sm">♥</span>
              <span className="text-xs opacity-60">♣</span>
            </div>
          </div>
        </motion.div>

      <div className="flex flex-1 min-h-0 gap-6 px-8 relative z-10">
        <div className="hidden lg:flex flex-col w-[320px] shrink-0 z-50 gap-4 min-h-0">
          <div className="luxury-panel px-5 py-3.5 rounded-[22px] flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-emerald-100/80 text-xs font-bold uppercase tracking-[0.14em]">
                {langStore.lang === 'tr' ? 'ODA KODU' : 'ROOM CODE'}
              </span>
            </div>
            <span className="px-3.5 py-1 rounded-xl bg-black/45 border border-[var(--gold)]/40 text-[var(--gold-light)] text-sm font-black font-['JetBrains_Mono'] tracking-[0.18em] shadow-inner">
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
              myNickname={players.find(p => p.id === lobbyInfo.playerId)?.nickname || (langStore.lang === 'tr' ? 'Oyuncu' : 'Player')} 
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <LayoutGroup id="cards">
          <div
            className="relative w-full rounded-[36px] flex-1 min-h-0 flex flex-col justify-between"
            style={{
              background: 'radial-gradient(ellipse at center, #228b62 0%, #115e40 60%, #093826 100%)',
              boxShadow: '0 16px 50px rgba(0,0,0,0.45), inset 0 0 80px rgba(0,0,0,0.35)',
              border: '2px solid rgba(212,168,67,0.3)',
              minHeight: '300px',
            }}
          >
            <div className="absolute top-[31.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-3 w-max pointer-events-none">
              <GameBackgroundOverlay myPlayerId={me?.id ?? lobbyInfo.playerId} />
            </div>
            
            <AnimatePresence>
              {phase === 'power' && activePower && (
                <motion.div
                  className="absolute top-[31.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] flex flex-col items-center gap-3 w-max pointer-events-none"
                  initial={{ opacity: 0, scale: 0.94, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <span className="px-6 py-2.5 rounded-3xl bg-emerald-950/35 backdrop-blur-md border border-[var(--gold)]/25 text-[var(--gold-light)] text-2xl font-bold tracking-[0.14em] uppercase shadow-[0_10px_30px_rgba(0,0,0,0.28)] text-center">
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
                        {myTurn
                          ? langStore.lang === 'tr' ? 'Doğru Bildin!' : 'Great Stick!'
                          : langStore.lang === 'tr' ? `${currentPlayer?.nickname} Doğru Bildi!` : `${currentPlayer?.nickname} Stuck a Card!`}
                      </span>
                      <span className="text-white/85 text-sm font-bold bg-black/65 px-5 py-2 rounded-full border border-white/15 drop-shadow-md text-center pointer-events-none">
                        {myTurn ? t.hint_give_card : t.hint_waiting}
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

          <div className="luxury-panel shrink-0 rounded-[24px] px-4 py-2.5">
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
        <div className="hidden lg:flex w-[380px] shrink-0 flex-col gap-4 z-50 min-h-0">
          <RulesPanel />
          <Leaderboard />
        </div>
      </div>
      </div>
    </div>
  );
}
