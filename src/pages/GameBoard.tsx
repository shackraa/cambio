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
import { useToastStore } from '../store/useToastStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';
import { useBotAI } from '../hooks/useBotAI';
import { SoundManager } from '../utils/SoundManager';
import { CustomizationModal } from '../components/CustomizationModal';
import { useCustomizationStore } from '../store/useCustomizationStore';
import { StickFeedbackBanner } from '../components/StickFeedbackBanner';
import { formatPlayerName } from '../utils/formatPlayerName';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';

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

  // Oyun açıkken telefon/tablet ekranının kararmasını ve kapanmasını önle
  useScreenWakeLock();

  useEffect(() => {
    document.documentElement.lang = langStore.lang;
  }, [langStore.lang]);

  const isOnlineMode = lobbyInfo.roomId !== '';

  // Granüler Zustand selector'ları: Sohbet veya Hamle Logu güncellendiğinde masa ve kartlar asla gereksiz re-render olmaz!
  const phase = useGameStore((s) => s.phase);
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const drawnCard = useGameStore((s) => s.drawnCard);
  const discardPile = useGameStore((s) => s.discardPile);
  const deck = useGameStore((s) => s.deck);
  const activePower = useGameStore((s) => s.activePower);
  const initGame = useGameStore((s) => s.initGame);
  const endPeekPhase = useGameStore((s) => s.endPeekPhase);
  const drawFromDeck = useGameStore((s) => s.drawFromDeck);
  const drawFromDiscard = useGameStore((s) => s.drawFromDiscard);
  const swapCard = useGameStore((s) => s.swapCard);
  const discardDrawn = useGameStore((s) => s.discardDrawn);
  const usePower = useGameStore((s) => s.usePower);
  const skipPower = useGameStore((s) => s.skipPower);
  const callCambio = useGameStore((s) => s.callCambio);
  const cambioCaller = useGameStore((s) => s.cambioCaller);
  const remainingTurns = useGameStore((s) => s.remainingTurns);
  const peekPhaseEndTime = useGameStore((s) => s.peekPhaseEndTime);
  const swappingCards = useGameStore((s) => s.swappingCards);
  const stickCard = useGameStore((s) => s.stickCard);
  const giveCardToOpponent = useGameStore((s) => s.giveCardToOpponent);
  const lastSwappedPositions = useGameStore((s) => s.lastSwappedPositions);
  const turnCount = useGameStore((s) => s.turnCount);
  const winner = useGameStore((s) => s.winner);
  const finalScores = useGameStore((s) => s.finalScores);

  const { sendAction, syncGameState, loadGameState, initGameInDB } = useRealtimeGame({
    roomCode: code ?? '',
    roomId: lobbyInfo.roomId,
    myPlayerId: lobbyInfo.playerId,
    mySeat: lobbyInfo.seat,
    isHost: lobbyInfo.isHost,
  });

  // Bot Yapay Zekasını Başlat (Lokal modda tüm botlar, Online odada ise Host cihazdaki bot koltukları için çalışır)
  useBotAI(isOnlineMode, lobbyInfo.isHost, sendAction, syncGameState);

  const [cambioFlash, setCambioFlash] = useState(false);
  const [powerSelection, setPowerSelection] = useState<{ seat: number; pos: number; step: number } | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);
  const [stickTimeLeft, setStickTimeLeft] = useState<number | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(true);
  const [isMuted, setIsMuted] = useState(() => SoundManager.getMuted());
  const [showCustomize, setShowCustomize] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<'log' | 'chat' | 'rules' | 'leaderboard' | null>(null);
  const tableTheme = useCustomizationStore(s => s.tableTheme);

  const TABLE_THEME_GRADIENTS = {
    emerald:  'radial-gradient(ellipse at center, #2b7a60 0%, #1b5643 62%, #123b2e 100%)',
    ocean:    'radial-gradient(ellipse at center, #24608a 0%, #164060 62%, #0e2a40 100%)',
    burgundy: 'radial-gradient(ellipse at center, #73293b 0%, #4d1a27 62%, #331019 100%)',
  };

  // Masaüstü / Mobil / Tam Ekran sığdırma ve duyarlı kart boyutlandırması
  const [layoutMetrics, setLayoutMetrics] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isFs = typeof document !== 'undefined' && Boolean(document.fullscreenElement);
    const isUltraCompact = h < 560 || w < 600;
    const isCompact = !isUltraCompact && (h < 680 || w < 960);
    // Masadaki TÜM kartlar (Sen, Zeliha, Ahmet, Mehmet ve Orta Deste) tamamen eşit ve dolgun 'lg' boyuttadır!
    const cardSize: 'xs' | 'sm' | 'md' | 'lg' = isUltraCompact ? 'xs' : isCompact ? 'sm' : 'lg';
    return {
      isDesktop: w >= 1024 && h >= 600,
      isCompact,
      isUltraCompact,
      cardSize,
      hideMobileTabBar: isFs || h < 580,
    };
  });

  useLayoutEffect(() => {
    const updateLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isFs = Boolean(document.fullscreenElement);
      const isUltraCompact = h < 560 || w < 600;
      const isCompact = !isUltraCompact && (h < 680 || w < 960);
      const cardSize: 'xs' | 'sm' | 'md' | 'lg' = isUltraCompact ? 'xs' : isCompact ? 'sm' : 'lg';
      setLayoutMetrics({
        isDesktop: w >= 1024 && h >= 600,
        isCompact,
        isUltraCompact,
        cardSize,
        hideMobileTabBar: isFs || h < 580,
      });
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    document.addEventListener('fullscreenchange', updateLayout);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
      document.removeEventListener('fullscreenchange', updateLayout);
    };
  }, []);

  const { isDesktop, isCompact, isUltraCompact, cardSize, hideMobileTabBar } = layoutMetrics;

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
      const savedNick = sessionStorage.getItem('nickname') || (langStore.lang === 'tr' ? 'Sen' : 'You');
      initGame(savedNick, ['Ahmet', 'Zeliha', 'Mehmet']);
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
        advanceTurn(useGameStore.getState());
        if (isOnlineMode && myTurn) await syncGameState();
      }, 3000);
      return () => { clearTimeout(timer); clearInterval(interval); setStickTimeLeft(null); };
    }
  }, [phase, myTurn, isOnlineMode, syncGameState]);

  const doAction = useCallback((fn: () => void, event?: Parameters<typeof sendAction>[0]) => {
    fn();
    // Online modda eylemi doğrudan gönder; gereksiz ani sync tetikleyip animasyonu dondurma
    if (isOnlineMode && event) sendAction(event);
  }, [isOnlineMode, sendAction]);

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
    // RESMİ KURAL: Cambio diyen oyuncunun eli kilitlidir; başkaları onun kartıyla takas yapamaz ve kartına dokunamaz
    if (cambioCaller !== null && seat === cambioCaller && !isMySeat) {
      return false;
    }

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
  }, [phase, peekState, lobbyInfo.seat, discardPile.length, myTurn, activePower, powerSelection, cambioCaller]);

  // Genel kart tıklama yöneticisi
  const handleCardClick = useCallback((seat: number, pos: number) => {
    // RESMİ KURAL: Cambio diyen oyuncunun eli kilitlidir, rakip oyuncular onun kartlarına dokunamaz/yapıştıramaz
    if (cambioCaller !== null && seat === cambioCaller && seat !== lobbyInfo.seat) {
      useToastStore.getState().addToast(
        langStore.lang === 'tr'
          ? '🔒 Cambio diyen oyuncunun kartları kilitlidir, dokunulamaz!'
          : "🔒 Cambio caller's hand is locked!",
        'info'
      );
      return;
    }

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
  const cambioCallerPlayer = cambioCaller !== null ? players.find(p => p.seat === cambioCaller) : null;

  return (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden relative"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #1d5744 0%, #11362a 62%, #0b241c 100%)',
      }}
    >
      <ToastContainer />


      <AnimatePresence>
        {cambioFlash && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/45 backdrop-blur-md pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center px-14 py-9 rounded-3xl border border-[#e8c468]/55"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(26, 74, 57, 0.96) 0%, rgba(13, 38, 29, 0.98) 100%)',
                boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 0 40px rgba(232,196,104,0.25)',
              }}
              initial={{ scale: 0.82, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
            >
              {/* Kimin Cambio Dediğini Gösteren Sıcak Masa Oyunu Rozeti */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-300/45 mb-3">
                <span className="text-base">🔔</span>
                <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#fdf6e3]">
                  {cambioCallerPlayer
                    ? langStore.lang === 'tr'
                      ? `${cambioCallerPlayer.nickname} CAMBIO DEDİ!`
                      : `${cambioCallerPlayer.nickname} CALLED CAMBIO!`
                    : langStore.lang === 'tr'
                      ? 'SON TUR ÇAĞRISI'
                      : 'FINAL ROUND CALLED'}
                </span>
              </div>

              <h2
                className="text-6xl font-extrabold tracking-[0.16em] text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #fffdf7 0%, #f5dfa0 55%, #d9a74a 100%)',
                  filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
                }}
              >
                CAMBIO!
              </h2>
              {cambioCaller !== null && (
                <div className="mt-4 text-center text-[#fdf6e3]/90 text-xs uppercase tracking-[0.16em] font-bold bg-white/[0.08] px-5 py-2 rounded-full border border-white/15">
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

      {/* Doğal 4K / Full HD 1:1 Sahne (Zoom/Scale kullanılmaz, kartlar masada yağ gibi kayarak uçar) */}
      <div className="w-full h-dvh flex flex-col p-1.5 sm:p-3 lg:p-4 gap-1.5 sm:gap-2.5 overflow-hidden relative z-10 max-w-[1920px] mx-auto">
        {/* Üst Bar: Mobilde Sol Logo + Sağ Kontroller, Masaüstünde Orta Logo + Sağ Kontroller */}
        <div className="relative flex items-center justify-between lg:justify-center shrink-0 px-1 sm:px-2">
          {/* CAMBIO Logosu */}
          <motion.div
            className="flex flex-col items-center shrink-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="relative flex items-center gap-2 sm:gap-3.5 px-3 sm:px-7 py-1 sm:py-2 rounded-xl sm:rounded-2xl border border-[#e8c468]/35"
              style={{
                background: 'linear-gradient(180deg, rgba(24, 68, 52, 0.94) 0%, rgba(14, 42, 32, 0.96) 100%)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16)',
              }}
            >
              {/* Sol Minyatür Masa Oyunu Kart İkonu */}
              <div className="hidden sm:flex relative w-7 h-7 items-center justify-center shrink-0">
                <div
                  className="absolute w-4 h-5.5 rounded-[4px] bg-[#1e2d5a] border border-[#e8c468]/70 shadow-xs"
                  style={{ transform: 'rotate(-12deg) translateX(-3px)' }}
                />
                <div
                  className="absolute w-4 h-5.5 rounded-[4px] bg-[#fdf6e3] border border-[#d4a843]/80 shadow-xs flex items-center justify-center"
                  style={{ transform: 'rotate(10deg) translateX(3px)' }}
                >
                  <span className="text-[8px] font-black text-[#b88728]">✦</span>
                </div>
              </div>

              <h1
                className="text-sm sm:text-2xl font-extrabold tracking-[0.18em] sm:tracking-[0.22em] text-[#fdf6e3] leading-none select-none"
              >
                CAMBIO
              </h1>

              {/* Sağ Dekoratif Masa Oyunu Yıldız Sembolü */}
              <div className="hidden sm:flex w-5 h-5 rounded-full bg-[#e8c468]/12 border border-[#e8c468]/30 items-center justify-center text-[#f7e2ab] text-[10px]">
                ✦
              </div>
            </div>
          </motion.div>

          {/* Sağ Üst Kontroller: (Mobil Tam Ekranda Paneller Tuşu) + Desteler + Ses + TR/EN + Tam Ekran */}
          <div className="lg:absolute lg:right-2 lg:top-1/2 lg:-translate-y-1/2 z-50 flex items-center gap-1.5 sm:gap-2">
            {/* Mobilde Tam Ekrandayken (alt tab bar gizliyken) Panelleri Açan Kompakt Buton */}
            {!isDesktop && hideMobileTabBar && (
              <button
                type="button"
                onClick={() => setActiveMobilePanel(activeMobilePanel ? null : 'log')}
                className="btn-emerald-3d h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                title={langStore.lang === 'tr' ? 'Sohbet, Hamleler & Rehber' : 'Chat, Moves & Guide'}
              >
                <svg className="w-3.5 h-3.5 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider">
                  {langStore.lang === 'tr' ? 'Menü' : 'Menu'}
                </span>
              </button>
            )}

            {/* Kart & Masa Kişiselleştirme Butonu */}
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="btn-emerald-3d h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              title={langStore.lang === 'tr' ? 'Kart & Masa Görünümü' : 'Customize Cards & Table'}
            >
              <svg className="w-3.5 h-3.5 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="4" y="3" width="12" height="16" rx="2" />
                <path d="M8 21h10a2 2 0 0 0 2-2V7" />
              </svg>
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">
                {langStore.lang === 'tr' ? 'Desteler' : 'Decks'}
              </span>
            </button>

            {/* Ses Aç / Kapat */}
            <button
              type="button"
              onClick={() => {
                const nextMuted = SoundManager.toggleMute();
                setIsMuted(nextMuted);
              }}
              className="btn-emerald-3d h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              title={isMuted ? (langStore.lang === 'tr' ? 'Sesi Aç' : 'Unmute') : (langStore.lang === 'tr' ? 'Sesi Kapat' : 'Mute')}
            >
              {isMuted ? (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">
                {isMuted
                  ? langStore.lang === 'tr' ? 'Sessiz' : 'Muted'
                  : langStore.lang === 'tr' ? 'Ses' : 'Audio'}
              </span>
            </button>

            {/* Segmented TR | EN Dil Seçici */}
            <div className="luxury-panel h-8 sm:h-9 p-0.5 sm:p-1 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => langStore.setLang('tr')}
                className={`h-full px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
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
                className={`h-full px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
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
              className="flex btn-emerald-3d h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl font-extrabold text-xs items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title={t.fullScreen}
            >
              <span className="hidden sm:inline tracking-wider uppercase text-[11px]">{t.fullScreen}</span>
              <span className="text-sm leading-none text-[var(--gold-light)]">⛶</span>
            </button>
          </div>
        </div>

      <div className="flex flex-1 min-h-0 gap-2 sm:gap-3 xl:gap-5 px-1 sm:px-2 relative z-10">
        {/* SOL PANEL: Yalnızca Masaüstünde (isDesktop) mount edilir — mobilde 0 CPU maliyeti */}
        {isDesktop && (
          <div className="flex flex-col w-[275px] xl:w-[310px] shrink-0 z-50 gap-3 min-h-0">
            <div className="luxury-panel px-4 py-3 rounded-[20px] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                <span className="text-emerald-100/80 text-xs font-bold uppercase tracking-[0.14em]">
                  {langStore.lang === 'tr' ? 'ODA KODU' : 'ROOM CODE'}
                </span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-black/40 border border-[var(--gold)]/35 text-[var(--gold-light)] text-xs font-black font-['JetBrains_Mono'] tracking-[0.16em] shadow-inner">
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
        )}

        <div className="flex-1 min-h-0 flex flex-col gap-1.5 sm:gap-2">
          <LayoutGroup id="cards">
          <div
            className="relative w-full rounded-[20px] sm:rounded-[34px] flex-1 min-h-0 flex flex-col justify-between transition-colors duration-500 overflow-hidden"
            style={{
              background: TABLE_THEME_GRADIENTS[tableTheme],
              boxShadow: '0 14px 36px rgba(0,0,0,0.34), inset 0 0 50px rgba(0,0,0,0.2)',
              border: '2px solid rgba(232,196,104,0.34)',
              minHeight: '200px',
            }}
          >
            {/* ─── Grid Layout: 3 satır × 3 sütun ─── */}
            <div
              className={`flex-1 min-h-0 grid ${isUltraCompact ? 'px-1 py-1' : 'px-1.5 sm:px-3 py-1.5 sm:py-3'}`}
              style={{ gridTemplateRows: 'auto 1fr auto', gridTemplateColumns: 'auto 1fr auto', alignContent: 'space-between' }}
            >
              {/* Üst orta: Karşı oyuncu */}
              <div className="col-start-2 row-start-1 flex justify-center items-start">
                {topPlayer && (
                  <PlayerArea
                    player={topPlayer}
                    position="top"
                    compact={isCompact}
                    ultraCompact={isUltraCompact}
                    size={cardSize}
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
                    compact={isCompact}
                    ultraCompact={isUltraCompact}
                    size={cardSize}
                    canInteract={canInteractWithSeat(leftPlayer.seat)}
                    onCardClick={(pos) => handleCardClick(leftPlayer.seat, pos)}
                    highlightPositions={powerSelection?.seat === leftPlayer.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={getSwapHighlightsForSeat(leftPlayer.seat)}
                    drawnCard={drawnCard}
                  />
                )}
              </div>

              {/* Merkez: Deste + Çöp + Bilgilendirme Bannerları (Bannerlar absolute olduğu için Deste/Çöp ve masa yüksekliği 1 piksel bile oynamaz!) */}
              <div className="col-start-2 row-start-2 flex flex-col items-center justify-center relative">
                <div className="relative flex flex-col items-center">
                  {/* Peek fazı bilgilendirme kutusu ve Görsel Yapıştırma / Ceza Rozeti: Absolute olarak destenin hemen üstünde */}
                  <div className="absolute bottom-[calc(100%+10px)] sm:bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 w-max max-w-[90vw] flex flex-col items-center gap-1.5 sm:gap-2 justify-center z-[100] pointer-events-none">
                    <StickFeedbackBanner />
                    <GameBackgroundOverlay myPlayerId={me?.id ?? lobbyInfo.playerId} />
                  </div>

                  <CenterArea 
                    deck={deck}
                    discardPile={discardPile}
                    compact={isCompact}
                    ultraCompact={isUltraCompact}
                    cardSize={cardSize}
                    canDraw={myTurn && phase === 'draw'}
                    onDrawFromDeck={() => doAction(() => drawFromDeck(), { type: 'DRAW_FROM_DECK' })}
                    onDrawFromDiscard={() => doAction(() => drawFromDiscard(), { type: 'DRAW_FROM_DISCARD' })}
                    myPlayerId={lobbyInfo.playerId}
                  />

                <AnimatePresence>
                  {phase === 'power' && activePower && (
                    <motion.div
                      className="absolute bottom-[calc(100%+0.5rem)] sm:bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 sm:gap-3 w-max max-w-[88vw] pointer-events-none"
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: 10 }}
                    >
                      <span className="text-white text-xs sm:text-base font-bold text-center bg-black/85 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border border-[var(--gold)]/40">
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
                            className="mt-1 px-4 sm:px-5 py-1.5 sm:py-2 bg-red-600 hover:bg-red-500 border border-red-300 rounded-xl text-white font-black text-xs sm:text-sm cursor-pointer"
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
                      className="absolute bottom-full mb-3 sm:mb-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 sm:gap-2 w-max max-w-[88vw]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                    >
                      <span className="text-[var(--gold)] text-base sm:text-2xl font-black tracking-widest uppercase text-center pointer-events-none">
                        {myTurn
                          ? langStore.lang === 'tr' ? 'Doğru Bildin!' : 'Great Stick!'
                          : langStore.lang === 'tr' ? `${currentPlayer?.nickname} Doğru Bildi!` : `${currentPlayer?.nickname} Stuck a Card!`}
                      </span>
                      <span className="text-white/90 text-xs sm:text-sm font-bold bg-black/80 px-4 py-1.5 rounded-full border border-white/15 text-center pointer-events-none">
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
                      <span className="text-[var(--gold)] text-3xl sm:text-6xl font-black">⇄</span>
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
                    compact={isCompact}
                    ultraCompact={isUltraCompact}
                    size={cardSize}
                    canInteract={canInteractWithSeat(rightPlayer.seat)}
                    onCardClick={(pos) => handleCardClick(rightPlayer.seat, pos)}
                    highlightPositions={powerSelection?.seat === rightPlayer.seat ? [powerSelection.pos] : []}
                    swapHighlightPositions={getSwapHighlightsForSeat(rightPlayer.seat)}
                    drawnCard={drawnCard}
                  />
                )}
              </div>

              {/* Alt orta: Sen */}
              <div className={`col-start-2 row-start-3 flex flex-col items-center justify-end min-h-0 shrink-0 ${isUltraCompact ? 'gap-0.5 pb-0.5' : 'gap-1.5 sm:gap-2 pb-1 sm:pb-2'}`}>
              {me && (
                <PlayerArea
                  player={me}
                  position="bottom"
                  isMe
                  compact={isCompact}
                  ultraCompact={isUltraCompact}
                  size={cardSize}
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

          <div className={`luxury-panel shrink-0 rounded-[18px] sm:rounded-[24px] ${isUltraCompact ? 'px-2 py-1' : 'px-3 sm:px-4 py-1.5 sm:py-2'}`}>
            <TurnIndicator
              currentPlayerName={formatPlayerName(currentPlayer?.nickname, langStore.lang)}
              phase={phase}
              myTurn={myTurn}
              timeLeft={stickTimeLeft ?? undefined}
              cambioCaller={cambioCaller}
              cambioCallerName={cambioCallerPlayer ? formatPlayerName(cambioCallerPlayer.nickname, langStore.lang) : undefined}
              remainingTurns={remainingTurns}
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
                      initGame(sessionStorage.getItem('nickname') || 'Sen', ['Ahmet', 'Zeliha', 'Mehmet']);
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
                  useGameStore.getState().initGame(sessionStorage.getItem('nickname') || 'Sen', ['Ahmet', 'Zeliha', 'Mehmet']);
                }
              }}
            />
          </div>

          {/* MOBİL ALT HIZLI ERİŞİM TAB ÇUBUĞU (Tam Ekranda veya Kısa Yatay Ekranda otomatik gizlenir ki masa %100 ekrana sığsın!) */}
          {!isDesktop && !hideMobileTabBar && (
            <div className="grid grid-cols-4 gap-1.5 shrink-0">
              {(
                [
                  { id: 'log', tr: 'Hamleler', en: 'Moves' },
                  { id: 'chat', tr: 'Sohbet', en: 'Chat' },
                  { id: 'rules', tr: 'Rehber', en: 'Guide' },
                  { id: 'leaderboard', tr: 'Skorlar', en: 'Scores' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveMobilePanel(
                      activeMobilePanel === tab.id ? null : tab.id
                    )
                  }
                  className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                    activeMobilePanel === tab.id
                      ? 'bg-[#e8c468] text-[#1c1302] border-[#fff3c4]'
                      : 'luxury-panel text-emerald-100/90'
                  }`}
                >
                  <span>{langStore.lang === 'tr' ? tab.tr : tab.en}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SAĞ PANEL: Yalnızca Masaüstünde (isDesktop) mount edilir */}
        {isDesktop && (
          <div className="flex w-[310px] xl:w-[355px] shrink-0 flex-col gap-3 z-50 min-h-0">
            <RulesPanel />
            <Leaderboard />
          </div>
        )}
      </div>

      {/* Kişiselleştirme (Kart Sırtı & Masa Rengi) Modalı */}
      <CustomizationModal isOpen={showCustomize} onClose={() => setShowCustomize(false)} />

      {/* MOBİL ÇEKMECE (BOTTOM SHEET) MODALI — İçinde Sekme Geçişleriyle */}
      <AnimatePresence>
        {!isDesktop && activeMobilePanel && (
          <motion.div
            className="fixed inset-0 z-[190] flex flex-col justify-end bg-black/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveMobilePanel(null)}
          >
            <motion.div
              className="w-full h-[78dvh] p-3 flex flex-col gap-2"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Çekmece Üst Sekme Seçici + Kapat Tuşu (Tam ekranda bile tüm sekmeler arası geçiş sağlar) */}
              <div className="flex items-center justify-between gap-2 bg-[#0c261d] border border-[#e8c468]/35 p-1.5 rounded-2xl shrink-0">
                <div className="grid grid-cols-4 gap-1 flex-1">
                  {(
                    [
                      { id: 'log', tr: 'Hamleler', en: 'Moves' },
                      { id: 'chat', tr: 'Sohbet', en: 'Chat' },
                      { id: 'rules', tr: 'Rehber', en: 'Guide' },
                      { id: 'leaderboard', tr: 'Skorlar', en: 'Scores' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveMobilePanel(tab.id)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer ${
                        activeMobilePanel === tab.id
                          ? 'bg-[#e8c468] text-[#1c1302]'
                          : 'text-emerald-100/75 hover:text-white'
                      }`}
                    >
                      {langStore.lang === 'tr' ? tab.tr : tab.en}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMobilePanel(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                {activeMobilePanel === 'log' && <GameLog />}
                {activeMobilePanel === 'chat' && (
                  <ChatPanel
                    sendAction={sendAction}
                    myPlayerId={lobbyInfo.playerId}
                    myNickname={
                      players.find((p) => p.id === lobbyInfo.playerId)?.nickname ||
                      (langStore.lang === 'tr' ? 'Oyuncu' : 'Player')
                    }
                  />
                )}
                {activeMobilePanel === 'rules' && <RulesPanel />}
                {activeMobilePanel === 'leaderboard' && <Leaderboard />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
