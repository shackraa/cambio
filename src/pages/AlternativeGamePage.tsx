import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GameCard } from '../components/GameCard';
import { InteractiveTutorialModal } from '../components/InteractiveTutorialModal';
import { useLangStore } from '../store/useLangStore';
import { applyPageSEO } from '../utils/seo';
import type { Card } from '../types/game';

export type AltGameSlug = 'cabo' | 'dutch' | 'golf';

interface AlternativeGamePageProps {
  variant: AltGameSlug;
}

const SAMPLE_CARDS: Card[] = [
  { id: 'alt-rk', rank: 'K', suit: 'hearts', value: -1, isRevealed: true, isPenalty: false },
  { id: 'alt-jk', rank: 'Joker', suit: 'joker', value: 0, isRevealed: true, isPenalty: false },
  { id: 'alt-7', rank: '7', suit: 'spades', value: 7, isRevealed: true, isPenalty: false },
  { id: 'alt-bk', rank: 'K', suit: 'clubs', value: 10, isRevealed: true, isPenalty: false },
];

const VARIANT_CONTENT: Record<
  AltGameSlug,
  {
    path: string;
    seoTitleEn: string;
    seoDescEn: string;
    seoTitleTr: string;
    seoDescTr: string;
    badge: string;
    h1En: string;
    h1Tr: string;
    introEn: string;
    introTr: string;
    diffsEn: Array<{ aspect: string; other: string; cambio: string }>;
    diffsTr: Array<{ aspect: string; other: string; cambio: string }>;
  }
