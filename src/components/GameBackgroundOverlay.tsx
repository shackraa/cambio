import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useEffect, useState, useRef } from 'react';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function GameBackgroundOverlay({ myPlayerId }: { myPlayerId?: string }) {
  const phase = useGameStore(s => s.phase);
  const peekState = useGameStore(s => s.peekState);
  const peekPhaseEndTime = useGameStore(s => s.peekPhaseEndTime);
  const peekSelectedPositions = useGameStore(s => s.peekSelectedPositions);

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  let text = '';
  let subtext = '';
  let showTimer = false;
  let timerEndTime = null;
  const timerTotalDuration = 5000;

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

  // Sıfır React re-render ile 60/120 FPS dairesel sayaç (ref üzerinden doğrudan SVG güncellemesi)
  const circleRef = useRef<SVGCircleElement | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!showTimer || !timerEndTime) return;

    let rafId: number;
    let lastSec = -1;
    const tick = () => {
      const msLeft = Math.max(0, timerEndTime - Date.now());
      const prc = Math.max(0, Math.min(100, (msLeft / timerTotalDuration) * 100));
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(264 - (264 * prc) / 100);
      }
      const nextSec = Math.ceil(msLeft / 1000);
      if (nextSec !== lastSec) {
        lastSec = nextSec;
        setSeconds(nextSec);
      }
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
      className="pointer-events-none z-30 flex flex-col items-center justify-center"
      lang={lang}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={text + subtext}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center px-6 py-3 rounded-2xl border border-[#e8c468]/30 shadow-[0_10px_28px_rgba(0,0,0,0.32)]"
          style={{
            background: 'linear-gradient(180deg, rgba(16, 50, 38, 0.95) 0%, rgba(10, 34, 25, 0.97) 100%)',
          }}
        >
          {showTimer && (
            <div className="relative w-12 h-12 mb-1.5 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="7"
                />
                <circle
                  ref={circleRef}
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="#f5dfa0"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute text-base font-extrabold text-white font-['JetBrains_Mono']">
                {seconds}
              </div>
            </div>
          )}

          {/* 4K Vektörel Keskinlikte Başlık (Subpixel bulanıklığı yapan scale ve blur kaldırıldı) */}
          <h2 className="text-base sm:text-xl font-extrabold leading-snug text-center tracking-[0.12em] text-white">
            {text}
          </h2>
          {subtext && (
            <p className="text-[11px] sm:text-xs font-semibold text-emerald-100/80 mt-0.5 tracking-[0.08em] text-center">
              {subtext}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
