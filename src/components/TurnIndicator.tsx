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
  action:       'text-emerald-300',
  stick_window: 'text-sky-300',
  power:        'text-purple-300',
  give_card:    'text-amber-300',
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
    <div className="flex items-center justify-between w-full px-6 min-h-[48px]">
      {/* SOL — AKTİF SIRA ROZETİ */}
      <div className="flex items-center gap-3 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlayerName + String(myTurn)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl border transition-all ${
              myTurn
                ? 'bg-[var(--gold)]/18 border-[var(--gold)]/60 shadow-[0_0_20px_rgba(212,168,67,0.22)]'
                : 'bg-white/[0.04] border-white/[0.08]'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {myTurn && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  myTurn ? 'bg-[var(--gold)]' : 'bg-white/40'
                }`}
              />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-white/45 text-[9px] uppercase tracking-[0.16em] font-bold">
                {t.turn}
              </span>
              <span
                className={`font-extrabold text-sm mt-0.5 ${
                  myTurn ? 'text-[var(--gold)]' : 'text-white/90'
                }`}
              >
                {myTurn ? t.yourTurn : currentPlayerName}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ORTA — FAZ, SÜRE VE TUR SAYACI */}
      <div className="flex items-center gap-6 justify-center">
        <div className="flex flex-col items-center leading-tight">
          <span className="text-white/40 text-[9px] uppercase tracking-[0.16em] font-bold">
            {t.phase}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={phase + lang}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={`font-extrabold text-sm mt-0.5 ${phaseColor}`}
            >
              {PHASE_LABELS[phase]}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {timeLeft !== undefined && timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex flex-col items-center leading-tight pl-4 border-l border-white/10"
            >
              <span className="text-white/40 text-[9px] uppercase tracking-[0.16em] font-bold">
                {t.time}
              </span>
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`font-black text-sm font-mono mt-0.5 ${
                  timeLeft <= 1 ? 'text-red-400' : 'text-white'
                }`}
              >
                {timeLeft}s
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {turnCount > 0 && phase !== 'results' && phase !== 'peek' && (
          <div className="flex flex-col items-center leading-tight pl-4 border-l border-white/10">
            <span className="text-white/40 text-[9px] uppercase tracking-[0.16em] font-bold">
              {t.round}
            </span>
            <span className="font-bold text-sm font-mono text-white/80 mt-0.5">
              #{turnCount}
            </span>
          </div>
        )}
      </div>

      {/* SAĞ — CAMBIO, TEKRAR OYNA VE YENİ EL (RESET) */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <AnimatePresence mode="wait">
          {phase === 'results' && onPlayAgain && (
            <motion.button
              key="playagain"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-5 py-2 rounded-xl font-extrabold text-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
              style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96c)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onPlayAgain}
            >
              {t.playAgain}
            </motion.button>
          )}

          {myTurn && phase === 'draw' && cambioCaller === null && (
            <motion.button
              key="cambio"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-5 py-2 rounded-xl font-black text-white text-xs tracking-[0.16em] uppercase border border-amber-300/60 cursor-pointer flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                boxShadow: '0 4px 18px rgba(185, 28, 28, 0.45)',
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(220, 38, 38, 0.65)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onCallCambio}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              <span>CAMBIO</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Yeni El / Sıfırla Butonu */}
        <motion.button
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            resetCountdown !== null
              ? 'bg-red-500/20 border-red-400/50 text-red-200'
              : 'bg-white/[0.05] border-white/[0.12] text-white/75 hover:text-white hover:bg-white/[0.1] hover:border-white/25'
          }`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          title={lang === 'tr' ? 'Oyunu yeniden başlat' : 'Restart game'}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>
            {resetCountdown !== null
              ? `${resetCountdown}s`
              : lang === 'tr'
                ? 'Yeni El'
                : 'New Hand'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