> = {
  cabo: {
    path: '/play-cabo-online',
    seoTitleEn: 'Play Cabo / Cambio Online Free — Multiplayer Browser Card Game | PlayCambio',
    seoDescEn: 'Looking to play Cabo card game online? Try PlayCambio free in your browser — identical fast-paced 4-card memory, peeking, swapping & matching mechanics with friends or AI bots.',
    seoTitleTr: 'Cabo / Cambio Online Oyna — Ücretsiz Çok Oyunculu Hafıza Kart Oyunu | PlayCambio',
    seoDescTr: 'Cabo veya Cambio kart oyununu tarayıcıdan ücretsiz online oyna! 4 kart hafızası, özel güçler, hızlı yapıştırma ve botlara karşı pratik.',
    badge: 'CABO & CAMBIO',
    h1En: 'Play Cabo & Cambio Card Game Online Free (No Download)',
    h1Tr: 'Cabo & Cambio Kart Oyununu Online Ücretsiz Oyna',
    introEn:
      'Fans of Cabo feel right at home in PlayCambio: both games challenge you to start with 4 face-down cards, peek at just 2, remember your slots, swap away high scores, use special peek/swap cards, and race for the lowest total score.',
    introTr:
      'Cabo kart oyununu sevenler için Cambio neredeyse birebir kardeş oyundur: ikisinde de 4 kapalı karttan sadece 2 tanesine bakarak başlar, özel güçlerle kart inceler/değiştirir ve en düşük puanla oyunu bitirmeye çalışırsın.',
    diffsEn: [
      { aspect: 'Deck', other: 'Custom 0–13 deck (cards cost to buy)', cambio: 'Standard 54-card deck (free in your browser)' },
      { aspect: 'Lowest Card', other: '0-value cards', cambio: 'Red Kings (K♥ / K♦ = -1 pt!) & Jokers (0 pt)' },
      { aspect: 'Shedding Matches', other: 'Multi-matching on your turn', cambio: 'Real-time Sticking anytime a rank hits Discard!' },
      { aspect: 'Final Round Lock', other: 'Hands stay exposed to swaps', cambio: 'Official Cambio Hand Lock 🔒 prevents opponent steals' },
    ],
    diffsTr: [
      { aspect: 'Deste', other: 'Özel baskı Cabo destesi', cambio: 'Klasik 54 kartlık iskambil destesi (tarayıcıda ücretsiz)' },
      { aspect: 'En İyi Kart', other: '0 puanlık kartlar', cambio: 'Kırmızı Papaz (-1 puan!) ve Joker (0 puan)' },
      { aspect: 'Kart Eksiltme', other: 'Sadece kendi turunda', cambio: 'Ortaya eşleşen kart düşünce anlık Yapıştırma (Stick)!' },
      { aspect: 'Son Tur Kilidi', other: 'Değişime açık olabilir', cambio: 'Resmi Cambio Kilidi 🔒 ile elin son turda korunur' },
    ],
  },
  dutch: {
    path: '/play-dutch-online',
    seoTitleEn: 'Play Dutch (Tamalou / Kaboo) Online Free — Card Game in Browser | PlayCambio',
    seoDescEn: 'Play Dutch / Tamalou online free! Real-time 4-card memory gameplay with Red King -1, special powers (7/8 peek, 9/10 spy, J/Q swap, Black K), and instant sticking.',
    seoTitleTr: 'Dutch (Tamalou / Kaboo) Online Kart Oyunu Oyna | PlayCambio',
    seoDescTr: 'Avrupa’nın popüler Dutch / Tamalou hafıza kart oyununu tarayıcıda arkadaşlarınla veya yapay zekaya karşı ücretsiz oyna.',
    badge: 'DUTCH / TAMALOU / KABOO',
    h1En: 'Play Dutch & Tamalou Style Card Game Online Free',
    h1Tr: 'Dutch & Tamalou Tarzı Hafıza Kart Oyunu — Ücretsiz Oyna',
    introEn:
      'Across Europe and hostels worldwide, the same thrilling 4-card memory game goes by Dutch, Tamalou, Kaboo, Pablo, or Cambio. PlayCambio brings that exact table experience online with 3D cards, real sticking speed, and AI bots.',
    introTr:
      'Avrupa’da Dutch, Tamalou, Kaboo veya Pablo adıyla bilinen o heyecanlı 4 kartlık hafıza ve strateji oyunu, PlayCambio ile sıfır kurulumla doğrudan tarayıcıda seni bekliyor.',
    diffsEn: [
      { aspect: 'Core Rulebook', other: 'Regional house-rule chaos', cambio: 'Clean official Cambio ruleset + 1-min interactive lesson' },
      { aspect: 'Black vs Red King', other: 'Varies by table', cambio: 'Red K = -1 pt treasure · Black K = 10 pt Spy & Swap' },
      { aspect: 'Multiplayer Speed', other: 'Pass-and-play only offline', cambio: 'Instant 4-letter invite links or smart AI bots' },
      { aspect: 'Sticking', other: 'Drop matching cards rapidly', cambio: 'Drop own or opponent matches + +1 penalty on miss' },
    ],
    diffsTr: [
      { aspect: 'Kural Birliği', other: 'Masadan masaya değişir', cambio: 'Net resmi Cambio kuralları + 1 dakikalık pratik ders' },
      { aspect: 'Papaz Farkı', other: 'Bölgeye göre değişir', cambio: 'Kırmızı K = -1 puan · Siyah K = 10 pt Casus Takası' },
      { aspect: 'Çok Oyunculu', other: 'Sadece yan yana fiziksel', cambio: '4 haneli tek tık davet linki veya akıllı botlar' },
      { aspect: 'Yapıştırma', other: 'Aynı sayıyı yakala ve at', cambio: 'Hem kendi hem rakip kartını yapıştır (+1 ceza riskli)' },
    ],
  },
  golf: {
    path: '/play-golf-card-game',
    seoTitleEn: 'Play 4-Card Golf / Cambio Online Free — Memory Card Game | PlayCambio',
    seoDescEn: 'Love 4-Card Golf? Try Cambio online free — faster, deeper 4-card memory action with card powers (7-10, J, Q, K), live sticking, and multiplayer rooms.',
    seoTitleTr: '4 Kart Golf & Cambio Online Ücretsiz Oyna | PlayCambio',
    seoDescTr: '4 Kart Golf severler için çok daha dinamik strateji: özel güçler, anlık kart yapıştırma ve arkadaşlarla online oda kurma!',
    badge: '4-CARD GOLF → CAMBIO',
    h1En: 'Love 4-Card Golf? Play Cambio Free Online With Special Powers',
    h1Tr: '4 Kart Golf Oyunu Gibi Ama Daha Heyecanlı: Cambio Online',
    introEn:
      'Like classic 4-Card Golf, Cambio rewards low total points across 4 hidden cards. What makes Cambio addictive is the extra layer: peeking powers, blind swaps, and reflex sticking mid-round.',
    introTr:
      'Klasik 4 Kart Golf oyunundaki gibi amaç el toplamını küçültmek — ama Cambio’da üstüne 7–10/J/Q/Papaz özel güçleri ve ortaya hızlı kart yapıştırma heyecanı eklenir.',
    diffsEn: [
      { aspect: 'Hand Goal', other: 'Lowest 4-card score wins', cambio: 'Lowest score wins (can shed down to 0 cards!)' },
      { aspect: 'Special Cards', other: 'Usually none', cambio: '7–8 Peek Own · 9–10 Spy · J–Q Blind Swap · Black K Spy-Swap' },
      { aspect: 'Turn Action', other: 'Just draw & swap', cambio: 'Draw, swap, use powers, or race to stick matching cards' },
      { aspect: 'Bonus Mechanics', other: 'Final flip', cambio: 'Call CAMBIO to lock hand 🔒 & earn -10 bonus if lowest' },
    ],
    diffsTr: [
      { aspect: 'Oyun Amacı', other: '4 kartta en düşük puan', cambio: 'En az puan (hatta kart yapıştırarak 0 karta inebilirsin!)' },
      { aspect: 'Özel Güçler', other: 'Genelde yok', cambio: '7–8 Kendi · 9–10 Rakip · J–Q Kör Takas · Siyah K Casus' },
      { aspect: 'Tempo', other: 'Sakin çek-değiştir', cambio: 'Güç kullanımı + refleksle çöpe kart yapıştırma' },
      { aspect: 'Final Çağrısı', other: 'Son tur açılışı', cambio: 'CAMBIO deyince el 🔒 kilitlenir ve kazanana -10 bonus!' },
    ],
  },
};

