import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useEffect, useCallback, useState, useLayoutEffect } from 'react';
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
import { ToastContainer } from '../components/ToastContainer';
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
    giveCardToOpponent,
    lastSwappedPosition,
    turnCount,
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
      setStickTimeLeft(5);
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
        }, 800);
      }, 5000);
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
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden bg-[#020806] relative">
      <ToastContainer />

      {/* Eller arası geçiş overlay */}
      <AnimatePresence>
        {betweenHands && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="text-center"
            >
              <div className="text-[var(--gold)] text-3xl font-black tracking-widest mb-2">{t.passingTurn}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* 1920x1080 Scalable Stage */}
      <div 
        className="relative origin-center shrink-0 flex flex-col p-8 gap-4"
        style={{
          width: '1920px',
          height: '1080px',
          transform: `scale(${stageScale})`
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

            {/* ─── Grid Layout: 3 satır × 3 sütun ─── */}
            <div
              className="flex-1 min-h-0 grid px-3 py-3"
              style={{ gridTemplateRows: 'auto auto auto', gridTemplateColumns: 'auto 1fr auto', alignContent: 'space-between' }}
            >
              {/* Üst orta: Karşı oyuncu */}
              <div className="col-start-2 row-start-1 flex justify-center items-start">
                {players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2) && (
                  <PlayerArea
                    player={players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2)!}
                    position="top"
                    onCardClick={(pos) => handleCardClick(players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2)!.seat, pos)}
                    highlightPositions={powerSelection?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2)!.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={
                      lastSwappedPosition?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 2)!.seat
                        ? [lastSwappedPosition.pos] : []
                    }
                    drawnCard={drawnCard}
                  />
                )}
              </div>

              {/* Sol: Ahmet */}
              <div className="col-start-1 row-start-2 flex items-center">
                {players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1) && (
                  <PlayerArea
                    player={players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1)!}
                    position="left"
                    onCardClick={(pos) => handleCardClick(players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1)!.seat, pos)}
                    highlightPositions={powerSelection?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1)!.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={
                      lastSwappedPosition?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 1)!.seat
                        ? [lastSwappedPosition.pos] : []
                    }
                    drawnCard={drawnCard}
                  />
                )}
              </div>

              {/* Merkez: Deste + Çöp */}
              <div className="col-start-2 row-start-2 flex items-center justify-center">
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

                {/* Swap tamamlandığında hafif gösterge */}
                <AnimatePresence>
                  {swappingCards && (
                    <motion.div
                      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-[var(--gold)] text-5xl font-black drop-shadow-[0_0_20px_rgba(212,168,67,0.8)]">⇄</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>{/* merkez div kapanışı */}

              {/* Sağ: Mehmet */}
              <div className="col-start-3 row-start-2 flex items-center">
                {players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3) && (
                  <PlayerArea
                    player={players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3)!}
                    position="right"
                    onCardClick={(pos) => handleCardClick(players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3)!.seat, pos)}
                    highlightPositions={powerSelection?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3)!.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={
                      lastSwappedPosition?.seat === players.find(p => (p.seat - lobbyInfo.seat + 4) % 4 === 3)!.seat
                        ? [lastSwappedPosition.pos] : []
                    }
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
                  onCardClick={(pos) => handleCardClick(me.seat, pos)}
                  highlightPositions={
                    phase === 'give_card'
                      ? me.cards.map((_, i) => i)
                      : powerSelection?.seat === me.seat
                        ? [powerSelection.pos]
                        : []
                  }
                  swapHighlightPositions={
                    lastSwappedPosition?.seat === me.seat ? [lastSwappedPosition.pos] : []
                  }
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
              resetCountdown={resetCountdown}
              onPlayAgain={() => useGameStore.getState().initGame('Sen', ['Ahmet', 'Zeliha', 'Mehmet'])}
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
