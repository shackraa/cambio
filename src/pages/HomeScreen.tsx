import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useNavigate } from 'react-router-dom';
import { RulesPanel } from '../components/RulesPanel';
import { GameCard } from '../components/GameCard';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';
import { getPlayerStats } from '../utils/playerStats';
import { SoundManager } from '../utils/SoundManager';
import type { Card } from '../types/game';

interface ShowcaseCardItem {
  id: string;
  badge: string;
  pointsTr: string;
  pointsEn: string;
  titleTr: string;
  titleEn: string;
  roleTr: string;
  roleEn: string;
  descTr: string;
  descEn: string;
  card: Card;
}

const CAMBIO_CARD_LINEUP: ShowcaseCardItem[] = [
  {
    id: 'lineup-red-king',
    badge: 'K ♥ ♦',
    pointsTr: '-1 PUAN',
    pointsEn: '-1 PT',
    titleTr: 'Kırmızı Papaz (K ♥ / K ♦)',
    titleEn: 'Red King (K ♥ / K ♦)',
    roleTr: 'OYUNDAKİ EN DEĞERLİ KART',
    roleEn: 'BEST CARD IN THE GAME',
    descTr:
      'Elindeki toplam puanı 1 puan düşürür. Elinde tutmak isteyeceğin en değerli karttır; özel gücü yoktur.',
    descEn:
      'Reduces your total hand score by 1 point. The most valuable card to keep in your hand; has no active power.',
    card: {
      id: 'showcase-k-hearts',
      suit: 'hearts',
      rank: 'K',
      value: -1,
      isRevealed: true,
      isPenalty: false,
    },
  },
  {
    id: 'lineup-joker',
    badge: 'JOKER',
    pointsTr: '0 PUAN',
    pointsEn: '0 PT',
    titleTr: 'Joker',
    titleEn: 'Joker',
    roleTr: 'SIFIR YÜK',
    roleEn: 'ZERO WEIGHT',
    descTr:
      'El toplamına 0 puan ekler. Yüksek kartlarla takas etmek için mükemmel bir savunma kartıdır.',
    descEn:
      'Adds 0 points to your hand total. Ideal for replacing high-value cards in your grid.',
    card: {
      id: 'showcase-joker',
      suit: 'joker',
      rank: 'Joker',
      value: 0,
      isRevealed: true,
      isPenalty: false,
    },
  },
  {
    id: 'lineup-ace',
    badge: 'A',
    pointsTr: '1 PUAN',
    pointsEn: '1 PT',
    titleTr: 'As (A ♠ ♥ ♦ ♣)',
    titleEn: 'Ace (A ♠ ♥ ♦ ♣)',
    roleTr: 'DÜŞÜK PUAN',
    roleEn: 'LOW SCORE CARD',
    descTr:
      'Sadece 1 puan değerindedir. Özel gücü yoktur; el puanını düşük tutmak için saklanır.',
    descEn:
      'Worth only 1 point. Has no special power; great for keeping your total score low.',
    card: {
      id: 'showcase-ace',
      suit: 'spades',
      rank: 'A',
      value: 1,
      isRevealed: true,
      isPenalty: false,
    },
  },
  {
    id: 'lineup-numbers',
    badge: '2 – 6',
    pointsTr: '2–6 PUAN',
    pointsEn: '2–6 PTS',
    titleTr: 'Sayı Kartları (2, 3, 4, 5, 6)',
    titleEn: 'Number Cards (2, 3, 4, 5, 6)',
    roleTr: 'STANDART KART',
    roleEn: 'STANDARD CARD',
    descTr:
      'Üzerindeki sayı kadar puan değerindedir. Çöpe aynı değerde bir kart atıldığında hızla üstüne yapıştırıp elinden eksiltebilirsin.',
    descEn:
      'Worth their face value in points. Stick matching ranks onto the discard pile to eliminate cards from your hand.',
    card: {
      id: 'showcase-4',
      suit: 'diamonds',
      rank: '4',
      value: 4,
      isRevealed: true,
      isPenalty: false,
    },
  },
  {
    id: 'lineup-7-8',
    badge: '7 & 8',
    pointsTr: '7–8 PUAN',
    pointsEn: '7–8 PTS',
    titleTr: '7 ve 8 — Kendi Kartına Bak',
    titleEn: '7 & 8 — Peek at Your Own Card',
    roleTr: 'ÖZEL GÜÇ: GİZLİ BAKIŞ',
    roleEn: 'POWER: PEEK OWN',
    descTr:
      'Desteden çekip doğrudan çöpe attığında kendi önündeki kapalı kartlardan birine gizlice bakmanı sağlar.',
    descEn:
      'When drawn from the deck and discarded immediately, lets you secretly peek at one of your own face-down cards.',
    card: {
      id: 'showcase-8',
      suit: 'clubs',
      rank: '8',
      value: 8,
      isRevealed: true,
      isPenalty: false,
    },
  },
  {
    id: 'lineup-9-10',
    badge: '9 & 10',
    pointsTr: '9–10 PUAN',
    pointsEn: '9–10 PTS',
    titleTr: '9 ve 10 — Rakip Kartına Bak',
    titleEn: '9 & 10 — Spy on Opponent Card',
    roleTr: 'ÖZEL GÜÇ: CASUS BAKIŞ',
    roleEn: 'POWER: SPY OPPONENT',
    descTr:
      'Desteden çekip doğrudan çöpe attığında masadaki herhangi bir rakibin 1 kartına gizlice bakmanı sağlar.',
    descEn:
      'When drawn from the deck and discarded immediately, lets you secretly inspect any opponent’s face-down card.',
    card: {
      id: 'showcase-10',
      suit: 'hearts',
      rank: '10',
      value: 10,
      isRevealed: true,
      isPenalty: false,
    },
  },
  {
    id: 'lineup-j-q',
    badge: 'J & Q',
    pointsTr: '10 PUAN',
    pointsEn: '10 PTS',
    titleTr: 'Vale (J) ve Kız (Q) — Kör Takas',
    titleEn: 'Jack (J) & Queen (Q) — Blind Swap',
    roleTr: 'ÖZEL GÜÇ: KÖR TAKAS',
    roleEn: 'POWER: BLIND SWAP',
    descTr:
      'Desteden çekip çöpe attığında, kartların yüzüne bakmadan kendi 1 kartınla rakibin 1 kartını yer değiştirirsin.',
    descEn:
      'When drawn from the deck and discarded, swap one of your cards with any opponent’s card without looking.',
    card: {
      id: 'showcase-queen',
      suit: 'spades',
      rank: 'Q',
      value: 10,
      isRevealed: true,
      isPenalty: false,
    },
  },
  {
    id: 'lineup-black-king',
    badge: 'K ♠ ♣',
    pointsTr: '10 PUAN',
    pointsEn: '10 PTS',
    titleTr: 'Siyah Papaz (K ♠ / K ♣) — Gör ve Takasla',
    titleEn: 'Black King (K ♠ / K ♣) — Look & Swap',
    roleTr: 'ÖZEL GÜÇ: GÖR & TAKASLA',
    roleEn: 'POWER: LOOK & SWAP',
    descTr:
      'Desteden çekip çöpe attığında önce rakibin 1 kartını gizlice görürsün; işine gelirse kendi kartınla takas edersin.',
    descEn:
      'When drawn from the deck and discarded, secretly look at an opponent’s card first, then choose whether to swap.',
    card: {
      id: 'showcase-k-spades',
      suit: 'spades',
      rank: 'K',
      value: 10,
      isRevealed: true,
      isPenalty: false,
    },
  },
];

