import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { GameCard } from './GameCard';
import { SoundManager } from '../utils/SoundManager';
import { useLangStore } from '../store/useLangStore';
import { track } from '../utils/analytics';
import type { Card } from '../types/game';

interface InteractiveTutorialModalProps {
  open: boolean;
  onClose: () => void;
  onStartPracticeMatch?: () => void;
  forcedLang?: 'tr' | 'en';
}

type TutorialStep = 0 | 1 | 2 | 3 | 4;

const INITIAL_HAND: Card[] = [
  { id: 'tut-k-red', rank: 'K', suit: 'hearts', value: -1, isRevealed: false, isPenalty: false },
  { id: 'tut-q-spade', rank: 'Q', suit: 'spades', value: 10, isRevealed: false, isPenalty: false },
  { id: 'tut-7-dia', rank: '7', suit: 'diamonds', value: 7, isRevealed: false, isPenalty: false },
  { id: 'tut-2-club', rank: '2', suit: 'clubs', value: 2, isRevealed: false, isPenalty: false },
];

const DRAWN_ACE: Card = {
  id: 'tut-a-heart',
  rank: 'A',
  suit: 'hearts',
  value: 1,
  isRevealed: true,
  isPenalty: false,
};

const DRAWN_SEVEN: Card = {
  id: 'tut-7-spade',
  rank: '7',
  suit: 'spades',
  value: 7,
  isRevealed: true,
  isPenalty: false,
};

const OPP_SEVEN: Card = {
  id: 'tut-7-club',
  rank: '7',
  suit: 'clubs',
  value: 7,
  isRevealed: true,
  isPenalty: false,
};

export function InteractiveTutorialModal({
  open,
  onClose,
  onStartPracticeMatch,
  forcedLang,
}: InteractiveTutorialModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <InteractiveTutorialContent
          onClose={onClose}
          onStartPracticeMatch={onStartPracticeMatch}
          forcedLang={forcedLang}
        />
      )}
    </AnimatePresence>
  );
}

