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
  lang,
}: {
  entry: GameLogEntry;
  cfg: { color: string; label: string };
  isLatest: boolean;
  lang: 'tr' | 'en';
}) {
  const detailText = lang === 'en' && entry.detailEn ? entry.detailEn : entry.detail;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div
        className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
          isLatest
            ? 'bg-white/[0.08] border border-[var(--gold)]/30'
            : 'hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        {/* Minimalist Durum Çizgisi */}
        <div
          className="w-1 h-7 rounded-full shrink-0 mt-0.5"
          style={{ backgroundColor: cfg.color }}
        />

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-[12px] text-white truncate">
                {entry.playerName}
              </span>
              <span
                className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
                style={{
                  background: cfg.color + '20',
                  color: cfg.color,
                }}
              >
                {cfg.label}
              </span>
            </div>
            <span className="text-[10px] text-white/35 shrink-0 font-mono">
              {formatTime(entry.timestamp)}
            </span>
          </div>
          {detailText && (
            <p className="text-[11px] text-white/70 mt-0.5 leading-snug">
              {detailText}
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

  const ACTION_CONFIG: Record<LogAction, { color: string; label: string }> = {
    draw_deck:          { color: '#60a5fa', label: t.log_draw_deck },
    draw_discard:       { color: '#34d399', label: t.log_draw_discard },
    swap:               { color: '#fbbf24', label: t.log_swap },
    discard:            { color: '#f87171', label: t.log_discard },
    power_peek_own:     { color: '#a78bfa', label: t.log_power_peek_own },
    power_peek_other:   { color: '#818cf8', label: t.log_power_peek_other },
    power_blind_swap:   { color: '#fb923c', label: t.log_power_blind_swap },
    power_spy_swap:     { color: '#f472b6', label: t.log_power_spy_swap },
    power_skip:         { color: '#9ca3af', label: t.log_power_skip },
    cambio:             { color: '#ef4444', label: t.log_cambio },
    stick_ok:           { color: '#10b981', label: t.log_stick_ok },
    stick_opponent_ok:  { color: '#10b981', label: t.log_stick_opponent_ok },
    stick_fail:         { color: '#ef4444', label: t.log_stick_fail },
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog.length]);

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8, 36, 25, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28)',
      }}
    >
      {/* Başlık */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          <h3 className="text-white/90 font-bold text-xs uppercase tracking-[0.12em]">
            {t.logTitle}
          </h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-white/60">
          {t.logMoves(gameLog.length)}
        </span>
      </div>

      {/* Log Listesi */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1 scrollbar-thin">
        {gameLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 py-8">
            <span className="text-white/25 text-xs font-medium">{t.logEmpty}</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {gameLog.map((entry, idx) => (
              <LogItem
                key={entry.id}
                entry={entry}
                cfg={ACTION_CONFIG[entry.action]}
                isLatest={idx === gameLog.length - 1}
                lang={lang}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