// Arka plandaki yeşil çuhayı zenginleştiren dekoratif masa kartları (4K vektörel keskinlikte)
const TABLE_AMBIENT_CARDS: Array<{
  id: string;
  posClass: string;
  rotate: number;
  card: Card;
}> = [
  // Sol Üst Köşe Yelpazesi
  {
    id: 'amb-tl-1',
    posClass: 'top-8 left-8 xl:top-12 xl:left-14',
    rotate: -18,
    card: { id: 'amb-1', suit: 'spades', rank: 'A', value: 1, isRevealed: true, isPenalty: false },
  },
  {
    id: 'amb-tl-2',
    posClass: 'top-10 left-20 xl:top-14 xl:left-28',
    rotate: -4,
    card: { id: 'amb-2', suit: 'hearts', rank: 'K', value: -1, isRevealed: false, isPenalty: false },
  },
  {
    id: 'amb-tl-3',
    posClass: 'top-28 left-10 xl:top-36 xl:left-16',
    rotate: 14,
    card: { id: 'amb-3', suit: 'diamonds', rank: 'Q', value: 10, isRevealed: true, isPenalty: false },
  },
  // Sol Orta Kenar
  {
    id: 'amb-ml-1',
    posClass: 'top-1/2 -translate-y-16 left-6 xl:left-12',
    rotate: -12,
    card: { id: 'amb-4', suit: 'clubs', rank: '7', value: 7, isRevealed: false, isPenalty: false },
  },
  {
    id: 'amb-ml-2',
    posClass: 'top-1/2 translate-y-6 left-14 xl:left-24',
    rotate: 9,
    card: { id: 'amb-5', suit: 'hearts', rank: '10', value: 10, isRevealed: true, isPenalty: false },
  },
  // Sol Alt Köşe Yelpazesi
  {
    id: 'amb-bl-1',
    posClass: 'bottom-10 left-10 xl:bottom-14 xl:left-16',
    rotate: 16,
    card: { id: 'amb-6', suit: 'joker', rank: 'Joker', value: 0, isRevealed: true, isPenalty: false },
  },
  {
    id: 'amb-bl-2',
    posClass: 'bottom-14 left-24 xl:bottom-18 xl:left-32',
    rotate: -8,
    card: { id: 'amb-7', suit: 'spades', rank: '8', value: 8, isRevealed: false, isPenalty: false },
  },
  // Sağ Üst Köşe Yelpazesi
  {
    id: 'amb-tr-1',
    posClass: 'top-20 right-10 xl:top-24 xl:right-16',
    rotate: 15,
    card: { id: 'amb-8', suit: 'diamonds', rank: 'K', value: -1, isRevealed: true, isPenalty: false },
  },
  {
    id: 'amb-tr-2',
    posClass: 'top-24 right-24 xl:top-28 xl:right-32',
    rotate: -9,
    card: { id: 'amb-9', suit: 'clubs', rank: 'J', value: 10, isRevealed: false, isPenalty: false },
  },
  // Sağ Orta Kenar
  {
    id: 'amb-mr-1',
    posClass: 'top-1/2 -translate-y-14 right-6 xl:right-12',
    rotate: 11,
    card: { id: 'amb-10', suit: 'spades', rank: 'K', value: 10, isRevealed: true, isPenalty: false },
  },
  {
    id: 'amb-mr-2',
    posClass: 'top-1/2 translate-y-8 right-16 xl:right-24',
    rotate: -14,
    card: { id: 'amb-11', suit: 'hearts', rank: '9', value: 9, isRevealed: false, isPenalty: false },
  },
  // Sağ Alt Köşe Yelpazesi
  {
    id: 'amb-br-1',
    posClass: 'bottom-10 right-10 xl:bottom-14 xl:right-16',
    rotate: -16,
    card: { id: 'amb-12', suit: 'clubs', rank: 'A', value: 1, isRevealed: true, isPenalty: false },
  },
  {
    id: 'amb-br-2',
    posClass: 'bottom-14 right-24 xl:bottom-18 xl:right-32',
    rotate: 7,
    card: { id: 'amb-13', suit: 'diamonds', rank: '7', value: 7, isRevealed: false, isPenalty: false },
  },
];

