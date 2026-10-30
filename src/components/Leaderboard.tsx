import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';
import { formatPlayerName } from '../utils/formatPlayerName';

const RANK_STYLES = [
  {
    bg: 'linear-gradient(135deg, #fae19c 0%, #c79531 100%)',
    text: '#1c1302',
    border: '#fff3c4',
  },
  {
    bg: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    text: '#0f172a',
    border: '#f8fafc',
  },
  {
    bg: 'linear-gradient(135deg, #fdba74 0%, #b45309 100%)',
    text: '#1c1302',
    border: '#ffedd5',
  },
  {
    bg: 'rgba(255, 255, 255, 0.08)',
    text: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.15)',
  },
];

export function Leaderboard() {
  const leaderboard = useGameStore(s => s.leaderboard);
  const players = useGameStore(s => s.players);
  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const displayList =
    leaderboard && leaderboard.length > 0
      ? [...leaderboard].sort((a, b) => a.totalScore - b.totalScore)
      : players.map(p => ({
          playerId: p.id,
          nickname: p.nickname,
          handScores: [] as number[],
          totalScore: 0,
        }));

  const roundsPlayed = displayList[0]?.handScores.length ?? 0;

  return (
    <div className="luxury-panel flex flex-col rounded-[24px] overflow-hidden shrink-0">
      {/* Lüks Başlık */}
      <div className="luxury-panel-header flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--gold-light)]/25 to-[var(--gold)]/10 border border-[var(--gold)]/45 flex items-center justify-center shadow-inner">
            <svg className="w-4 h-4 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h3 className="text-amber-50 font-extrabold text-xs uppercase tracking-[0.16em] font-['Cinzel']">
              {t.leaderboardTitle}
            </h3>
            <span className="text-[10px] text-emerald-200/55 font-medium mt-0.5">
              {lang === 'tr' ? 'En Düşük Skor Liderdir' : 'Lowest Score Leads'}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-black/35 text-[var(--gold-light)] border border-[var(--gold)]/30 font-['JetBrains_Mono']">
          {roundsPlayed > 0
            ? lang === 'tr'
              ? `${roundsPlayed}. EL`
              : `HAND ${roundsPlayed}`
            : lang === 'tr'
              ? 'CANLI'
              : 'LIVE'}
        </span>
      </div>

      {/* Sıralama Listesi */}
      <div className="flex flex-col px-4 py-3.5 space-y-2">
        {displayList.map((entry, index) => {
          const isFirst = index === 0 && roundsPlayed > 0;
          const playerState = players.find(p => p.id === entry.playerId);
          const rankStyle = RANK_STYLES[index] ?? RANK_STYLES[3];

          return (
            <motion.div
              key={entry.playerId}
              layout
              className={`flex flex-col px-3.5 py-2.5 rounded-2xl border transition-all ${
                isFirst
                  ? 'bg-gradient-to-r from-[var(--gold)]/22 via-amber-900/20 to-black/30 border-[var(--gold)]/55 shadow-[0_6px_18px_rgba(212,168,67,0.18)]'
                  : playerState?.isCurrentTurn
                    ? 'bg-emerald-900/35 border-emerald-400/35'
                    : 'bg-black/25 border-white/[0.06] hover:bg-black/35'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Madalyon Sıra Rozeti */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black font-['JetBrains_Mono'] shrink-0 shadow-sm"
                    style={{
                      background: rankStyle.bg,
                      color: rankStyle.text,
                      border: `1px solid ${rankStyle.border}`,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white font-bold text-xs truncate">
                      {formatPlayerName(entry.nickname, lang)}
                    </span>
                    {playerState?.isCurrentTurn && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--gold)]/20 border border-[var(--gold)]/45 text-[9px] font-extrabold text-[var(--gold-light)] uppercase shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-light)] animate-pulse" />
                        {lang === 'tr' ? 'Sırada' : 'Turn'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Orta: Eldeki kart adedi minyatür göstergesi */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]" title={t.cardCount(playerState?.cards.length ?? 4)}>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.min(6, playerState?.cards.length ?? 4) }).map((_, ci) => (
                      <div
                        key={ci}
                        className="w-2.5 h-3.5 rounded-[2px] bg-gradient-to-b from-[#29407c] to-[#121e42] border border-[var(--gold)]/60"
                      />
                    ))}
                  </div>
                </div>

                {/* Sağ: Toplam Puan */}
                <span
                  className={`font-black text-xs font-['JetBrains_Mono'] px-3 py-1 rounded-xl border shrink-0 ${
                    isFirst
                      ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black border-amber-100 shadow-xs'
                      : 'bg-black/40 text-[var(--gold-light)] border-[var(--gold)]/25'
                  }`}
                >
                  {entry.totalScore} pt
                </span>
              </div>

              {entry.handScores.length > 0 && (
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.06]">
                  <span className="text-[9px] text-emerald-100/45 uppercase tracking-wider font-bold">
                    {t.roundScores}
                  </span>
                  <div className="flex gap-1 overflow-x-auto">
                    {entry.handScores.map((score, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-['JetBrains_Mono'] font-bold whitespace-nowrap ${
                          score < 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-black/35 text-amber-100/80 border border-white/10'
                        }`}
                      >
                        {score > 0 ? `+${score}` : score}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
