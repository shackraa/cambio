import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GameCard } from '../components/GameCard';
import { InteractiveTutorialModal } from '../components/InteractiveTutorialModal';
import { useLangStore } from '../store/useLangStore';
import { applyPageSEO } from '../utils/seo';
import type { Card } from '../types/game';

interface RulesGuidePageProps {
  forcedLang: 'en' | 'tr';
}

const POWER_CARDS: Array<{
  card: Card;
  nameTr: string;
  nameEn: string;
  ptsTr: string;
  ptsEn: string;
  effectTr: string;
  effectEn: string;
}> = [
  {
    card: { id: 'seo-k-red', rank: 'K', suit: 'hearts', value: -1, isRevealed: true, isPenalty: false },
    nameTr: 'Kırmızı Papaz (K♥ / K♦)',
    nameEn: 'Red King (K♥ / K♦)',
    ptsTr: '-1 Puan',
    ptsEn: '-1 Point',
    effectTr: 'Oyundaki en değerli kart! Puanından 1 düşer. Özel gücü yoktur — elinde sakla ve asla atma.',
    effectEn: 'Best card in Cambio! Subtracts 1 point from your total. No special power — keep it hidden!',
  },
  {
    card: { id: 'seo-joker', rank: 'Joker', suit: 'joker', value: 0, isRevealed: true, isPenalty: false },
    nameTr: 'Joker (★)',
    nameEn: 'Joker (★)',
    ptsTr: '0 Puan',
    ptsEn: '0 Points',
    effectTr: 'El puanına sıfır yük bindirir. Değiştirmeye uğraşmana gerek olmayan çok güvenli bir karttır.',
    effectEn: 'Zero points — completely safe to hold in your hand all game.',
  },
  {
    card: { id: 'seo-7', rank: '7', suit: 'spades', value: 7, isRevealed: true, isPenalty: false },
    nameTr: '7 ve 8 Kartları',
    nameEn: '7 & 8 Cards',
    ptsTr: '7 – 8 Puan',
    ptsEn: '7 – 8 Points',
    effectTr: 'Desteden çekip doğrudan çöpe atıldığında kendi kapalı kartlarından 1 tanesine gizlice bakmanı sağlar.',
    effectEn: 'When drawn from the deck and discarded directly, peek at 1 of your own face-down cards.',
  },
  {
    card: { id: 'seo-9', rank: '9', suit: 'diamonds', value: 9, isRevealed: true, isPenalty: false },
    nameTr: '9 ve 10 Kartları',
    nameEn: '9 & 10 Cards',
    ptsTr: '9 – 10 Puan',
    ptsEn: '9 – 10 Points',
    effectTr: 'Desteden çekip doğrudan çöpe attığında rakiplerden birinin 1 kapalı kartını gizlice inceleyebilirsin.',
    effectEn: 'When drawn from the deck and discarded directly, spy on 1 opponent face-down card.',
  },
  {
    card: { id: 'seo-jq', rank: 'Q', suit: 'clubs', value: 10, isRevealed: true, isPenalty: false },
    nameTr: 'Vale (J) ve Kız (Q)',
    nameEn: 'Jack (J) & Queen (Q)',
    ptsTr: '10 Puan',
    ptsEn: '10 Points',
    effectTr: 'Desteden çekip atıldığında bakmadan kendi 1 kartınla bir rakibin (Cambio kilidi açık olmayan) 1 kartını yer değiştirir.',
    effectEn: 'Blind Swap: trade 1 of your cards with 1 non-locked opponent card without peeking either.',
  },
  {
    card: { id: 'seo-k-black', rank: 'K', suit: 'spades', value: 10, isRevealed: true, isPenalty: false },
    nameTr: 'Siyah Papaz (K♠ / K♣)',
    nameEn: 'Black King (K♠ / K♣)',
    ptsTr: '10 Puan',
    ptsEn: '10 Points',
    effectTr: 'Casus Takası: Önce bir rakibin kartına gizlice bakarsın; hoşuna giderse kendi kartınla değiştirebilirsin!',
    effectEn: 'Spy & Swap: peek at 1 opponent card first, then decide whether to swap it with one of yours.',
  },
];

