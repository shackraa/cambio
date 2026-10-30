import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type GameLogEntry, type LogAction } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function ActionGlyph({ action, color }: { action: LogAction; color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}38, ${color}12)`,
        border: `1px solid ${color}55`,
        boxShadow: `0 4px 12px ${color}20, inset 0 1px 0 rgba(255,255,255,0.25)`,
        color,
      }}
    >
      {action === 'draw_deck' && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="5" y="3" width="14" height="18" rx="2.5" />
          <path d="M12 8v8m-3-3 3 3 3-3" />
        </svg>
      )}
      {action === 'draw_discard' && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      )}
      {action === 'swap' && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M7 10h14l-4-4" />
          <path d="M17 14H3l4 4" />
        </svg>
      )}
      {action === 'discard' && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 19V5m-5 5 5-5 5 5" />
        </svg>
      )}
      {(action === 'power_peek_own' || action === 'power_peek_other') && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      {(action === 'power_blind_swap' || action === 'power_spy_swap') && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M16 3h5v5" />
          <path d="M4 20 21 3" />
          <path d="M21 16v5h-5" />
          <path d="M15 15l6 6" />
          <path d="M4 4l5 5" />
        </svg>
      )}
      {action === 'power_skip' && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      )}
      {action === 'cambio' && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )}
      {(action === 'stick_ok' || action === 'stick_opponent_ok') && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )}
      {action === 'stick_fail' && (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
    </div>
  );
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
      initial={{ opacity: 0, x: -12, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`relative flex items-center gap-3 p-2.5 rounded-2xl transition-all ${
          isLatest
            ? 'bg-gradient-to-r from-[var(--gold)]/18 via-emerald-900/40 to-emerald-950/50 border border-[var(--gold)]/45 shadow-[0_6px_18px_rgba(0,0,0,0.28)]'
            : 'bg-black/20 hover:bg-black/30 border border-white/[0.06]'
        }`}
      >
        <ActionGlyph action={entry.action} color={cfg.color} />

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-extrabold text-[12px] text-white truncate tracking-tight">
                {entry.playerName}
              </span>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider shrink-0"
                style={{
                  background: `${cfg.color}22`,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}45`,
                }}
              >
                {cfg.label}
              </span>
            </div>
            <span className="text-[10px] text-emerald-200/40 shrink-0 font-['JetBrains_Mono']">
              {formatTime(entry.timestamp)}
            </span>
          </div>
          {detailText && (
            <p className="text-[11px] text-emerald-50/80 mt-0.5 leading-snug font-medium">
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
    power_peek_own:     { color: '#c084fc', label: t.log_power_peek_own },
    power_peek_other:   { color: '#818cf8', label: t.log_power_peek_other },
    power_blind_swap:   { color: '#fb923c', label: t.log_power_blind_swap },
    power_spy_swap:     { color: '#f472b6', label: t.log_power_spy_swap },
    power_skip:         { color: '#94a3b8', label: t.log_power_skip },
    cambio:             { color: '#ef4444', label: t.log_cambio },
    stick_ok:           { color: '#10b981', label: t.log_stick_ok },
    stick_opponent_ok:  { color: '#10b981', label: t.log_stick_opponent_ok },
    stick_fail:         { color: '#ef4444', label: t.log_stick_fail },
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog.length]);

  return (
    <div className="luxury-panel flex flex-col h-full rounded-[24px] overflow-hidden">
      {/* Lüks Başlık */}
      <div className="luxury-panel-header px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[var(--gold-light)]/25 to-[var(--gold)]/10 border border-[var(--gold)]/45 flex items-center justify-center shadow-inner">
            <svg className="w-3.5 h-3.5 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h3 className="text-amber-50 font-extrabold text-xs uppercase tracking-[0.14em] font-['Cinzel']">
              {t.logTitle}
            </h3>
            <span className="text-[9px] text-emerald-200/50 font-semibold">
              {lang === 'tr' ? 'Canlı Masa Akışı' : 'Live Table Feed'}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-black/35 text-[var(--gold-light)] border border-[var(--gold)]/30 font-['JetBrains_Mono']">
          {t.logMoves(gameLog.length)}
        </span>
      </div>

      {/* Log Listesi */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
        {gameLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2.5 py-8 text-center px-4">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[var(--gold)]/40">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="3" width="16" height="18" rx="3" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="12" y2="16" />
              </svg>
            </div>
            <p className="text-emerald-100/45 text-xs font-semibold">{t.logEmpty}</p>
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
