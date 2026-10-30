export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  bestScore: number | null;
  currentStreak: number;
}

const STATS_KEY = 'cambio_player_stats_v1';

export function getPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return { gamesPlayed: 0, wins: 0, bestScore: null, currentStreak: 0 };
    }
    return JSON.parse(raw) as PlayerStats;
  } catch {
    return { gamesPlayed: 0, wins: 0, bestScore: null, currentStreak: 0 };
  }
}

export function recordGameResult(myScore: number, didWin: boolean): PlayerStats {
  const cur = getPlayerStats();
  const next: PlayerStats = {
    gamesPlayed: cur.gamesPlayed + 1,
    wins: cur.wins + (didWin ? 1 : 0),
    bestScore:
      cur.bestScore === null ? myScore : Math.min(cur.bestScore, myScore),
    currentStreak: didWin ? cur.currentStreak + 1 : 0,
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {}
  return next;
}