export function AlternativeGamePage({ variant }: AlternativeGamePageProps) {
  const navigate = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const tr = lang === 'tr';
  const [showTutorial, setShowTutorial] = useState(false);

  const info = VARIANT_CONTENT[variant];

  useEffect(() => {
    applyPageSEO({
      lang,
      canonicalPath: info.path,
      title: tr ? info.seoTitleTr : info.seoTitleEn,
      description: tr ? info.seoDescTr : info.seoDescEn,
    });
  }, [lang, tr, info]);

  const handlePlayBots = () => {
    sessionStorage.setItem('nickname', tr ? 'Sen' : 'You');
    sessionStorage.setItem('avatar', '♠');
    sessionStorage.setItem('botDifficulty', 'tactical');
    sessionStorage.removeItem('roomId');
    sessionStorage.setItem('playerId', 'local');
    sessionStorage.setItem('seat', '0');
    sessionStorage.setItem('isHost', 'true');
    navigate('/game/local');
  };

  const rows = tr ? info.diffsTr : info.diffsEn;

  return (
    <div className="min-h-dvh w-full px-4 sm:px-6 py-6 sm:py-10 relative z-10 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="btn-emerald-3d px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2"
          >
            <span>←</span>
            <span>{tr ? 'Ana Masa / Hemen Oyna' : 'Back to Game Table'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/rules" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-black/35 text-emerald-100/80 border border-white/15 hover:text-white">
              EN Rules
            </Link>
            <Link to="/nasil-oynanir" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-black/35 text-emerald-100/80 border border-white/15 hover:text-white">
              TR Kurallar
            </Link>
          </div>
        </header>

        <article className="luxury-panel rounded-[28px] p-6 sm:p-9 flex flex-col gap-6">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">
              {info.badge}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-[#fdf6e3] leading-tight">
              {tr ? info.h1Tr : info.h1En}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/85 leading-relaxed">
              {tr ? info.introTr : info.introEn}
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePlayBots}
                className="btn-gold-3d px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {tr ? 'Botlarla Ücretsiz Oyna →' : 'Play Free vs Bots →'}
              </button>
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="btn-emerald-3d px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer"
              >
                {tr ? '1 Dk İnteraktif Öğren' : '1-Min Playable Tutorial'}
              </button>
              <Link
                to="/"
                className="px-5 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white text-xs font-extrabold uppercase tracking-wider"
              >
                {tr ? 'Arkadaşlarla Oda Kur' : 'Create Friend Room'}
              </Link>
            </div>
          </div>

          {/* 4 Örnek Kart Vitrini */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            {SAMPLE_CARDS.map((card) => (
              <GameCard key={card.id} card={card} size="sm" />
            ))}
          </div>

          {/* Karşılaştırma Tablosu */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-black text-[#f7e2ab]">
              {tr ? 'Hızlı Karşılaştırma & Resmi Farklar' : 'Quick Comparison & Why Players Love Cambio'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rows.map((r) => (
                <div key={r.aspect} className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[var(--gold)]">
                    {r.aspect}
                  </span>
                  <div className="text-xs text-white/55">
                    <span className="font-bold">{info.badge.split(' ')[0]}: </span>
                    {r.other}
                  </div>
                  <div className="text-xs text-emerald-100 font-semibold">
                    <span className="text-[var(--gold-light)] font-black">PlayCambio: </span>
                    {r.cambio}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs text-emerald-100/70">
            <div className="flex flex-wrap gap-3">
              <Link to="/play-cabo-online" className="hover:text-[#fae19c] underline">Cabo Online</Link>
              <Link to="/play-dutch-online" className="hover:text-[#fae19c] underline">Dutch / Tamalou Online</Link>
              <Link to="/play-golf-card-game" className="hover:text-[#fae19c] underline">4-Card Golf Online</Link>
            </div>
            <Link to={tr ? '/nasil-oynanir' : '/rules'} className="text-[var(--gold-light)] font-bold hover:underline">
              {tr ? 'Tüm Kuralları Gör →' : 'Read Full Rules →'}
            </Link>
          </footer>
        </article>
      </div>

      <InteractiveTutorialModal
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        onStartPracticeMatch={handlePlayBots}
      />
    </div>
  );
}
