import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

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
    <div
      className="flex flex-col rounded-2xl overflow-hidden shrink-0"
      style={{
        background: 'rgba(8, 36, 25, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28)',
      }}
    >
      {/* Başlık */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          <h3 className="text-white/90 font-bold text-xs uppercase tracking-[0.12em]">
            {t.leaderboardTitle}
          </h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-white/60">
          {roundsPlayed > 0
            ? lang === 'tr'
              ? `${roundsPlayed} El`
              : `${roundsPlayed} Hand(s)`
            : lang === 'tr'
              ? '1. El'
              : 'Hand 1'}
        </span>
      </div>

      {/* Sıralama Listesi */}
      <div className="flex flex-col p-3 space-y-1.5">
        {displayList.map((entry, index) => {
          const isFirst = index === 0 && roundsPlayed > 0;
          const playerState = players.find(p => p.id === entry.playerId);

          return (
            <motion.div
              key={entry.playerId}
              layout
              className={`flex flex-col px-3 py-2 rounded-xl border transition-all ${
                isFirst
                  ? 'bg-[var(--gold)]/12 border-[var(--gold)]/45'
                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isFirst
                        ? 'bg-[var(--gold)] text-black'
                        : 'bg-white/[0.08] text-white/60'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-white font-bold text-xs truncate">
                    {entry.nickname}
                  </span>
                  {playerState?.isCurrentTurn && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {roundsPlayed > 0 ? (
                    <span className="font-bold text-xs font-mono text-[var(--gold)]">
                      {entry.totalScore} pt
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-white/45 font-mono">
                      {t.cardCount(playerState?.cards.length ?? 4)}
                    </span>
                  )}
                </div>
              </div>

              {entry.handScores.length > 0 && (
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/[0.05]">
                  <span className="text-[9px] text-white/40 uppercase tracking-wider">
                    {t.roundScores}
                  </span>
                  <div className="flex gap-1 overflow-x-auto">
                    {entry.handScores.map((score, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap ${
                          score < 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/[0.06] text-white/75'
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