function InteractiveTutorialContent({
  onClose,
  onStartPracticeMatch,
  forcedLang,
}: Omit<InteractiveTutorialModalProps, 'open'>) {
  const storeLang = useLangStore((s) => s.lang);
  const tr = (forcedLang ?? storeLang) === 'tr';

  const [step, setStep] = useState<TutorialStep>(0);
  // Step 0: Peek 2 cards (slots 0 & 1)
  const [peekedSlots, setPeekedSlots] = useState<number[]>([]);
  // Hand & Discard state across tutorial
  const [hand, setHand] = useState<Card[]>(INITIAL_HAND);
  const [discard, setDiscard] = useState<Card[]>([]);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  // Step 1 sub-phase: 'draw' -> 'swap' -> 'done'
  const [step1Done, setStep1Done] = useState(false);
  // Step 2 sub-phase: 'draw' -> 'discard' -> 'peek_own' -> 'done'
  const [step2Sub, setStep2Sub] = useState<'draw' | 'discard' | 'peek_own' | 'done'>('draw');
  // Step 3 (Stick): 'ready' -> 'stuck'
  const [step3Stuck, setStep3Stuck] = useState(false);
  // Step 4 (Cambio): 'ready' -> 'won'
  const [step4Won, setStep4Won] = useState(false);

  useEffect(() => {
    track('tutorial_started');
  }, []);

  // Adım değişiminde tahtayı deterministik olarak hazırla
  const goToStep = (target: TutorialStep) => {
    setStep(target);
    setDrawnCard(null);
    if (target === 0) {
      setPeekedSlots([]);
      setHand(INITIAL_HAND.map((c) => ({ ...c, isRevealed: false })));
      setDiscard([]);
    } else if (target === 1) {
      setStep1Done(false);
      setHand(INITIAL_HAND.map((c) => ({ ...c, isRevealed: false })));
      setDiscard([]);
    } else if (target === 2) {
      setStep2Sub('draw');
      setHand([
        { ...INITIAL_HAND[0], isRevealed: false },
        { ...DRAWN_ACE, isRevealed: false },
        { ...INITIAL_HAND[2], isRevealed: false },
        { ...INITIAL_HAND[3], isRevealed: false },
      ]);
      setDiscard([{ ...INITIAL_HAND[1], isRevealed: true }]);
    } else if (target === 3) {
      setStep3Stuck(false);
      setHand([
        { ...INITIAL_HAND[0], isRevealed: false },
        { ...DRAWN_ACE, isRevealed: false },
        { ...INITIAL_HAND[2], isRevealed: false },
        { ...INITIAL_HAND[3], isRevealed: false },
      ]);
      setDiscard([{ ...OPP_SEVEN, isRevealed: true }]);
    } else if (target === 4) {
      setStep4Won(false);
      setHand([
        { ...INITIAL_HAND[0], isRevealed: false },
        { ...DRAWN_ACE, isRevealed: false },
        { ...INITIAL_HAND[3], isRevealed: false },
      ]);
      setDiscard([{ ...INITIAL_HAND[2], isRevealed: true }]);
    }
  };

  const handleCardClick = (pos: number) => {
    if (step === 0) {
      if (pos > 1 || peekedSlots.includes(pos)) return;
      SoundManager.playCardFlip();
      const next = [...peekedSlots, pos];
      setPeekedSlots(next);
      setHand((prev) =>
        prev.map((c, idx) => (idx === pos ? { ...c, isRevealed: true } : c))
      );
      return;
    }

    if (step === 1 && drawnCard && pos === 1 && !step1Done) {
      SoundManager.playCardDrop();
      const swappedOut = hand[1];
      setDiscard([{ ...swappedOut, isRevealed: true }]);
      setHand((prev) =>
        prev.map((c, idx) => (idx === 1 ? { ...DRAWN_ACE, isRevealed: false } : c))
      );
      setDrawnCard(null);
      setStep1Done(true);
      return;
    }

    if (step === 2 && step2Sub === 'peek_own' && pos === 2) {
      SoundManager.playCardFlip();
      setHand((prev) =>
        prev.map((c, idx) => (idx === 2 ? { ...c, isRevealed: true } : c))
      );
      setStep2Sub('done');
      return;
    }

    if (step === 3 && !step3Stuck && pos === 2) {
      SoundManager.playStick();
      const stuck = hand[2];
      setDiscard((prev) => [...prev, { ...stuck, isRevealed: true }]);
      setHand((prev) => prev.filter((_, idx) => idx !== 2));
      setStep3Stuck(true);
    }
  };

  const handleDeckClick = () => {
    if (step === 1 && !drawnCard && !step1Done) {
      SoundManager.playCardDraw();
      setDrawnCard(DRAWN_ACE);
    } else if (step === 2 && step2Sub === 'draw') {
      SoundManager.playCardDraw();
      setDrawnCard(DRAWN_SEVEN);
      setStep2Sub('discard');
    }
  };

  const handleDiscardDrawn = () => {
    if (step === 2 && step2Sub === 'discard' && drawnCard) {
      SoundManager.playCardDrop();
      setDiscard((prev) => [...prev, { ...drawnCard, isRevealed: true }]);
      setDrawnCard(null);
      setStep2Sub('peek_own');
    }
  };

  const handleCallCambio = () => {
    if (step !== 4 || step4Won) return;
    SoundManager.playCambio();
    setHand((prev) => prev.map((c) => ({ ...c, isRevealed: true })));
    setStep4Won(true);
    try {
      localStorage.setItem('cambio_tutorial_completed', 'true');
    } catch {
      /* localStorage erişilemezse sessizce geç */
    }
    track('tutorial_completed');
  };

  const STEP_META: Array<{
    badge: string;
    title: string;
    prompt: string;
    subTip: string;
    canAdvance: boolean;
  }> = [
    {
      badge: tr ? 'ADIM 1/5 · AMAÇ & HAFIZA' : 'STEP 1/5 · GOAL & MEMORY',
      title: tr ? 'İlk 2 Kartını Ezberle' : 'Memorize 2 Starting Cards',
      prompt:
        peekedSlots.length < 2
          ? tr
            ? 'Cambio’da amaç en DÜŞÜK toplam puana ulaşmaktır. Başlarken sadece 2 kartına bakabilirsin. Parlayan ilk iki kartına tıkla!'
            : 'Goal: get the LOWEST total score. At the start you may peek at 2 cards. Tap the two glowing cards!'
          : tr
            ? 'Süper! 1. kart Kırmızı Papaz (-1 pt — oyunun en iyi kartı!), 2. kart Kız (10 pt — ağır puan!). Yerlerini aklında tut.'
            : 'Great! Slot #1 is Red King (-1 pt — best card in the game!), Slot #2 is Queen (10 pt — heavy!). Remember their spots.',
      subTip: tr
        ? 'İpucu: K♥/K♦ = -1 puan · Joker = 0 puan · J/Q/Siyah K = 10 puan'
        : 'Tip: Red K = -1 pt · Joker = 0 pt · J/Q/Black K = 10 pt',
      canAdvance: peekedSlots.length >= 2,
    },
    {
      badge: tr ? 'ADIM 2/5 · ÇEK & DEĞİŞTİR' : 'STEP 2/5 · DRAW & SWAP',
      title: tr ? 'Kötü Kartı Düşükle Değiştir' : 'Swap High Card for Low',
      prompt: step1Done
        ? tr
          ? 'Harika! 10 puanlık Q♠ çöpe gitti, yerine sadece 1 puanlık A♥ geldi! El toplamın hızla düştü.'
          : 'Awesome! 10-pt Queen went to Discard, replaced by a 1-pt Ace! Your score dropped fast.'
        : !drawnCard
          ? tr
            ? 'Az önce 2. kartının Q (10 pt) olduğunu gördün. Ondan kurtulmak için ortadaki kapalı Deste’ye tıkla ve kart çek.'
            : 'Slot #2 holds a heavy Queen (10 pt). Tap the closed Deck in the center to draw a fresh card.'
          : tr
            ? '1 puanlık As♥ geldi! Şimdi 2. sıradaki kapalı kartına (eski Q♠ yerine) tıkla ve eline yerleştir.'
            : 'You drew Ace♥ (1 pt)! Tap Slot #2 (where Q♠ was) to swap it into your hand.',
      subTip: tr
        ? 'Unutma: Çöpten açık kart da alabilirsin; ama desteden çekmek sürpriz güç şansı verir.'
        : 'Note: You can also take the top Discard card, or draw blind from the Deck for powers.',
      canAdvance: step1Done,
    },
    {
      badge: tr ? 'ADIM 3/5 · ÖZEL GÜÇLER' : 'STEP 3/5 · SPECIAL POWERS',
      title: tr ? 'Gücü Aç & Gizli Kartına Bak' : 'Trigger a Power & Peek',
      prompt:
        step2Sub === 'draw'
          ? tr
            ? 'Desteden 7, 8, 9, 10, J, Q veya Siyah Papaz çekip doğrudan çöpe atarsan özel güç açılır! Deste’ye tıklayıp çek.'
            : 'Draw 7, 8, 9, 10, J, Q or Black K from Deck and discard it to activate a power! Tap Deck.'
          : step2Sub === 'discard'
            ? tr
              ? '7♠ çektin! Gücünü kullanmak için "Çöpe At & Gücü Kullan" butonuna bas.'
              : 'You drew 7♠! Click "Discard & Use Power" to activate its ability.'
            : step2Sub === 'peek_own'
              ? tr
                ? '7/8 Gücü: Kendi bilmediğin bir kartına gizlice bakabilirsin! Sağdaki 3. kartına tıkla.'
                : '7/8 Power: Peek at one of your own unknown cards! Tap your highlighted Slot #3.'
              : tr
                ? 'Müthiş! 3. kartının 7♦ olduğunu öğrendin. (9/10 rakibe bakar, J/Q kör takas yapar, Siyah K görüp takaslar.)'
                : 'Nice! You spotted 7♦ in Slot #3. (9/10 peeks opponent, J/Q blind swaps, Black K spies & swaps.)',
      subTip: tr
        ? 'Dikkat: Güçler sadece desteden çekilip doğrudan çöpe atılınca çalışır!'
        : 'Remember: Powers only trigger when drawn from the Deck and discarded immediately.',
      canAdvance: step2Sub === 'done',
    },
    {
      badge: tr ? 'ADIM 4/5 · YAPIŞTIRMA (STICK)' : 'STEP 4/5 · STICKING',
      title: tr ? 'Refleks! Aynı Kartı Yapıştır' : 'Quick! Stick a Matching Card',
      prompt: !step3Stuck
        ? tr
          ? 'Rakibin çöpe 7♣ attı! Az önce 3. kartının 7♦ olduğunu gördün. Sıranı beklemeden hemen 3. kartına tıkla ve elinden kurtul!'
          : 'An opponent discarded 7♣! You know Slot #3 is 7♦. Tap Slot #3 immediately to stick it and drop down to 3 cards!'
        : tr
          ? 'BİNGO! Kart sayın 4’ten 3’e düştü! (Yanlış kart seçersen +1 kapalı ceza kartı alırsın; başkalarının eşleşen kartını da yapıştırabilirsin.)'
          : 'BINGO! Your hand shrank from 4 cards to 3! (Wrong sticks add a +1 penalty card; you can even stick opponents’ matching cards!)',
      subTip: tr
        ? 'Pro İpucu: Kırmızı Papaz (-1 pt) eşleşse bile çöpe atma — elde tutmak kazandırır!'
        : 'Pro Tip: Keep Red Kings (-1 pt) in your hand — never stick them away!',
      canAdvance: step3Stuck,
    },
    {
      badge: tr ? 'ADIM 5/5 · FİNAL HAMLESİ' : 'STEP 5/5 · FINAL CALL',
      title: tr ? 'CAMBIO Deyip Eli Kilitle' : 'Call CAMBIO & Lock Your Hand',
      prompt: !step4Won
        ? tr
          ? 'Elinde sadece K♥ (-1), A♥ (1) ve 2♣ (2) kaldı — toplam 2 puan! Tur başında "CAMBIO!" butonuna bas: kartların 🔒 KİLİTLENİR ve rakipler son hamlesini yapar.'
          : 'You hold only K♥ (-1), A♥ (1), 2♣ (2) — just 2 pts total! Tap "CAMBIO!" at the start of your turn: your hand LOCKS 🔒 so nobody can steal from you!'
        : tr
          ? 'TEBRİKLER! Rakiplerin puanı (14, 18, 21), senin elin 2 puan (-10 Bonus ile -8)! Artık kurallara tamamen hâkimsin.'
          : 'CONGRATS! Opponents scored (14, 18, 21) vs your 2 pts (-10 Bonus = -8)! You’re ready for the real table.',
      subTip: tr
        ? 'Uyarı: En düşük puan sende değilse +10 ceza puanı alırsın — gerçekten emin olduğunda çağır!'
        : 'Warning: If someone ties or beats your score, the caller gets a +10 pt penalty!',
      canAdvance: step4Won,
    },
  ];

  const meta = STEP_META[step];
  const topDiscard = discard[discard.length - 1] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[240] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto luxury-panel rounded-[26px] border border-[var(--gold)]/45 shadow-[0_24px_80px_rgba(0,0,0,0.65)] flex flex-col"
          >
            {/* Üst Başlık */}
            <div className="luxury-panel-header flex items-center justify-between gap-3 px-5 py-3.5 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">
                  {meta.badge}
                </span>
                <h2 className="text-base sm:text-lg font-black text-amber-50 tracking-wide">
                  {meta.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1">
                  {([0, 1, 2, 3, 4] as TutorialStep[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => goToStep(s)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        s === step
                          ? 'w-7 bg-[var(--gold)]'
                          : s < step
                            ? 'w-3 bg-emerald-400/75'
                            : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                      title={`${s + 1}/5`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Koç Mesaj Kutusu */}
            <div className="px-5 pt-4 pb-2 flex flex-col gap-2">
              <div className="rounded-2xl bg-gradient-to-r from-[#fae19c]/15 via-[#d4a843]/10 to-black/35 border border-[#e8c468]/40 p-3.5 sm:p-4">
                <p className="text-xs sm:text-sm text-amber-50 font-semibold leading-relaxed">
                  {meta.prompt}
                </p>
                <p className="text-[11px] text-emerald-200/80 font-medium mt-1.5">
                  {meta.subTip}
                </p>
              </div>
            </div>

            {/* İnteraktif Oyun Masası Simülasyonu */}
            <LayoutGroup id="tutorial-cards">
              <div
                className="mx-5 my-2 rounded-2xl p-4 sm:p-5 border border-[var(--gold)]/30 flex flex-col items-center gap-5 relative overflow-hidden"
                style={{
                  background:
                    'radial-gradient(ellipse at center, #256b54 0%, #154435 65%, #0e2e24 100%)',
                  boxShadow: 'inset 0 0 36px rgba(0,0,0,0.35)',
                }}
              >
                {/* Orta Alan: Deste, Çekilen Kart & Çöp */}
                {step >= 1 && (
                  <div className="flex items-center justify-center gap-5 sm:gap-8 min-h-[112px]">
                    {/* Deste */}
                    <div className="flex flex-col items-center gap-1.5 relative">
                      <button
                        type="button"
                        onClick={handleDeckClick}
                        disabled={
                          !(
                            (step === 1 && !drawnCard && !step1Done) ||
                            (step === 2 && step2Sub === 'draw')
                          )
                        }
                        className={`relative rounded-lg transition-transform ${
                          (step === 1 && !drawnCard && !step1Done) ||
                          (step === 2 && step2Sub === 'draw')
                            ? 'cursor-pointer hover:-translate-y-1 ring-2 ring-[#fae19c] shadow-[0_0_20px_rgba(250,225,156,0.55)]'
                            : 'cursor-default opacity-80'
                        }`}
                      >
                        <GameCard
                          card={{
                            id: 'tut-deck-top',
                            rank: 'A',
                            suit: 'spades',
                            value: 1,
                            isRevealed: false,
                            isPenalty: false,
                          }}
                          size="sm"
                        />
                        {((step === 1 && !drawnCard && !step1Done) ||
                          (step === 2 && step2Sub === 'draw')) && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[var(--gold)] text-black text-[9px] font-black uppercase whitespace-nowrap shadow">
                            {tr ? 'Çek' : 'Draw'}
                          </span>
                        )}
                      </button>
                      <span className="text-[10px] text-emerald-100/80 font-bold">
                        {tr ? 'Deste' : 'Deck'}
                      </span>
                    </div>

                    {/* Çekilen Kart (Varsa) */}
                    <AnimatePresence>
                      {drawnCard && (
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0, y: -10 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <GameCard card={drawnCard} size="sm" highlight />
                          {step === 2 && step2Sub === 'discard' && (
                            <button
                              type="button"
                              onClick={handleDiscardDrawn}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black text-[10px] font-black uppercase tracking-wider shadow cursor-pointer"
                            >
                              {tr ? 'Çöpe At & Gücü Kullan' : 'Discard & Use Power'}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Çöp Yığını */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-20 rounded-lg border-2 border-dashed border-white/25 bg-black/25 flex items-center justify-center relative">
                        {topDiscard ? (
                          <GameCard card={topDiscard} size="sm" />
                        ) : (
                          <span className="text-[10px] text-white/40 font-bold">
                            {tr ? 'Boş' : 'Empty'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-100/80 font-bold">
                        {tr ? 'Çöp' : 'Discard'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Oyuncu Eli */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3.5">
                    {hand.map((c, idx) => {
                      const shouldHighlight =
                        (step === 0 && idx <= 1 && !peekedSlots.includes(idx)) ||
                        (step === 1 && Boolean(drawnCard) && idx === 1) ||
                        (step === 2 && step2Sub === 'peek_own' && idx === 2) ||
                        (step === 3 && !step3Stuck && idx === 2);

                      return (
                        <div key={c.id} className="flex flex-col items-center gap-1 relative">
                          <GameCard
                            card={c}
                            size="md"
                            highlight={shouldHighlight}
                            canInteract={shouldHighlight}
                            onClick={() => handleCardClick(idx)}
                          />
                          <span className="text-[10px] font-bold text-emerald-100/70">
                            {step === 1 && idx === 0
                              ? 'K♥ (-1)'
                              : step === 1 && idx === 1 && !step1Done
                                ? 'Q♠ (10)'
                                : step === 3 && idx === 2
                                  ? '7♦'
                                  : `#${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 4: Cambio Butonu & Sonuç */}
                  {step === 4 && !step4Won && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCallCambio}
                      className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black font-black text-xs sm:text-sm uppercase tracking-[0.16em] shadow-[0_0_24px_rgba(250,225,156,0.6)] cursor-pointer"
                    >
                      🔒 CAMBIO!
                    </motion.button>
                  )}

                  {step === 4 && step4Won && (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-1 px-4 py-2 rounded-xl bg-emerald-950/90 border border-[var(--gold)]/60 text-center"
                    >
                      <span className="text-xs font-black text-[var(--gold-light)]">
                        {tr
                          ? '🏆 KAZANDIN! Toplam 2 − 10 Cambio Bonusu = -8 Puan'
                          : '🏆 YOU WON! Total 2 − 10 Cambio Bonus = -8 Pts'}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </LayoutGroup>

            {/* Alt Navigasyon Barı */}
            <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => (step > 0 ? goToStep((step - 1) as TutorialStep) : onClose())}
                className="btn-emerald-3d px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {step > 0 ? (tr ? '← Geri' : '← Back') : tr ? 'Kapat' : 'Close'}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => goToStep((step + 1) as TutorialStep)}
                  disabled={!meta.canAdvance}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    meta.canAdvance
                      ? 'btn-gold-3d cursor-pointer'
                      : 'bg-white/10 text-white/35 cursor-not-allowed'
                  }`}
                >
                  {tr ? 'Sonraki Adım →' : 'Next Step →'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {onStartPracticeMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartPracticeMatch();
                      }}
                      className="btn-gold-3d px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      {tr ? 'Botlarla Maça Başla →' : 'Play vs Bots →'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-emerald-3d px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {tr ? 'Tamam' : 'Done'}
                  </button>
                </div>
              )}
            </div>
        </motion.div>
    </motion.div>
  );
}
