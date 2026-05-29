import { motion, AnimatePresence } from 'framer-motion';
import type { GamePhase } from '../types/game';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

interface TurnIndicatorProps {
  currentPlayerName: string;
  phase: GamePhase;
  timeLeft?: number;
  myTurn: boolean;
  cambioCaller: number | null;
  turnCount: number;
  onCallCambio: () => void;
  onReset: () => void;
  resetCountdown: number | null;
  onPlayAgain?: () => void;
}

const PHASE_COLORS: Partial<Record<GamePhase, string>> = {
  draw:         'text-[var(--gold)]',
  action:       'text-emerald-400',
  stick_window: 'text-blue-300',
  power:        'text-purple-400',
  give_card:    'text-orange-400',
  cambio_round: 'text-red-400',
  results:      'text-[var(--gold)]',
};

export function TurnIndicator({
  currentPlayerName,
  phase,
  timeLeft,
  myTurn,
  cambioCaller,
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

  const phaseColor = PHASE_COLORS[phase] ?? 'text-white/80';

  return (
    <div className="flex flex-wrap items-center w-full px-4 sm:px-6 gap-2 sm:gap-0 min-h-[44px]">

      {/* SOL — SIRA */}
      <div className="flex items-center gap-2 min-w-[100px] sm:flex-1">
        <div className="flex flex-col leading-tight">
          <span className="text-white/40 text-[8px] sm:text-[9px] uppercase tracking-[0.18em] font-semibold">
            {t.turn}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentPlayerName + String(myTurn)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={`font-bold text-sm leading-tight ${myTurn ? 'text-[var(--gold)]' : 'text-white/80'}`}
            >
              {myTurn ? t.yourTurn : currentPlayerName}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* ORTA — FAZ + SÜRE */}
      <div className="flex items-center gap-3 sm:gap-5 justify-center sm:flex-none order-last sm:order-none w-full sm:w-auto">
        <div className="hidden sm:block h-5 w-px bg-white/15" />
        <div className="flex flex-col items-center leading-tight">
          <span className="text-white/40 text-[8px] sm:text-[9px] uppercase tracking-[0.18em] font-semibold">
            {t.phase}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={`font-bold text-sm leading-tight ${phaseColor}`}
            >
              {PHASE_LABELS[phase]}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {timeLeft !== undefined && timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="flex flex-col items-center leading-tight"
            >
              <span className="text-white/40 text-[8px] sm:text-[9px] uppercase tracking-[0.18em] font-semibold">
                {t.time}
              </span>
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className={`font-black text-sm leading-tight ${timeLeft <= 2 ? 'text-red-400' : 'text-white'}`}
              >
                {timeLeft}s
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tur Sayıcısı */}
        {turnCount > 0 && phase !== 'results' && phase !== 'peek' && (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-white/40 text-[8px] sm:text-[9px] uppercase tracking-[0.18em] font-semibold">Tur</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={turnCount}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="font-black text-sm leading-tight text-white/70"
              >
                #{turnCount}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
        <div className="hidden sm:block h-5 w-px bg-white/15" />
      </div>

      {/* SAG — AKSIYONLAR */}
      <div className="flex items-center gap-2 sm:gap-3 sm:flex-1 justify-end">
        <AnimatePresence mode="wait">
          {phase === 'results' && onPlayAgain && (
            <motion.button
              key="playagain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-4 py-1.5 rounded-lg font-bold text-black text-sm"
              style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96c)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlayAgain}
            >
              Tekrar Oyna
            </motion.button>
          )}

          {phase === 'cambio_round' && (
            <motion.div
              key="cambioround"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="text-red-400 text-xs font-black tracking-widest uppercase"
            >
              CAMBIO TURU
            </motion.div>
          )}

          {myTurn && phase === 'draw' && cambioCaller === null && (
            <motion.button
              key="cambio"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-4 sm:px-5 py-1.5 rounded-lg font-black text-white text-xs sm:text-sm tracking-widest uppercase border border-red-400/80"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
                boxShadow: '0 0 16px rgba(220,38,38,0.5)',
              }}
              whileHover={{ scale: 1.07, boxShadow: '0 0 26px rgba(220,38,38,0.8)' }}
              whileTap={{ scale: 0.94 }}
              onClick={onCallCambio}
            >
              CAMBIO!
            </motion.button>
          )}
        </AnimatePresence>

        {/* Reset — her zaman görünür */}
        <motion.button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            resetCountdown !== null
              ? 'bg-red-900/60 border-red-500/60 text-red-300'
              : 'bg-white/10 border-white/25 text-white/60 hover:text-white hover:bg-white/20 hover:border-white/40'
          }`}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.92 }}
          onClick={onReset}
          title="Oyunu sıfırla"
        >
          <span className="text-sm leading-none">⟳</span>
          <span className="hidden sm:inline">
            {resetCountdown !== null ? `${resetCountdown}s` : 'Reset'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
