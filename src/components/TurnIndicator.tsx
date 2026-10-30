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

const PHASE_BADGE_STYLES: Partial<
  Record<GamePhase, { bg: string; border: string; text: string; dot: string }>
> = {
  draw: {
    bg: 'rgba(212, 168, 67, 0.16)',
    border: 'rgba(243, 212, 124, 0.45)',
    text: '#fae19c',
    dot: '#f3d47c',
  },
  action: {
    bg: 'rgba(16, 185, 129, 0.18)',
    border: 'rgba(52, 211, 153, 0.45)',
    text: '#6ee7b7',
    dot: '#34d399',
  },
  stick_window: {
    bg: 'rgba(56, 189, 248, 0.18)',
    border: 'rgba(125, 211, 252, 0.45)',
    text: '#7dd3fc',
    dot: '#38bdf8',
  },
  power: {
    bg: 'rgba(192, 132, 252, 0.18)',
    border: 'rgba(216, 180, 254, 0.45)',
    text: '#d8b4fe',
    dot: '#c084fc',
  },
  give_card: {
    bg: 'rgba(251, 146, 60, 0.18)',
    border: 'rgba(253, 186, 116, 0.45)',
    text: '#fdba74',
    dot: '#fb923c',
  },
  cambio_round: {
    bg: 'rgba(239, 68, 68, 0.20)',
    border: 'rgba(252, 165, 165, 0.5)',
    text: '#fca5a5',
    dot: '#ef4444',
  },
  results: {
    bg: 'rgba(212, 168, 67, 0.22)',
    border: 'rgba(243, 212, 124, 0.6)',
    text: '#fae19c',
    dot: '#f3d47c',
  },
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
    waiting: t.phase_waiting,
    peek: t.phase_peek,
    draw: t.phase_draw,
    action: t.phase_action,
    stick_window: t.phase_stick_window,
    power: t.phase_power,
    give_card: t.phase_give_card,
    cambio_round: t.phase_cambio_round,
    reveal: t.phase_reveal,
    results: t.phase_results,
  };

  const pStyle = PHASE_BADGE_STYLES[phase] ?? {
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.15)',
    text: '#e2e8f0',
    dot: '#94a3b8',
  };

  // SABİT YÜKSEKLİK (h-[40px] sm:h-[50px] flex-nowrap):
  // Hiçbir hamlede, kart atılışında veya sayaç çıkışında alt barın yüksekliği 1 piksel bile değişmez;
  // böylece üstteki yeşil masa asla küçülüp büyümez!
  return (
    <div className="flex flex-nowrap items-center justify-between w-full px-1.5 sm:px-4 h-[40px] sm:h-[50px] gap-1.5 sm:gap-3 overflow-hidden select-none">
      {/* ─── SOL: OYUNCU SIRASI MADALYONU ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
        <div
          className={`flex items-center gap-1.5 sm:gap-2.5 h-8 sm:h-10 px-2 sm:px-3.5 rounded-xl border transition-colors ${
            myTurn
              ? 'bg-gradient-to-r from-[#fae19c]/25 via-[#d4a843]/15 to-transparent border-[#f3d47c]/65'
              : 'bg-black/30 border-white/10'
          }`}
        >
          <div
            className={`w-5 h-5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              myTurn
                ? 'bg-gradient-to-br from-[#fae19c] to-[#b88728] text-black border-amber-100'
                : 'bg-emerald-950/80 text-emerald-200/70 border-white/10'
            }`}
          >
            {myTurn ? (
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L14.8 8.5L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.5L12 2Z" />
              </svg>
            ) : (
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.5-4 14.5-4 16 0" />
              </svg>
            )}
          </div>

          <div className="flex flex-col leading-none min-w-0">
            <span className="hidden sm:inline text-emerald-200/50 text-[8px] uppercase tracking-[0.16em] font-extrabold mb-0.5">
              {t.turn}
            </span>
            <span
              className={`font-extrabold text-[11px] sm:text-sm truncate max-w-[85px] sm:max-w-[140px] ${
                myTurn ? 'text-[#fae19c]' : 'text-white/90'
              }`}
            >
              {myTurn ? t.yourTurn : currentPlayerName}
            </span>
          </div>
        </div>
      </div>

      {/* ─── ORTA: OYUN FAZI KAPSÜLÜ, CANLI SÜRE HALKASI VE TUR ROZETİ ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 justify-center min-w-0 shrink">
        {/* Faz Kapsülü */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl shrink-0"
          style={{
            background: pStyle.bg,
            border: `1px solid ${pStyle.border}`,
          }}
        >
          <span
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
            style={{
              backgroundColor: pStyle.dot,
              boxShadow: `0 0 8px ${pStyle.dot}`,
            }}
          />
          <div className="flex flex-col leading-none">
            <span className="hidden md:inline text-[8px] uppercase tracking-[0.18em] text-white/50 font-bold mb-0.5">
              {t.phase}
            </span>
            <span
              className="text-[10px] sm:text-xs font-extrabold tracking-wide whitespace-nowrap"
              style={{ color: pStyle.text }}
            >
              {PHASE_LABELS[phase]}
            </span>
          </div>
        </div>

        {/* Geri Sayım Sayacı (Yapıştırma Penceresi vb. - Sabit yükseklikte!) */}
        {timeLeft !== undefined && timeLeft > 0 && (
          <div className="flex items-center gap-1 sm:gap-1.5 h-8 sm:h-10 px-2 sm:px-3 rounded-xl bg-black/40 border border-sky-400/35 shrink-0">
            <span
              className={`font-black text-[11px] sm:text-xs font-['JetBrains_Mono'] ${
                timeLeft <= 1 ? 'text-red-400' : 'text-sky-200'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Tur Sayacı */}
        {turnCount > 0 && phase !== 'results' && phase !== 'peek' && (
          <div className="hidden md:flex items-center gap-1.5 h-8 sm:h-10 px-3 rounded-xl bg-black/25 border border-[#e8c468]/25 shrink-0">
            <span className="text-[9px] uppercase tracking-[0.15em] text-emerald-100/55 font-extrabold">
              {t.round}
            </span>
            <span className="font-extrabold text-xs font-['JetBrains_Mono'] text-[#f7e2ab]">
              #{turnCount}
            </span>
          </div>
        )}

        {/* Kimin Cambio Dediğini Gösteren Kalıcı Alt Bar Rozeti */}
        {cambioCaller !== null && phase !== 'results' && (
          <div className="hidden sm:flex items-center gap-1.5 h-8 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-amber-500/20 border border-amber-300/45 shrink-0">
            <span className="text-[11px] sm:text-xs font-bold text-[#fdf6e3] truncate max-w-[120px]">
              {cambioCallerName
                ? lang === 'tr'
                  ? `${cambioCallerName} Cambio`
                  : `${cambioCallerName} Cambio`
                : 'CAMBIO'}
            </span>
            {remainingTurns !== undefined && remainingTurns > 0 && (
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-black/30 text-amber-200">
                {remainingTurns}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── SAĞ: 3D AKSİYON BUTONLARI (CAMBIO / TEKRAR OYNA / YENİ EL) ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
        {phase === 'results' && onPlayAgain && (
          <button
            type="button"
            className="btn-gold-3d h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shrink-0"
            onClick={onPlayAgain}
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{t.playAgain}</span>
          </button>
        )}

        {myTurn && phase === 'draw' && cambioCaller === null && (
          <button
            type="button"
            className="btn-crimson-3d h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl font-black text-[10px] sm:text-xs tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shrink-0"
            onClick={onCallCambio}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-300" />
            <span>CAMBIO!</span>
          </button>
        )}

        {/* Yeni El / Sıfırla Butonu */}
        <button
          type="button"
          className={`flex items-center gap-1 sm:gap-1.5 h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl text-[10px] sm:text-xs font-extrabold cursor-pointer shrink-0 ${
            resetCountdown !== null ? 'btn-crimson-3d' : 'btn-emerald-3d'
          }`}
          onClick={onReset}
          title={lang === 'tr' ? 'Yeni el dağıt' : 'Deal new hand'}
        >
          <svg
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--gold-light)] ${
              resetCountdown !== null ? 'animate-spin' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="tracking-wide whitespace-nowrap">
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
