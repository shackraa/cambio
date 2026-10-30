export function formatPlayerName(
  nickname: string | undefined | null,
  lang: 'tr' | 'en'
): string {
  if (!nickname) return lang === 'tr' ? 'Sen' : 'You';
  const trimmed = nickname.trim();
  if (trimmed === 'You' || trimmed === 'Sen' || trimmed === 'Oyuncu' || trimmed === 'Player') {
    return lang === 'tr' ? 'Sen' : 'You';
  }
  return trimmed;
}