export function RulesGuidePage({ forcedLang }: RulesGuidePageProps) {
  const navigate = useNavigate();
  const setLang = useLangStore((s) => s.setLang);
  const [showTutorial, setShowTutorial] = useState(false);

  const tr = forcedLang === 'tr';

  useEffect(() => {
    setLang(forcedLang);
    applyPageSEO({
      lang: forcedLang,
      canonicalPath: tr ? '/nasil-oynanir' : '/rules',
      title: tr
        ? 'Cambio Nasıl Oynanır? Kurallar, Kart Puanları ve Güçleri | PlayCambio'
        : 'How to Play Cambio Card Game — Official Rules, Points & Powers | PlayCambio',
      description: tr
        ? 'Cambio kart oyunu resmi kuralları, kart değerleri (Kırmızı Papaz -1, Joker 0), özel kart güçleri ve 1 dakikalık interaktif öğretici. Ücretsiz çevrimiçi oyna!'
        : 'Learn how to play the Cambio card game in 1 minute! Complete card scoring guide (Red King -1, Joker 0), special card powers, sticking rules, and free online play.',
    });
  }, [forcedLang, setLang, tr]);

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

  return (
    <div className="min-h-dvh w-full px-4 sm:px-6 py-6 sm:py-10 relative z-10 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Üst Navigasyon Çubuğu */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="btn-emerald-3d px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2"
          >
            <span>←</span>
            <span>{tr ? 'Ana Masa / Oyuna Dön' : 'Back to Game Table'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/rules"
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider border ${
                !tr
                  ? 'bg-[#fae19c] text-black border-[#fae19c]'
                  : 'bg-black/35 text-emerald-100/80 border-white/15 hover:text-white'
              }`}
            >
              EN Rules
            </Link>
            <Link
              to="/nasil-oynanir"
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider border ${
                tr
                  ? 'bg-[#fae19c] text-black border-[#fae19c]'
                  : 'bg-black/35 text-emerald-100/80 border-white/15 hover:text-white'
              }`}
            >
              TR Kurallar
            </Link>
          </div>
        </header>

        {/* Hero / Giriş */}
        <article className="luxury-panel rounded-[28px] p-6 sm:p-9 flex flex-col gap-7">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-6">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">
              {tr ? 'RESMİ CAMBIO KURALLARI REHBERİ' : 'OFFICIAL CAMBIO CARD GAME RULES'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-[#fdf6e3] leading-tight">
              {tr
                ? 'Cambio Nasıl Oynanır? (Kart Puanları, Güçler ve Strateji)'
                : 'How to Play Cambio — Official Rules, Card Powers & Scoring'}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/85 leading-relaxed">
              {tr
                ? 'Cambio, klasik 54 kartlık iskambil destesiyle 2 ila 4 kişi arasında oynanan hızlı, tempolu bir hafıza ve strateji kart oyunudur. Amaç elindeki kapalı kartları değiştirerek ve eşleşenleri çöpe yapıştırarak masadaki en düşük toplam puana ulaşmaktır.'
                : 'Cambio is a fast-paced 2–4 player memory and strategy card game played with a standard 54-card deck. Your objective is to finish the round with the lowest total hand score by memorizing your cards, swapping away high numbers, and sticking matches quickly.'}
            </p>

            {/* Hemen Başla Aksiyonları */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="btn-gold-3d px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {tr ? '1 Dakikada İnteraktif Öğren' : 'Play 1-Minute Interactive Tutorial'}
              </button>
              <button
                type="button"
                onClick={handlePlayBots}
                className="btn-emerald-3d px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer"
              >
                {tr ? 'Botlarla Ücretsiz Oyna' : 'Play Free vs AI Bots'}
              </button>
              <Link
                to="/"
                className="px-5 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white text-xs font-extrabold uppercase tracking-wider"
              >
                {tr ? 'Arkadaşlarla Oda Kur' : 'Create Online Room'}
              </Link>
            </div>
          </div>

          {/* 1. Tur Nasıl Oynanır */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-black text-[#f7e2ab]">
              {tr ? '1. Adım Adım Oyun Akışı' : '1. Step-by-Step Gameplay Flow'}
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-emerald-50/90">
              {(tr
                ? [
                    {
                      title: 'İlk Dağıtım & 2 Karta Bakış',
                      body: 'Herkese 4 kapalı kart dağıtılır. Oyun başlamadan önce yalnızca kendi 2 kartına gizlice bakıp yerlerini ezberlersin.',
                    },
                    {
                      title: 'Çek ve Karar Ver (Sıran Geldiğinde)',
                      body: 'Kapalı desteden kart çekip elindeki yüksek puanlı bir kartla değiştirebilirsin ya da açık çöpteki en üst kartı eline alabilirsin.',
                    },
                    {
                      title: 'Eşleşenleri Yapıştır (Sticking)',
                      body: 'Çöpe hangi kart atılırsa atılsın, elinde aynı sayıdan kart varsa sıranı beklemeden çöpe yapıştırıp kart eksiltebilirsin! Yanlışsa +1 ceza kartı alırsın.',
                    },
                    {
                      title: 'CAMBIO Çağır & Eli Kilitle',
                      body: 'En düşük puana sahip olduğuna inandığında tur başında "CAMBIO!" de. Elin kilitlenir, diğer oyuncular son 1 hamle yapar ve en az puanlı kazanır.',
                    },
                  ]
                : [
                    {
                      title: 'Deal & Memorize 2 Cards',
                      body: 'Every player starts with 4 face-down cards. Before the first turn, secretly peek at only 2 of your cards and memorize their slots.',
                    },
                    {
                      title: 'Draw & Swap (or Trigger Power)',
                      body: 'Draw from the closed Deck (either swap it with a hidden slot or discard it directly to activate its power), or pick up the top Discard card.',
                    },
                    {
                      title: 'Stick Matching Cards Anytime',
                      body: 'Whenever any card hits the Discard pile, if you have a matching rank you can stick it immediately to shrink your hand! Wrong sticks add a +1 penalty card.',
                    },
                    {
                      title: 'Call CAMBIO & Hand Lock',
                      body: 'At the start of your turn, press "CAMBIO!" if you think you have the lowest score. Your hand locks against swaps/sticks while opponents get one final turn.',
                    },
                  ]
              ).map((item, idx) => (
                <li
                  key={item.title}
                  className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col gap-1"
                >
                  <span className="text-xs font-black text-[var(--gold)] uppercase tracking-wider">
                    0{idx + 1}. {item.title}
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* 2. Kart Puanları & Özel Güçler */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-black text-[#f7e2ab]">
              {tr
                ? '2. Kart Puanları ve Özel Güçler Tablosu'
                : '2. Card Values & Special Powers Chart'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/75">
              {tr
                ? 'As (A) 1 puan, 2–10 arası sayı kartları kendi değerindedir. Aşağıdaki özel kartları öğrenmek oyunu kazanmanın anahtarıdır:'
                : 'Aces count as 1 point, and number cards 2–10 count as their face value. Master these special cards to win consistently:'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {POWER_CARDS.map((item) => (
                <div
                  key={item.card.id}
                  className="p-3.5 rounded-2xl bg-black/35 border border-white/10 flex items-center gap-3.5"
                >
                  <div className="shrink-0">
                    <GameCard card={item.card} size="sm" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-amber-50">
                        {tr ? item.nameTr : item.nameEn}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--gold)]/20 border border-[var(--gold)]/45 text-[var(--gold-light)] text-[10px] font-black">
                        {tr ? item.ptsTr : item.ptsEn}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/80 leading-relaxed">
                      {tr ? item.effectTr : item.effectEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Sık Sorulan Sorular (FAQ) */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl font-black text-[#f7e2ab]">
              {tr ? '3. Sık Sorulan Sorular (SSS)' : '3. Frequently Asked Questions (FAQ)'}
            </h2>
            <div className="space-y-2.5">
              {(tr
                ? [
                    {
                      q: 'Kendi kartlarıma oyun ortasında tekrar bakabilir miyim?',
                      a: 'Hayır! Sadece oyunun en başında 2 kartına bakabilirsin. Ondan sonra kendi kartını görmek için desteden 7 veya 8 çekip çöpe atarak gücünü kullanmalısın.',
                    },
                    {
                      q: 'Cambio diyince rakipler benden kart alabilir mi?',
                      a: 'Resmi kurallara göre hayır. Cambio çağıran oyuncunun eli final turunda kilitlenir; rakipler ne kör/casus takası yapabilir ne de onun kartına yapıştırabilir.',
                    },
                    {
                      q: 'Doğru Cambio bonusu ve yanlış Cambio cezası nedir?',
                      a: 'Tek başına en düşük puana sahipsen skorundan -10 puan bonus düşülür. Başka biri senden düşük puanla veya eşit puanla biterse +10 ceza puanı alırsın.',
                    },
                    {
                      q: 'Rakibimin kartını da çöpe yapıştırabilir miyim?',
                      a: 'Evet! Masaya atılan kartla eşleşen kartın bir rakibin elinde (örneğin 9-10 ile baktığın kart) olduğunu biliyorsan onun kartına tıklayıp çöpe atabilir ve kendi elinden 1 kartı ona hediye edebilirsin.',
                    },
                  ]
                : [
                    {
                      q: 'Can you look at your own cards again during the round?',
                      a: 'No! You only peek at 2 cards at the beginning. Later, you can only peek at your own hidden cards by drawing and discarding a 7 or 8 from the deck.',
                    },
                    {
                      q: 'Can opponents swap with or stick the player who called Cambio?',
                      a: 'Under official rules, no. Once a player calls Cambio, their hand is locked for the final round so opponents cannot steal from them or stick onto their cards.',
                    },
                    {
                      q: 'How does Cambio bonus & penalty scoring work?',
                      a: 'If the Cambio caller finishes with the unique lowest score, they earn a -10 point bonus. If someone ties or beats their score, the caller receives a +10 point penalty.',
                    },
                    {
                      q: 'Can you stick an opponent’s card onto the discard pile?',
                      a: 'Yes! If you spied an opponent’s card earlier and it matches the latest discard (even a Red King!), you can stick their card and then give them one card from your own hand.',
                    },
                  ]
              ).map((faq) => (
                <div
                  key={faq.q}
                  className="p-4 rounded-2xl bg-black/25 border border-white/10"
                >
                  <h3 className="text-xs sm:text-sm font-black text-amber-50">
                    {faq.q}
                  </h3>
                  <p className="text-xs text-emerald-100/80 leading-relaxed mt-1">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
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
