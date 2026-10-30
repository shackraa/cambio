import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import type { GamePhase } from '../types/game';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

interface TurnIndicatorProps {
  currentPlayerName: string;
  phase: GamePhase;
  timeLeft?: number;
  myTurn: boolean;
  cambioCaller: number | null;
  cambioCallerName?: string;
  remainingTurns?: number;
  turnCount: number;
  onCallCambio: () => void;
  onReset: () => void;
  resetCountdown: number | null;
  onPlayAgain?: () => void;
}

const PHASE_BADGE_STYLES: Partial<Record<GamePhase, { bg: string; border: string; text: string; dot: string }>> = {
  draw:         { bg: 'rgba(212, 168, 67, 0.16)', border: 'rgba(243, 212, 124, 0.45)', text: '#fae19c', dot: '#f3d47c' },
  action:       { bg: 'rgba(16, 185, 129, 0.18)', border: 'rgba(52, 211, 153, 0.45)',  text: '#6ee7b7', dot: '#34d399' },
  stick_window: { bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(125, 211, 252, 0.45)', text: '#7dd3fc', dot: '#38bdf8' },
  power:        { bg: 'rgba(192, 132, 252, 0.18)', border: 'rgba(216, 180, 254, 0.45)', text: '#d8b4fe', dot: '#c084fc' },
  give_card:    { bg: 'rgba(251, 146, 60, 0.18)',  border: 'rgba(253, 186, 116, 0.45)', text: '#fdba74', dot: '#fb923c' },
  cambio_round: { bg: 'rgba(239, 68, 68, 0.20)',   border: 'rgba(252, 165, 165, 0.5)',  text: '#fca5a5', dot: '#ef4444' },
  results:      { bg: 'rgba(212, 168, 67, 0.22)', border: 'rgba(243, 212, 124, 0.6)',  text: '#fae19c', dot: '#f3d47c' },
};

export const TurnIndicator = memo(function TurnIndicator({
  currentPlayerName,
  phase,
  timeLeft,
  myTurn,
  cambioCaller,
  cambioCallerName,
  remainingTurns,
  turnCount,
  onCallCambio,
  onReset,
  resetCountdown,
  onPlayAgain,
}: TurnIndicatorProps) {
  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const PHASE_LABELS: Record<GamePhase, string> = {
    waiting:      t.phase_waiting,
    peek:         t.phase_peek,
    draw:         t.phase_draw,
    action:       t.phase_action,
    stick_window: t.phase_stick_window,
    power:        t.phase_power,
    give_card:    t.phase_give_card,
    cambio_round: t.phase_cambio_round,
    reveal:       t.phase_reveal,
    results:      t.phase_results,
  };

  const pStyle = PHASE_BADGE_STYLES[phase] ?? {
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.15)',
    text: '#e2e8f0',
    dot: '#94a3b8',
  };

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between w-full px-2 sm:px-5 min-h-[44px] sm:min-h-[54px] gap-2 sm:gap-4">
      {/* ─── SOL: OYUNCU SIRASI MADALYONU ─── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlayerName + String(myTurn)}
            initial={{ opacity: 0, x: -10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border transition-all ${
              myTurn
                ? 'bg-gradient-to-r from-[#fae19c]/25 via-[#d4a843]/15 to-transparent border-[#f3d47c]/65 shadow-[0_0_25px_rgba(212,168,67,0.28)]'
                : 'bg-black/30 border-white/10'
            }`}
          >
            {/* Dönen / Parlayan Sıra İkonu */}
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border ${
                myTurn
                  ? 'bg-gradient-to-br from-[#fae19c] to-[#b88728] text-black border-amber-100 shadow-[0_0_12px_rgba(243,212,124,0.6)]'
                  : 'bg-emerald-950/80 text-emerald-200/70 border-white/10'
              }`}
            >
              {myTurn ? (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.8 8.5L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.5L12 2Z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.5-4 14.5-4 16 0" />
                </svg>
              )}
            </div>

            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-emerald-200/50 text-[8px] sm:text-[9px] uppercase tracking-[0.16em] font-extrabold">
                {t.turn}
              </span>
              <span
                className={`font-extrabold text-xs sm:text-sm truncate ${
                  myTurn ? 'text-[#fae19c] drop-shadow-[0_1px_8px_rgba(243,212,124,0.4)]' : 'text-white/90'
                }`}
              >
                {myTurn ? t.yourTurn : currentPlayerName}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── ORTA: OYUN FAZI KAPSÜLÜ, CANLI SÜRE HALKASI VE TUR ROZETİ ─── */}
      <div className="flex items-center gap-1.5 sm:gap-3 justify-center">
        {/* Faz Kapsülü */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase + lang}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-inner"
            style={{
              background: pStyle.bg,
              border: `1px solid ${pStyle.border}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
              style={{ backgroundColor: pStyle.dot, boxShadow: `0 0 8px ${pStyle.dot}` }}
            />
            <div className="flex flex-col leading-none">
              <span className="hidden sm:inline text-[8px] uppercase tracking-[0.18em] text-white/50 font-bold">
                {t.phase}
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold tracking-wide sm:mt-0.5" style={{ color: pStyle.text }}>
                {PHASE_LABELS[phase]}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Geri Sayım Sayacı (Yapıştırma Penceresi vb.) */}
        <AnimatePresence>
          {timeLeft !== undefined && timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-black/40 border border-sky-400/35"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-300 animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                className={`font-black text-[11px] sm:text-xs font-['JetBrains_Mono'] ${
                  timeLeft <= 1 ? 'text-red-400' : 'text-sky-200'
                }`}
              >
                {timeLeft}s
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tur Sayacı */}
        {turnCount > 0 && phase !== 'results' && phase !== 'peek' && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/25 border border-[#e8c468]/25">
            <span className="text-[9px] uppercase tracking-[0.15em] text-emerald-100/55 font-extrabold">
              {t.round}
            </span>
            <span className="font-extrabold text-xs font-['JetBrains_Mono'] text-[#f7e2ab]">
              #{turnCount}
            </span>
          </div>
        )}

        {/* Kimin Cambio Dediğini Gösteren Kalıcı Alt Bar Rozeti */}
        <AnimatePresence>
          {cambioCaller !== null && phase !== 'results' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-300/45"
            >
              <span className="text-xs">🔔</span>
              <span className="text-[11px] sm:text-xs font-bold text-[#fdf6e3] truncate max-w-[110px] sm:max-w-none">
                {cambioCallerName
                  ? lang === 'tr'
                    ? `${cambioCallerName} Cambio Dedi`
                    : `${cambioCallerName} Called Cambio`
                  : 'CAMBIO'}
              </span>
              {remainingTurns !== undefined && remainingTurns > 0 && (
                <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-black/30 text-amber-200">
                  {lang === 'tr' ? `${remainingTurns}` : `${remainingTurns}`}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SAĞ: 3D AKSİYON BUTONLARI (CAMBIO / TEKRAR OYNA / YENİ EL) ─── */}
      <div className="flex items-center gap-2 sm:gap-3 justify-end">
        <AnimatePresence mode="wait">
          {phase === 'results' && onPlayAgain && (
            <motion.button
              key="playagain"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="btn-gold-3d px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-[0.1em] cursor-pointer flex items-center gap-1.5 sm:gap-2"
              onClick={onPlayAgain}
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{t.playAgain}</span>
            </motion.button>
          )}

          {myTurn && phase === 'draw' && cambioCaller === null && (
            <motion.button
              key="cambio"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="btn-crimson-3d px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-xs tracking-[0.14em] uppercase cursor-pointer flex items-center gap-1.5 sm:gap-2"
              onClick={onCallCambio}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047]" />
              <span>CAMBIO!</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Yeni El / Sıfırla Butonu */}
        <button
          type="button"
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-extrabold cursor-pointer ${
            resetCountdown !== null
              ? 'btn-crimson-3d'
              : 'btn-emerald-3d'
          }`}
          onClick={onReset}
          title={lang === 'tr' ? 'Yeni el dağıt' : 'Deal new hand'}
        >
          <svg
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--gold-light)] ${resetCountdown !== null ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="tracking-wide">
            {resetCountdown !== null
              ? `${resetCountdown}s`
              : lang === 'tr'
                ? 'Yeni El'
                : 'New Hand'}
          </span>
        </button>
      </div>
    </div>
  );
});
