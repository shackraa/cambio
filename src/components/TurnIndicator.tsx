import { motion } from 'framer-motion';
import type { GamePhase } from '../types/game';

interface TurnIndicatorProps {
  currentPlayerName: string;
  phase: GamePhase;
  timeLeft?: number;
  myTurn: boolean;
}

const PHASE_LABELS: Record<GamePhase, string> = {
  waiting:      'Bekleniyor...',
  peek:         '👀 Kartlarına bak!',
  draw:         'Kart çek',
  action:       'İşlem yap',
  stick_window: '⚡ Yapıştır!',
  power:        '✨ Güç kullan',
  cambio_round: '🎯 Cambio Turu!',
  reveal:       '🂡 Açılıyor...',
  results:      '🏆 Sonuçlar',
};

export function TurnIndicator({ currentPlayerName, phase, timeLeft, myTurn }: TurnIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-sm mx-auto px-4 py-2
                    bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10">
      {/* Sıra */}
      <div className="flex flex-col">
        <span className="text-white/50 text-[10px] uppercase tracking-wider">Sıra</span>
        <motion.span
          key={currentPlayerName}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`font-bold text-sm ${myTurn ? 'text-[var(--gold)]' : 'text-white'}`}
        >
          {myTurn ? '⚡ Senin sıran!' : currentPlayerName}
        </motion.span>
      </div>

      {/* Faz */}
      <div className="flex flex-col items-center">
        <span className="text-white/50 text-[10px] uppercase tracking-wider">Faz</span>
        <span className="text-white text-xs font-semibold">{PHASE_LABELS[phase]}</span>
      </div>

      {/* Süre */}
      {timeLeft !== undefined && (
        <div className="flex flex-col items-end">
          <span className="text-white/50 text-[10px] uppercase tracking-wider">Süre</span>
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
