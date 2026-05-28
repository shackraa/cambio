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

  // Dairesel sayaç animasyonu için state
  const [progress, setProgress] = useState(100);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!showTimer || !timerEndTime) return;
    
    const interval = setInterval(() => {
      const msLeft = Math.max(0, timerEndTime - Date.now());
      const prc = (msLeft / timerTotalDuration) * 100;
      setProgress(prc);
      setSeconds(Math.ceil(msLeft / 1000));
    }, 50); // akıcı animasyon için 50ms

    return () => clearInterval(interval);
  }, [showTimer, timerEndTime, timerTotalDuration]);

  if (!text) return null;

  return (
    <div className="pointer-events-none z-0 flex flex-col items-center justify-center w-max">
      <AnimatePresence mode="wait">
        <motion.div
          key={text + subtext}
          initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-start"
        >
          {showTimer && (
            <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="transparent"
                  stroke="var(--gold)"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * progress) / 100}
                  className="transition-all duration-75 ease-linear drop-shadow-[0_0_10px_rgba(212,168,67,0.8)]"
                />
              </svg>
              <div className="absolute text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                {seconds}
              </div>
            </div>
          )}

          <h1 
            className="text-4xl font-black leading-tight text-center max-w-[90vw]"
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              textShadow: '0 4px 20px rgba(0,0,0,0.6)',
              letterSpacing: '0.05em'
            }}
          >
            {text}
          </h1>
          {subtext && (
            <p className="text-lg font-bold text-white/40 mt-3 tracking-widest uppercase drop-shadow-xl text-center">
              {subtext}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
