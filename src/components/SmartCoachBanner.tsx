import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { getPower } from '../engine/gameEngine';

interface SmartCoachBannerProps {
  visible: boolean;
  mySeat: number;
  onDismiss: () => void;
}

export function SmartCoachBanner({ visible, mySeat, onDismiss }: SmartCoachBannerProps) {
  const lang = useLangStore((s) => s.lang);
  const tr = lang === 'tr';

  const phase = useGameStore((s) => s.phase);
  const peekState = useGameStore((s) => s.peekState);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const drawnCard = useGameStore((s) => s.drawnCard);
  const drawnFrom = useGameStore((s) => s.drawnFrom);
  const discardPile = useGameStore((s) => s.discardPile);
  const activePower = useGameStore((s) => s.activePower);

  if (!visible || phase === 'results' || phase === 'waiting') return null;

  const myTurn = currentTurn === mySeat;
  const topDiscard = discardPile[discardPile.length - 1];

  const getCoachHint = (): { title: string; body: string } | null => {
    if (phase === 'peek') {
      if (peekState === 'select') {
        return {
          title: tr ? 'Koç · İlk Bakış' : 'Coach · First Peek',
          body: tr
            ? 'Alttaki kendi 2 kartına dokun ve yerlerini ezberle. Kırmızı K (−1) ve Joker (0) altındır!'
            : 'Tap 2 of your own cards and memorize them. Red K (−1) and Joker (0) are gold!',
        };
      }
      if (peekState === 'reveal') {
        return {
          title: tr ? 'Koç · Hafızaya Al' : 'Coach · Memorize',
          body: tr
            ? 'Bu 2 kartın sırasını aklında tut; birazdan kapalı hale dönecekler.'
            : 'Remember these two slots — they will flip face-down shortly.',
        };
      }
      return null;
    }

    if (phase === 'stick_window' && topDiscard) {
      return {
        title: tr ? `Koç · Yapıştırma (${topDiscard.rank})` : `Coach · Stick (${topDiscard.rank})`,
        body: tr
          ? `Masada ${topDiscard.rank} var! Elinde ${topDiscard.rank} olduğuna eminsen hızla tıkla; yanlışsa +1 ceza gelir.`
          : `${topDiscard.rank} is on top! If you know you have a ${topDiscard.rank}, tap it fast — wrong guess adds +1 penalty.`,
      };
    }

    if (phase === 'give_card' && myTurn) {
      return {
        title: tr ? 'Koç · Kart Hediye Et' : 'Coach · Give a Card',
        body: tr
          ? 'Rakip kartını yapıştırdın! Şimdi kendi elindeki en yüksek/kötü kartı seçip ona gönder.'
          : 'Great opponent stick! Pick your worst card to give to that opponent.',
      };
    }

    if (phase === 'power' && myTurn && activePower) {
      const powerTips: Record<string, { tr: string; en: string }> = {
        peek_own: {
          tr: '7/8 gücü: Kendi kapalı/bilmediğin bir kartına tıkla ve gizlice öğren.',
          en: '7/8 power: Tap one of your own unknown cards to peek.',
        },
        peek_other: {
          tr: '9/10 gücü: Bir rakibinin kapalı kartına tıklayıp değerini öğren.',
          en: '9/10 power: Tap an opponent card to spy on it.',
        },
        blind_swap: {
          tr: 'J/Q kör takas: Kendi kötü kartını, rakibin 🔒 kilitli olmayan kartıyla değiştir (veya Geç).',
          en: 'J/Q blind swap: Swap your high card with a non-locked opponent (or Skip).',
        },
        spy_swap: {
          tr: 'Siyah K casus: Önce rakibin bir kartına bak, düşükse kendi büyük kartınla değiştir!',
          en: 'Black K spy: Peek an opponent card first, then swap if it helps!',
        },
      };
      const tip = powerTips[activePower];
      return tip
        ? { title: tr ? 'Koç · Kart Gücü' : 'Coach · Card Power', body: tr ? tip.tr : tip.en }
        : null;
    }

    if (!myTurn) {
      return {
        title: tr ? 'Koç · Takip Zamanı' : 'Coach · Watch Closely',
        body: tr
          ? 'Rakiplerin hangi kartı çekip çöpe attığını izle; aynı kart elindeyse birazdan yapıştırabilirsin.'
          : 'Watch what opponents draw and discard — you can stick matching ranks right after!',
      };
    }

    if (phase === 'draw') {
      if (topDiscard && topDiscard.value <= 2) {
        return {
          title: tr ? 'Koç · Fırsat!' : 'Coach · Opportunity!',
          body: tr
            ? `Çöpte çok düşük puanlı ${topDiscard.rank} (${topDiscard.value} pt) var! Alıp elindeki büyük kartla takaslayabilirsin.`
            : `${topDiscard.rank} (${topDiscard.value} pt) is on top of Discard — take it to swap a bad card!`,
        };
      }
      return {
        title: tr ? 'Koç · Sıra Sende' : 'Coach · Your Turn',
        body: tr
          ? 'Desteden yeni kart çek. El puanın herkesten düşükse tur başında CAMBIO butonuna bas!'
          : 'Draw a card from the Deck — or call CAMBIO now if your hand is the lowest!',
      };
    }

    if (phase === 'action' && drawnCard) {
      if (drawnFrom === 'discard') {
        return {
          title: tr ? 'Koç · Kartı Yerleştir' : 'Coach · Place Card',
          body: tr
            ? 'Çöpten aldığın kartı mutlaka kendi elindeki 1 kartla değiştirmelisin.'
            : 'A card taken from Discard must be swapped into one of your slots.',
        };
      }
      const pw = getPower(drawnCard.rank, drawnCard.suit);
      if (pw) {
        return {
          title: tr ? `Koç · Güçlü Kart (${drawnCard.rank})` : `Coach · Power Card (${drawnCard.rank})`,
          body: tr
            ? `${drawnCard.rank} kartını Çöpe At dersen özel gücü açılır; istersen kendi kartınla da değiştirebilirsin.`
            : `Discard ${drawnCard.rank} directly to activate its special power, or swap it into your hand.`,
        };
      }
      if (drawnCard.value <= 2) {
        return {
          title: tr ? `Koç · Düşük Puan (${drawnCard.value} pt)` : `Coach · Low Score (${drawnCard.value} pt)`,
          body: tr
            ? `${drawnCard.rank} süper kart! Elindeki yüksek puanlı veya bilmediğin bir slotla değiştir.`
            : `${drawnCard.rank} is great! Swap it over a high or unknown slot in your hand.`,
        };
      }
      return {
        title: tr ? `Koç · Yüksek Puan (${drawnCard.value} pt)` : `Coach · High Score (${drawnCard.value} pt)`,
        body: tr
          ? `${drawnCard.rank} ağır puan taşır; daha yüksek bir kartın yoksa "Çöpe At" ile elinden çıkar.`
          : `${drawnCard.rank} adds heavy points — click "Discard" unless you are replacing something worse.`,
      };
    }

    return null;
  };

  const hint = getCoachHint();
  if (!hint) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={hint.title + hint.body}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex items-start gap-2 max-w-[260px] xl:max-w-[300px] px-3 py-2 rounded-2xl bg-black/55 backdrop-blur-md border border-[var(--gold)]/35 shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
      >
        <svg
          className="w-3.5 h-3.5 text-[var(--gold-light)] mt-0.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
        </svg>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--gold-light)] leading-tight">
            {hint.title}
          </span>
          <span className="text-[11px] text-emerald-50/90 font-medium leading-snug mt-0.5">
            {hint.body}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/45 hover:text-white text-[10px] font-bold leading-none p-0.5 cursor-pointer shrink-0"
          title={tr ? 'Koç ipuçlarını gizle' : 'Hide coach tips'}
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
