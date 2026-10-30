import type { Card } from '../types/game';

/**
 * Bot Hafızası (Hile Yok!)
 * Botlar SADECE gerçekten gördükleri kartları bilir:
 *  - Oyun başında seçip baktıkları 2 kart
 *  - Kendi çektikleri ve eline aldıkları kart
 *  - 7/8 (kendine bak), 9/10 (rakibe bak) ve Siyah K (gör + takas) ile baktıkları kartlar
 * Kör takasla eline gelen kartı, ceza kartını veya hiç bakmadığı kartları BİLMEZ.
 * Kart id'leri oyun boyunca sabit olduğu için hafıza id bazlıdır (kart yer değiştirse bile doğru kalır).
 */

type MemCard = Pick<Card, 'rank' | 'suit' | 'value'>;

const memory = new Map<number, Map<string, MemCard>>();

/** Bilinmeyen bir kartın ortalama beklenen puanı (54 kartlık destenin ortalaması ≈ 5.9) */
export const UNKNOWN_CARD_ESTIMATE = 6;

export function resetBotMemory() {
  memory.clear();
}

export function rememberCard(botSeat: number, card: Card | undefined | null) {
  if (!card || card.isGhost) return;
  let m = memory.get(botSeat);
  if (!m) {
    m = new Map();
    memory.set(botSeat, m);
  }
  m.set(card.id, { rank: card.rank, suit: card.suit, value: card.value });
}

export function knowsCard(botSeat: number, card: Card | undefined | null): boolean {
  if (!card) return false;
  return memory.get(botSeat)?.has(card.id) ?? false;
}

export function recalledCard(botSeat: number, card: Card | undefined | null): MemCard | null {
  if (!card) return null;
  return memory.get(botSeat)?.get(card.id) ?? null;
}

/** Botun bir kart için tahmini puanı: biliyorsa gerçek değer, bilmiyorsa ortalama tahmin */
export function estimateValue(botSeat: number, card: Card | undefined | null): number {
  const r = recalledCard(botSeat, card);
  return r ? r.value : UNKNOWN_CARD_ESTIMATE;
}
