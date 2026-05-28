import { motion } from 'framer-motion';
import type { GamePhase } from '../types/game';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

interface TurnIndicatorProps {
  currentPlayerName: string;
  phase: GamePhase;
  timeLeft?: number;
  myTurn: boolean;
}

export function TurnIndicator({ currentPlayerName, phase, timeLeft, myTurn }: TurnIndicatorProps) {
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

  return (
    <div className="inline-flex items-center justify-center gap-16 px-20 py-5 w-max shrink-0
                    bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg whitespace-nowrap">
      {/* Sıra */}
      <div className="flex flex-col">
        <span className="text-white/50 text-[10px] uppercase tracking-wider">{t.turn}</span>
        <motion.span
          key={currentPlayerName}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`font-bold text-sm ${myTurn ? 'text-[var(--gold)]' : 'text-white'}`}
        >
          {myTurn ? t.yourTurn : currentPlayerName}
        </motion.span>
      </div>

      {/* Ayırıcı */}
      <div className="h-8 w-px bg-white/20 shrink-0" />

      {/* Faz */}
      <div className="flex flex-col items-start">
        <span className="text-white/50 text-[10px] uppercase tracking-wider">{t.phase}</span>
        <span className="text-white text-xs font-semibold">{PHASE_LABELS[phase]}</span>
      </div>

      {/* Süre */}
      {timeLeft !== undefined && (
        <div className="flex flex-col items-end">
          <span className="text-white/50 text-[10px] uppercase tracking-wider">{t.time}</span>
          <motion.span
            key={timeLeft}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className={`font-bold text-sm ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}
          >
            {timeLeft}s
          </motion.span>
        </div>
      )}
    </div>
  );
}
