import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type GameLogEntry, type LogAction } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function LogItem({ entry, cfg }: { entry: GameLogEntry, cfg: { icon: string; color: string; label: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-3 px-5 py-2.5 rounded-lg hover:bg-white/5 transition-colors group">
        {/* İkon */}
        <span className="text-[10px] mt-1 shrink-0" style={{ color: cfg.color }}>{cfg.icon}</span>
        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[11px] truncate" style={{ color: cfg.color }}>
              {entry.playerName}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.color}44` }}
            >
              {cfg.label}
            </span>
          </div>
          {entry.detail && (
            <p className="text-[10px] text-white/45 mt-0.5 leading-tight">{entry.detail}</p>
          )}
        </div>
        {/* Saat */}
        <span className="text-[9px] text-white/25 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(entry.timestamp)}
        </span>
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
    draw_deck:          { icon: '●', color: '#60a5fa', label: t.log_draw_deck      },
    draw_discard:       { icon: '●', color: '#34d399', label: t.log_draw_discard   },
    swap:               { icon: '●', color: '#fbbf24', label: t.log_swap           },
    discard:            { icon: '●', color: '#f87171', label: t.log_discard        },
    power_peek_own:     { icon: '●', color: '#a78bfa', label: t.log_power_peek_own },
    power_peek_other:   { icon: '●', color: '#a78bfa', label: t.log_power_peek_other},
    power_blind_swap:   { icon: '●', color: '#fb923c', label: t.log_power_blind_swap},
    power_spy_swap:     { icon: '●', color: '#fb923c', label: t.log_power_spy_swap  },
    power_skip:         { icon: '●', color: '#6b7280', label: t.log_power_skip      },
    cambio:             { icon: '●', color: '#ef4444', label: t.log_cambio          },
    stick_ok:           { icon: '●', color: '#10b981', label: t.log_stick_ok        },
    stick_opponent_ok:  { icon: '●', color: '#10b981', label: t.log_stick_opponent_ok},
    stick_fail:         { icon: '●', color: '#ef4444', label: t.log_stick_fail      },
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog.length]);

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Başlık */}
      <div
        className="px-6 py-5 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="w-1.5 h-5 rounded-full bg-[var(--gold)]"></div>
        <div>
          <h3 className="text-white font-bold text-xs tracking-wide">{t.logTitle}</h3>
          <p className="text-white/30 text-[9px]">{t.logMoves(gameLog.length)}</p>
        </div>
      </div>

      {/* Loglar */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {gameLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
            <span className="text-xl opacity-30 font-light">—</span>
            <p className="text-white/25 text-[10px] text-center uppercase tracking-widest whitespace-pre-wrap">{t.logEmpty}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {gameLog.map(entry => (
              <LogItem key={entry.id} entry={entry} cfg={ACTION_CONFIG[entry.action]} />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
