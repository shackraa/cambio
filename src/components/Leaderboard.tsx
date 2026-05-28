import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function Leaderboard() {
  const leaderboard = useGameStore(s => s.leaderboard);
  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-black/50 backdrop-blur-md border border-[var(--gold)]/30 rounded-2xl p-6 shadow-xl text-white">
        <h3 className="text-[var(--gold)] font-black text-center mb-5 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
          <span className="text-lg">🏆</span> {t.leaderboardTitle}
        </h3>
        <div className="text-center text-white/40 text-xs italic py-4">
          {t.noGamesPlayed}
        </div>
      </div>
    );
  }

  // Skorlara göre sırala (Düşük skor daha iyi)
  const sorted = [...leaderboard].sort((a, b) => a.totalScore - b.totalScore);

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shrink-0 bg-black/50 backdrop-blur-md border border-[var(--gold)]/30 shadow-xl"
    >
      {/* Başlık */}
      <div
        className="px-6 py-4 flex items-center gap-3 border-b border-white/10"
      >
        <div className="w-1.5 h-4 rounded-full bg-[var(--gold)]"></div>
        <h3 className="text-white font-bold text-sm tracking-wide">{t.leaderboardTitle}</h3>
      </div>

      <div className="flex flex-col px-4 py-3 space-y-2">
        {sorted.map((entry, index) => (
          <div
            key={entry.playerId}
            className="flex flex-col px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 shadow-sm transition-all hover:bg-white/5"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <span className="text-white/40 font-bold text-sm w-4">{index + 1}.</span>
                <span className="text-white font-bold text-sm">{entry.nickname}</span>
              </div>
              <span className="text-[var(--gold)] font-bold text-base">{entry.totalScore}</span>
            </div>
            
            {entry.handScores.length > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">{t.roundScores}</span>
                <div className="flex gap-1 scrollbar-hide overflow-x-auto">
                  {entry.handScores.map((score, i) => (
                    <div key={i} className="px-1.5 py-0.5 bg-black/40 rounded text-[10px] text-white/70 whitespace-nowrap" title={`${i+1}. El Puanı`}>
                      {score}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
