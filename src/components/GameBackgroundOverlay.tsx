import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useEffect, useState } from 'react';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function GameBackgroundOverlay({ myPlayerId }: { myPlayerId?: string }) {
  const phase = useGameStore(s => s.phase);
  const activePower = useGameStore(s => s.activePower);
  const peekState = useGameStore(s => s.peekState);
  const currentTurn = useGameStore(s => s.currentTurn);
  const players = useGameStore(s => s.players);
  const peekPhaseEndTime = useGameStore(s => s.peekPhaseEndTime);
  const peekSelectedPositions = useGameStore(s => s.peekSelectedPositions);

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const currentPlayer = players.find(p => p.seat === currentTurn);

  let text = '';
  let subtext = '';
  let showTimer = false;
  let timerEndTime = null;
  let timerTotalDuration = 5000;

  if (phase === 'peek') {
    if (peekState === 'dealing') {
      text = t.peek_dealing;
      subtext = t.peek_dealing_sub;
    } else if (peekState === 'starting') {
      text = t.peek_starting;
      subtext = t.peek_starting_sub;
      showTimer = true;
      timerEndTime = peekPhaseEndTime;
    } else if (peekState === 'select') {
      const mySelections = peekSelectedPositions.filter(p => p.playerId === myPlayerId);
      if (mySelections.length >= 2) {
        text = t.peek_waiting;
        subtext = t.peek_waiting_sub;
      } else {
        text = t.peek_select;
        subtext = t.peek_select_sub;
      }
    } else if (peekState === 'highlight') {
      text = t.peek_highlight;
      subtext = t.peek_highlight_sub;
      showTimer = true;
      timerEndTime = peekPhaseEndTime;
    } else if (peekState === 'reveal') {
      text = t.peek_reveal;
      subtext = t.peek_reveal_sub;
      showTimer = true;
      timerEndTime = peekPhaseEndTime;
    }
  }

  // 60 FPS pürüzsüz dairesel sayaç animasyonu (requestAnimationFrame ile)
  const [progress, setProgress] = useState(100);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!showTimer || !timerEndTime) return;

    let rafId: number;
    const tick = () => {
      const msLeft = Math.max(0, timerEndTime - Date.now());
      const prc = Math.max(0, Math.min(100, (msLeft / timerTotalDuration) * 100));
      setProgress(prc);
      setSeconds(Math.ceil(msLeft / 1000));
      if (msLeft > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [showTimer, timerEndTime, timerTotalDuration]);

  if (!text) return null;

  return (
    <div
      className="pointer-events-none z-0 flex flex-col items-center justify-center w-max"
      lang={lang}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={text + subtext}
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: 'transform, opacity' }}
          className="flex flex-col items-center justify-center px-7 py-3 rounded-3xl bg-emerald-950/30 backdrop-blur-md border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.22)]"
        >
          {showTimer && (
            <div className="relative w-14 h-14 mb-2 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="var(--gold-light)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progress) / 100}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(212,168,67,0.45))' }}
                />
              </svg>
              <div className="absolute text-xl font-bold text-emerald-50/90 font-['JetBrains_Mono']">
                {seconds}
              </div>
            </div>
          )}

          <h2
            className="text-xl font-bold leading-snug text-center tracking-[0.14em] text-emerald-50/85"
            style={{
              textShadow: '0 2px 12px rgba(0,0,0,0.35)',
            }}
          >
            {text}
          </h2>
          {subtext && (
            <p className="text-xs font-medium text-emerald-100/60 mt-1 tracking-[0.12em] text-center">
              {subtext}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