export function HomeScreen() {
  const langStore = useLangStore();
  const lang = langStore.lang;
  const t = translations[lang];

  const [nickname, setNickname] = useState(() => {
    const saved = sessionStorage.getItem('nickname');
    if (!saved || saved === 'You' || saved === 'Sen') {
      return lang === 'tr' ? 'Sen' : 'You';
    }
    return saved;
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    setNickname((prev) => {
      if (!prev || prev === 'You' || prev === 'Sen') {
        const next = lang === 'tr' ? 'Sen' : 'You';
        sessionStorage.setItem('nickname', next);
        return next;
      }
      return prev;
    });
  }, [lang]);

  const [botDifficulty, setBotDifficulty] = useState<
    'casual' | 'tactical' | 'grandmaster'
  >(
    () =>
      (sessionStorage.getItem('botDifficulty') as
        | 'casual'
        | 'tactical'
        | 'grandmaster') || 'tactical'
  );
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [showRules, setShowRules] = useState(false);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});
  const [stats] = useState(() => getPlayerStats());

  const { loading, error, createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  const canProceed = nickname.trim().length >= 2;
  const activeShowcase = CAMBIO_CARD_LINEUP[selectedCardIdx] ?? CAMBIO_CARD_LINEUP[0];

  const handlePlayWithBots = async () => {
    const cleanNick = nickname.trim() || (lang === 'tr' ? 'Sen' : 'You');
    sessionStorage.setItem('nickname', cleanNick);
    sessionStorage.setItem('avatar', '♠');
    sessionStorage.setItem('botDifficulty', botDifficulty);
    sessionStorage.removeItem('roomId');
    sessionStorage.setItem('playerId', 'local');
    sessionStorage.setItem('seat', '0');
    sessionStorage.setItem('isHost', 'true');
    navigate('/game/local');
  };

  const handleCreateRoom = async () => {
    if (!canProceed || loading) return;
    const cleanNick = nickname.trim();
    sessionStorage.setItem('nickname', cleanNick);
    sessionStorage.setItem('avatar', '♠');
    sessionStorage.setItem('botDifficulty', botDifficulty);
    await createRoom(cleanNick, '♠', botDifficulty);
  };

  const handleJoinRoom = async () => {
    if (!canProceed || joinCode.length < 4 || loading) return;
    const cleanNick = nickname.trim();
    sessionStorage.setItem('nickname', cleanNick);
    sessionStorage.setItem('avatar', '♠');
    await joinRoom(joinCode, cleanNick, '♠');
  };

  const handleSelectShowcaseCard = (idx: number) => {
    SoundManager.playCardFlip();
    const item = CAMBIO_CARD_LINEUP[idx];
    if (selectedCardIdx === idx) {
      // Zaten seçili olan karta tekrar tıklanırsa kartın arka/ön yüzünü çevir
      setFlippedCardIds((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    } else {
      setSelectedCardIdx(idx);
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden relative antialiased">
      {/* ─── ARKA PLAN: ZENGİN MASA ÇUHASI ÇERÇEVESİ VE DAĞITILMIŞ İSKAMBİL KARTLARI ─── */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
        {/* İnce altın masa içi bordür çizgisi */}
        <div className="absolute inset-4 sm:inset-7 rounded-[36px] border border-[#e8c468]/18 shadow-[inset_0_0_90px_rgba(0,0,0,0.35)]" />
        <div className="absolute inset-6 sm:inset-9 rounded-[30px] border border-[#e8c468]/8" />

        {/* Masanın dört bir yanına yayılmış gerçek iskambil kartları (büyük ekranlarda boşluğu doldurur) */}
        <div className="hidden lg:block">
          {TABLE_AMBIENT_CARDS.map((item) => (
            <div
              key={item.id}
              className={`absolute ${item.posClass} opacity-80 transition-transform duration-500`}
              style={{
                transform: `rotate(${item.rotate}deg)`,
              }}
            >
              <GameCard card={item.card} size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Sağ Üst: Dil Seçici (EN / TR) ve Tam Ekran Tuşu */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-8 z-40 flex items-center gap-2.5">
        <div className="luxury-panel h-10 p-1 rounded-xl flex items-center gap-1">
          <span
            className="pl-2 pr-1 text-emerald-200/80 flex items-center select-none"
            title="Language / Dil"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <button
            type="button"
            onClick={() => langStore.setLang('en')}
            className={`h-full px-3 rounded-lg text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black'
                : 'text-emerald-100/75 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => langStore.setLang('tr')}
            className={`h-full px-3 rounded-lg text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
              lang === 'tr'
                ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black'
                : 'text-emerald-100/75 hover:text-white'
            }`}
          >
            TR
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
          className="btn-emerald-3d h-10 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          title={t.fullScreen}
        >
          <svg
            className="w-3.5 h-3.5 text-[#f7e2ab]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider">
            {t.fullScreen}
          </span>
        </button>
      </div>

      {/* ─── ANA 4K WIDESCREEN İÇERİK KAPSAYICISI ─── */}
      <div className="relative z-10 w-full max-w-[1280px] flex flex-col items-center gap-5 sm:gap-6">
        {/* Üst Başlık */}
        <motion.div
          className="flex flex-col items-center text-center gap-1.5"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[#e8c468] text-sm tracking-[0.25em] font-black">
              ♠ ♥
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-[0.2em] text-[#fdf6e3] leading-none">
              CAMBIO
            </h1>
            <span className="text-[#e8c468] text-sm tracking-[0.25em] font-black">
              ♦ ♣
            </span>
          </div>
          <p className="text-emerald-100/85 text-xs sm:text-sm tracking-[0.24em] uppercase font-bold">
            {lang === 'tr'
              ? 'HAFIZA & STRATEJİ İSKAMBİL OYUNU'
              : 'MEMORY & STRATEGY PLAYING CARD GAME'}
          </p>
        </motion.div>

        {/* İki Sütunlu 4K Masaüstü Düzeni: Sol (Tüm Kartların Dizilimi & Açıklamaları) + Sağ (Oyuna Giriş & Lobi) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* SOL PANEL (7 Sütun): Tüm Kartların Sıralı Dizilimi ve Tıklanan Kartın Ne Yaptığı */}
          <motion.div
            className="lg:col-span-7 luxury-panel rounded-[28px] p-5 sm:p-7 flex flex-col justify-between gap-5"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-[0.15em] text-[#f7e2ab]">
                  {lang === 'tr'
                    ? 'İSKAMBİL DESTESİ & KART GÜÇLERİ'
                    : 'PLAYING CARD DECK & CARD POWERS'}
                </h2>
                <p className="text-xs text-emerald-100/75 font-medium mt-0.5">
                  {lang === 'tr'
                    ? 'Bir karta tıklayarak puanını ve oyundaki özel görevini inceleyin'
                    : 'Select any card below to inspect its point value and table power'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-black/35 border border-[#e8c468]/35 text-[11px] font-extrabold text-[#f7e2ab] tracking-wider shrink-0">
                54 {lang === 'tr' ? 'KART' : 'CARDS'}
              </span>
            </div>

            {/* Tüm Kartların Yan Yana Sıralı Dizilimi (8 Kart Kategorisi) */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-2.5 place-items-center py-1">
              {CAMBIO_CARD_LINEUP.map((item, idx) => {
                const isSelected = selectedCardIdx === idx;
                const isFlippedBack = Boolean(flippedCardIds[item.id]);
                const displayCard: Card = {
                  ...item.card,
                  isRevealed: !isFlippedBack,
                };

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectShowcaseCard(idx)}
                    className={`flex flex-col items-center gap-1.5 cursor-pointer group transition-transform duration-200 ${
                      isSelected ? '-translate-y-2' : 'hover:-translate-y-1'
                    }`}
                  >
                    <div
                      className={`p-1 rounded-xl transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#f7e2ab] bg-[#f7e2ab]/15 shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
                          : 'opacity-85 group-hover:opacity-100'
                      }`}
                    >
                      <GameCard card={displayCard} size="sm" />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md transition-colors ${
                        isSelected
                          ? 'bg-[#f7e2ab] text-black'
                          : 'bg-black/35 text-emerald-100/80 group-hover:text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Seçili Kartın Detaylı Görev & Puan Açıklama Kutusu (4K Keskin Okunabilirlik) */}
            <div className="rounded-2xl bg-black/40 border border-[#e8c468]/35 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
              <div
                onClick={() => handleSelectShowcaseCard(selectedCardIdx)}
                className="shrink-0 cursor-pointer"
                title={
                  lang === 'tr'
                    ? 'Kartın arka yüzünü görmek için tıkla'
                    : 'Click to flip card back/front'
                }
              >
                <GameCard
                  card={{
                    ...activeShowcase.card,
                    id: `${activeShowcase.card.id}-detail`,
                    isRevealed: !flippedCardIds[activeShowcase.id],
                  }}
                  size="md"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black text-[11px] font-black uppercase tracking-wider">
                    {lang === 'tr'
                      ? activeShowcase.pointsTr
                      : activeShowcase.pointsEn}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                    {lang === 'tr'
                      ? activeShowcase.roleTr
                      : activeShowcase.roleEn}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                  {lang === 'tr'
                    ? activeShowcase.titleTr
                    : activeShowcase.titleEn}
                </h3>

                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                  {lang === 'tr'
                    ? activeShowcase.descTr
                    : activeShowcase.descEn}
                </p>
              </div>
            </div>

            {/* Alt Oyuncu İstatistik Rozetleri */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/75">
                  {lang === 'tr' ? 'OYNANAN EL' : 'HANDS PLAYED'}
                </span>
                <span className="text-lg font-black text-white font-['JetBrains_Mono'] mt-0.5">
                  {stats.gamesPlayed}
                </span>
              </div>

              <div className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/75">
                  {lang === 'tr' ? 'GALİBİYET' : 'VICTORIES'}
                </span>
                <span className="text-lg font-black text-[#f7e2ab] font-['JetBrains_Mono'] mt-0.5">
                  {stats.wins}
                </span>
              </div>

              <div className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/75">
                  {lang === 'tr' ? 'EN DÜŞÜK SKOR' : 'BEST LOW SCORE'}
                </span>
                <span className="text-lg font-black text-emerald-300 font-['JetBrains_Mono'] mt-0.5">
                  {stats.bestScore !== null ? `${stats.bestScore} pt` : '—'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* SAĞ PANEL (5 Sütun): Oyuncu Girişi, Bot Zorluğu ve Masa Kurma Aksiyonları */}
          <motion.div
            className="lg:col-span-5 luxury-panel rounded-[28px] p-5 sm:p-7 flex flex-col justify-between gap-4"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.35, ease: 'easeOut' }}
          >
            <div className="flex flex-col gap-4 w-full">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-[0.15em] text-[#f7e2ab]">
                  {lang === 'tr' ? 'MASAYA OTUR' : 'JOIN THE TABLE'}
                </h2>
                <p className="text-xs text-emerald-100/75 font-medium mt-0.5">
                  {lang === 'tr'
                    ? 'Arkadaşlarınla özel oda kur veya yapay zekaya karşı hemen başla'
                    : 'Create a private room with friends or start immediately against AI'}
                </p>
              </div>

              {/* Oyuncu İsmi Girişi */}
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[#f7e2ab] text-xs font-extrabold uppercase tracking-[0.15em]">
                    {t.hs_player_name}
                  </label>
                  <span className="text-xs text-emerald-200/70 font-bold tracking-widest">
                    ♠ ♥ ♦ ♣
                  </span>
                </div>

                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t.hs_placeholder}
                  maxLength={16}
                  className="w-full h-12 bg-black/40 border border-white/20 rounded-2xl px-4
                             text-white placeholder-white/35 text-center focus:outline-none focus:border-[#f7e2ab]
                             focus:ring-2 focus:ring-[#f7e2ab]/25 transition-all text-base font-extrabold tracking-wide"
                />
              </div>

              {/* Bot Zorluk Seçici */}
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center justify-between px-1">
                  <span className="text-emerald-100/85 text-xs font-extrabold uppercase tracking-[0.14em]">
                    {lang === 'tr' ? 'BOT ZORLUK SEVİYESİ' : 'BOT AI DIFFICULTY'}
                  </span>
                  <span className="text-xs font-bold text-[#f7e2ab]">
                    {botDifficulty === 'casual'
                      ? lang === 'tr'
                        ? 'Rahat Tempo'
                        : 'Casual Pace'
                      : botDifficulty === 'tactical'
                        ? lang === 'tr'
                          ? 'Dengeli Strateji'
                          : 'Balanced Strategy'
                        : lang === 'tr'
                          ? 'Kusursuz Hafıza'
                          : 'Master Memory'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/15">
                  {(
                    [
                      {
                        id: 'casual',
                        suit: '♣',
                        tr: 'Rahat',
                        en: 'Casual',
                      },
                      {
                        id: 'tactical',
                        suit: '♦',
                        tr: 'Stratejik',
                        en: 'Tactical',
                      },
                      {
                        id: 'grandmaster',
                        suit: '♠',
                        tr: 'Usta',
                        en: 'Master',
                      },
                    ] as const
                  ).map((lv) => (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => setBotDifficulty(lv.id)}
                      className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        botDifficulty === lv.id
                          ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-[#1c1302]'
                          : 'text-emerald-100/80 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{lv.suit}</span>
                      <span>{lang === 'tr' ? lv.tr : lv.en}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="relative z-10 w-full pt-2">
              <AnimatePresence mode="wait">
                {mode === 'idle' ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center gap-2.5 w-full"
                  >
                    <button
                      type="button"
                      disabled={!canProceed || loading}
                      onClick={handleCreateRoom}
                      className="w-full py-3.5 rounded-2xl btn-gold-3d font-black text-xs sm:text-sm uppercase tracking-[0.14em] disabled:opacity-45 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>{loading ? t.hs_creating : t.hs_create_room}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2.5 w-full">
                      <button
                        type="button"
                        disabled={!canProceed}
                        onClick={() => setMode('join')}
                        className="py-3.5 rounded-2xl btn-emerald-3d font-bold text-xs tracking-wider uppercase disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-[#f7e2ab] shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10 17 15 12 10 7" />
                          <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                        <span>{t.hs_join_room}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePlayWithBots}
                        className="py-3.5 rounded-2xl btn-emerald-3d font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-[#f7e2ab] shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>{t.hs_with_bots}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRules(true)}
                      className="w-full py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/15 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2 mt-0.5"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-[#f7e2ab] shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      <span>
                        {lang === 'tr'
                          ? 'Detaylı Oyun Kuralları Rehberi'
                          : 'Complete Game Rules Guide'}
                      </span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="join"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center gap-3.5 w-full"
                  >
                    <div className="flex flex-col items-center gap-1.5 w-full mx-auto">
                      <label className="text-white/75 text-xs font-bold uppercase tracking-[0.15em] text-center w-full">
                        {t.hs_join_code}
                      </label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) =>
                          setJoinCode(e.target.value.toUpperCase())
                        }
                        placeholder="XXXX"
                        maxLength={4}
                        className="w-full bg-black/40 border border-white/20 rounded-2xl px-5 py-3
                                   text-[#f7e2ab] placeholder-white/20 text-center tracking-[0.5em]
                                   text-2xl font-black focus:outline-none focus:border-[#f7e2ab]
                                   focus:ring-2 focus:ring-[#f7e2ab]/20 transition-all uppercase font-['JetBrains_Mono']"
                      />
                    </div>

                    <div className="flex gap-2.5 justify-center w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('idle');
                          setJoinCode('');
                        }}
                        className="py-3.5 px-6 rounded-2xl btn-emerald-3d text-xs font-bold tracking-wide cursor-pointer"
                      >
                        {t.hs_cancel}
                      </button>
                      <button
                        type="button"
                        disabled={
                          !canProceed || joinCode.length < 4 || loading
                        }
                        onClick={handleJoinRoom}
                        className="flex-1 py-3.5 rounded-2xl btn-gold-3d font-black text-xs uppercase tracking-wider disabled:opacity-45 cursor-pointer"
                      >
                        {loading ? t.hs_joining : t.hs_sit_table}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hata Mesajı */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full"
                >
                  <div className="text-red-200 text-xs bg-red-500/20 border border-red-400/40 rounded-xl py-2.5 px-4 font-bold text-center">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md h-[82dvh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="absolute -top-11 right-0 text-white/80 hover:text-white font-bold bg-white/10 hover:bg-white/20 rounded-full w-9 h-9 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
              <RulesPanel />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
