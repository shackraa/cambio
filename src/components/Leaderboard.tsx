import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

const MEDAL_ICONS = ['🥇', '🥈', '🥉', '4.'];

export function Leaderboard() {
  const leaderboard = useGameStore(s => s.leaderboard);
  const players = useGameStore(s => s.players);
  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  // Henüz bitmiş el yoksa bile masadaki mevcut oyuncuları 0 puanla hazır göster
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
      className="flex flex-col rounded-2xl overflow-hidden shrink-0 shadow-lg"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 62, 43, 0.78) 0%, rgba(7, 38, 26, 0.85) 100%)',
        border: '1px solid rgba(212, 168, 67, 0.22)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Başlık */}
      <div
        className="px-5 py-3.5 flex items-center justify-between bg-emerald-950/45"
        style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.15)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 rounded-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">
            🏆 {t.leaderboardTitle}
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/25">
          {roundsPlayed > 0
            ? lang === 'tr'
              ? `${roundsPlayed} El`
              : `${roundsPlayed} Hand(s)`
            : lang === 'tr'
              ? '1. El Oynanıyor'
              : 'Hand 1 Active'}
        </span>
      </div>

      {/* Sıralama Listesi */}
      <div className="flex flex-col p-3.5 space-y-2">
        {displayList.map((entry, index) => {
          const isFirst = index === 0 && roundsPlayed > 0;
          const playerState = players.find(p => p.id === entry.playerId);

          return (
            <motion.div
              key={entry.playerId}
              layout
              className={`flex flex-col px-3.5 py-2.5 rounded-xl border transition-all ${
                isFirst
                  ? 'bg-[var(--gold)]/15 border-[var(--gold)]/50 shadow-sm'
                  : 'bg-emerald-950/45 border-emerald-400/12 hover:bg-emerald-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm w-5 text-center font-black text-emerald-200/70 shrink-0">
                    {roundsPlayed > 0 ? MEDAL_ICONS[index] ?? `${index + 1}.` : `${index + 1}.`}
                  </span>
                  <span className="text-white font-bold text-xs truncate">
                    {entry.nickname}
                  </span>
                  {playerState?.isCurrentTurn && (
                    <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse shrink-0" title="Sıra onda" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {roundsPlayed > 0 ? (
                    <span
                      className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                        isFirst
                          ? 'bg-[var(--gold)] text-black'
                          : 'bg-emerald-950/80 text-[var(--gold)] border border-[var(--gold)]/25'
                      }`}
                    >
                      {entry.totalScore} pt
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-200/50 px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-400/10">
                      {t.cardCount(playerState?.cards.length ?? 4)}
                    </span>
                  )}
                </div>
              </div>

              {entry.handScores.length > 0 && (
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5">
                  <span className="text-[9px] text-emerald-100/45 uppercase tracking-wider font-semibold">
                    {t.roundScores}
                  </span>
                  <div className="flex gap-1 overflow-x-auto">
                    {entry.handScores.map((score, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                          score < 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-emerald-950/70 text-emerald-100/80 border border-white/10'
                        }`}
                        title={`${i + 1}. El Puanı`}
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
