import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type GameLogEntry, type LogAction } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function LogItem({
  entry,
  cfg,
  isLatest,
}: {
  entry: GameLogEntry;
  cfg: { icon: string; color: string; label: string };
  isLatest: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div
        className={`flex items-start gap-2.5 px-3.5 py-2 rounded-xl transition-colors group ${
          isLatest
            ? 'bg-emerald-400/12 border border-emerald-300/20 shadow-sm'
            : 'hover:bg-white/5 border border-transparent'
        }`}
      >
        {/* İkon rozeti */}
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold"
          style={{
            background: cfg.color + '20',
            color: cfg.color,
            border: `1px solid ${cfg.color}40`,
          }}
        >
          {cfg.icon}
        </span>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-xs text-white/95 truncate">
                {entry.playerName}
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider shrink-0"
                style={{
                  background: cfg.color + '24',
                  color: cfg.color,
                }}
              >
                {cfg.label}
              </span>
            </div>
            <span className="text-[9px] text-emerald-100/35 shrink-0 font-mono">
              {formatTime(entry.timestamp)}
            </span>
          </div>
          {entry.detail && (
            <p className="text-[11px] text-emerald-50/70 mt-0.5 leading-snug">
              {entry.detail}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function GameLog() {
  const gameLog = useGameStore(s => s.gameLog);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const ACTION_CONFIG: Record<LogAction, { icon: string; color: string; label: string }> = {
    draw_deck:          { icon: '📦', color: '#60a5fa', label: t.log_draw_deck },
    draw_discard:       { icon: '♻️', color: '#34d399', label: t.log_draw_discard },
    swap:               { icon: '⇄',  color: '#fbbf24', label: t.log_swap },
    discard:            { icon: '🗑️', color: '#f87171', label: t.log_discard },
    power_peek_own:     { icon: '👁️', color: '#a78bfa', label: t.log_power_peek_own },
    power_peek_other:   { icon: '🔍', color: '#818cf8', label: t.log_power_peek_other },
    power_blind_swap:   { icon: '🔀', color: '#fb923c', label: t.log_power_blind_swap },
    power_spy_swap:     { icon: '🕵️', color: '#f472b6', label: t.log_power_spy_swap },
    power_skip:         { icon: '⏭️', color: '#9ca3af', label: t.log_power_skip },
    cambio:             { icon: '🎯', color: '#ef4444', label: t.log_cambio },
    stick_ok:           { icon: '⚡', color: '#10b981', label: t.log_stick_ok },
    stick_opponent_ok:  { icon: '🔥', color: '#10b981', label: t.log_stick_opponent_ok },
    stick_fail:         { icon: '⚠️', color: '#ef4444', label: t.log_stick_fail },
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog.length]);

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden shadow-lg"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 62, 43, 0.78) 0%, rgba(7, 38, 26, 0.85) 100%)',
        border: '1px solid rgba(212, 168, 67, 0.22)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Başlık */}
      <div
        className="px-5 py-3.5 flex items-center justify-between shrink-0 bg-emerald-950/45"
        style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.15)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 rounded-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">{t.logTitle}</h3>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-200 border border-emerald-400/20">
          {t.logMoves(gameLog.length)}
        </span>
      </div>

      {/* Loglar */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin">
        {gameLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 opacity-45">
            <span className="text-2xl">📜</span>
            <p className="text-emerald-100/60 text-[11px] text-center uppercase tracking-widest">
              {t.logEmpty}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {gameLog.map((entry, idx) => (
              <LogItem
                key={entry.id}
                entry={entry}
                cfg={ACTION_CONFIG[entry.action]}
                isLatest={idx === gameLog.length - 1}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
