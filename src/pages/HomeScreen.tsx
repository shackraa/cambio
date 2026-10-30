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
import { MobileLandscapeGuard } from '../components/MobileLandscapeGuard';
import type { Card } from '../types/game';

const AVATARS = ['👑', '🎩', '🦊', '🦁', '⚡', '🐉', '🎭', '💎'];

const HERO_DEMO_CARDS: Array<{
  card: Card;
  labelTr: string;
  labelEn: string;
}> = [
  {
    card: {
      id: 'demo-k',
      suit: 'hearts',
      rank: 'K',
      value: -1,
      isRevealed: true,
      isPenalty: false,
    },
    labelTr: 'Kırmızı K = -1 Puan (En Değerli!)',
    labelEn: 'Red King = -1 Pt (Best Card!)',
  },
  {
    card: {
      id: 'demo-joker',
      suit: 'joker',
      rank: 'Joker',
      value: 0,
      isRevealed: false,
      isPenalty: false,
    },
    labelTr: 'Joker = 0 Puan (Sıfır Yük)',
    labelEn: 'Joker = 0 Pt (Zero Weight)',
  },
  {
    card: {
      id: 'demo-8',
      suit: 'spades',
      rank: '8',
      value: 8,
      isRevealed: true,
      isPenalty: false,
    },
    labelTr: '7 & 8 = Kendi Kartına Gizlice Bak',
    labelEn: '7 & 8 = Peek at Your Own Card',
  },
];

export function HomeScreen() {
  const langStore = useLangStore();
  const lang = langStore.lang;
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const [nickname, setNickname] = useState(
    () => sessionStorage.getItem('nickname') ?? (lang === 'tr' ? 'Sen' : 'You')
  );
  const [avatar, setAvatar] = useState(
    () => sessionStorage.getItem('avatar') ?? '👑'
  );
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
  const [demoCards, setDemoCards] = useState(HERO_DEMO_CARDS);
  const [activeCardHint, setActiveCardHint] = useState<string | null>(null);
  const [stats] = useState(() => getPlayerStats());

  const { loading, error, createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  const canProceed = nickname.trim().length >= 2;

  const triggerMobileFullscreenLandscape = async () => {
    try {
      const isSmallOrTouch =
        window.innerWidth < 1024 ||
        (navigator.maxTouchPoints > 0 &&
          Math.min(window.screen.width, window.screen.height) <= 920);
      if (isSmallOrTouch && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      }
      // @ts-ignore
      await screen.orientation?.lock?.('landscape');
    } catch {}
  };

  const handlePlayWithBots = async () => {
    await triggerMobileFullscreenLandscape();
    const cleanNick = nickname.trim() || (lang === 'tr' ? 'Sen' : 'You');
    sessionStorage.setItem('nickname', cleanNick);
    sessionStorage.setItem('avatar', avatar);
    sessionStorage.setItem('botDifficulty', botDifficulty);
    sessionStorage.removeItem('roomId');
    sessionStorage.setItem('playerId', 'local');
    sessionStorage.setItem('seat', '0');
    sessionStorage.setItem('isHost', 'true');
    navigate('/game/local');
  };

  const handleCreateRoom = async () => {
    if (!canProceed || loading) return;
    await triggerMobileFullscreenLandscape();
    const cleanNick = nickname.trim();
    sessionStorage.setItem('nickname', cleanNick);
    sessionStorage.setItem('avatar', avatar);
    sessionStorage.setItem('botDifficulty', botDifficulty);
    await createRoom(cleanNick, avatar, botDifficulty);
  };

  const handleJoinRoom = async () => {
    if (!canProceed || joinCode.length < 4 || loading) return;
    await triggerMobileFullscreenLandscape();
    const cleanNick = nickname.trim();
    sessionStorage.setItem('nickname', cleanNick);
    sessionStorage.setItem('avatar', avatar);
    await joinRoom(joinCode, cleanNick, avatar);
  };

  const handleFlipDemoCard = (index: number) => {
    SoundManager.playCardFlip();
    setDemoCards((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              card: { ...item.card, isRevealed: !item.card.isRevealed },
            }
          : item
      )
    );
    const clicked = demoCards[index];
    setActiveCardHint(lang === 'tr' ? clicked.labelTr : clicked.labelEn);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden relative">
      {/* Mobilde Dikey Tutuş Koruması */}
      <MobileLandscapeGuard requireFullscreen={false} />

      {/* Sağ Üst: Sadece Dil Seçici (EN / TR) ve Tam Ekran Tuşu */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-40 flex items-center gap-2">
        <div className="luxury-panel h-10 p-1 rounded-xl flex items-center gap-1">
          <span
            className="pl-2 pr-1 text-xs opacity-80 select-none"
            title="Language / Dil"
          >
            🌐
          </span>
          <button
            type="button"
            onClick={() => langStore.setLang('en')}
            className={`h-full px-3 rounded-lg text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black shadow-xs'
                : 'text-emerald-100/65 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => langStore.setLang('tr')}
            className={`h-full px-3 rounded-lg text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
              lang === 'tr'
                ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-black shadow-xs'
                : 'text-emerald-100/65 hover:text-white'
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
          <span className="text-sm leading-none text-[#f7e2ab]">⛶</span>
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider">
            {t.fullScreen}
          </span>
        </button>
      </div>

      {/* Ana Hub Kapsayıcısı */}
      <div className="relative z-10 w-full max-w-[470px] flex flex-col items-center gap-4 sm:gap-5">
        {/* Etkileşimli 3'lü Kart Yelpazesi + CAMBIO Başlığı */}
        <motion.div
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Tıklanabilir Canlı Kart Deneme Alanı */}
          <div className="relative h-24 w-52 flex items-center justify-center mb-1 select-none">
            {demoCards.map((item, idx) => {
              const transforms = [
                '-rotate-14 -translate-x-11 translate-y-1 hover:-translate-y-1.5',
                'rotate-0 z-10 -translate-y-1 hover:-translate-y-3',
                'rotate-14 translate-x-11 translate-y-1 hover:-translate-y-1.5',
              ];
              return (
                <div
                  key={item.card.id}
                  onClick={() => handleFlipDemoCard(idx)}
                  className={`absolute transition-all duration-200 cursor-pointer ${transforms[idx]}`}
                  title={
                    lang === 'tr'
                      ? 'Kartı çevirmek için dokun!'
                      : 'Tap to flip card!'
                  }
                >
                  <GameCard card={item.card} size="sm" />
                </div>
              );
            })}
          </div>

          {/* Kart İpucu Çubuğu */}
          <div className="h-5 flex items-center justify-center">
            <span className="text-[10px] font-bold tracking-wider text-[#f7e2ab]/90 bg-black/30 px-3 py-0.5 rounded-full border border-[#e8c468]/25">
              {activeCardHint ||
                (lang === 'tr'
                  ? '✨ Kartlara dokunarak çevir ve güçlerini keşfet'
                  : '✨ Tap the cards above to flip & inspect powers')}
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl font-black tracking-[0.16em] text-transparent bg-clip-text leading-none mt-0.5"
            style={{
              backgroundImage:
                'linear-gradient(180deg, #ffffff 0%, #f7e2ab 60%, #d9a74a 100%)',
              filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.35))',
            }}
          >
            CAMBIO
          </h1>
          <p className="text-emerald-200/80 text-[11px] tracking-[0.24em] uppercase font-bold">
            {lang === 'tr'
              ? 'HAFIZA & STRATEJİ KART OYUNU'
              : 'MEMORY & STRATEGY CARD GAME'}
          </p>
        </motion.div>

        {/* Ana Etkileşim Paneli */}
        <motion.div
          className="w-full flex flex-col items-center gap-4 p-5 sm:p-7 rounded-[28px] luxury-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.35, ease: 'easeOut' }}
        >
          {/* Oyuncu Profili: Avatar Seçici + İsim Girişi */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between px-1">
              <label className="text-[#f7e2ab] text-[11px] font-extrabold uppercase tracking-[0.15em]">
                {t.hs_player_name}
              </label>
              <span className="text-[10px] text-emerald-200/65 font-semibold">
                {lang === 'tr' ? 'Avatar Seç' : 'Pick Avatar'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full">
              {/* Avatar Döngü Butonu */}
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (AVATARS.indexOf(avatar) + 1) % AVATARS.length;
                  setAvatar(AVATARS[nextIdx]);
                }}
                className="h-12 w-12 rounded-2xl bg-black/40 hover:bg-black/55 border border-[#e8c468]/40 flex items-center justify-center text-2xl shrink-0 transition-transform active:scale-95 cursor-pointer shadow-inner"
                title={lang === 'tr' ? 'Avatarı değiştir' : 'Change avatar'}
              >
                {avatar}
              </button>

              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.hs_placeholder}
                maxLength={16}
                className="flex-1 h-12 bg-black/35 border border-white/15 rounded-2xl px-4
                           text-white placeholder-white/30 text-center focus:outline-none focus:border-[#f7e2ab]/70
                           focus:ring-2 focus:ring-[#f7e2ab]/20 transition-all text-base font-bold"
              />
            </div>

            {/* Hızlı Avatar Seçim Çubuğu */}
            <div className="flex items-center justify-between gap-1 pt-0.5">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`flex-1 py-1 rounded-xl text-sm transition-all cursor-pointer ${
                    avatar === av
                      ? 'bg-[#e8c468]/25 border border-[#e8c468]/60 scale-105'
                      : 'bg-white/[0.03] border border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Yapay Zeka Bot Zorluk Seçici */}
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between px-1">
              <span className="text-emerald-100/75 text-[10px] font-extrabold uppercase tracking-[0.15em]">
                {lang === 'tr' ? 'BOT ZEKASI & TEMPO' : 'BOT AI DIFFICULTY'}
              </span>
              <span className="text-[10px] font-bold text-[#f7e2ab]">
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

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/35 border border-white/10">
              {(
                [
                  {
                    id: 'casual',
                    icon: '🌱',
                    tr: 'Rahat',
                    en: 'Casual',
                  },
                  {
                    id: 'tactical',
                    icon: '🧠',
                    tr: 'Stratejik',
                    en: 'Tactical',
                  },
                  {
                    id: 'grandmaster',
                    icon: '🔥',
                    tr: 'Usta',
                    en: 'Master',
                  },
                ] as const
              ).map((lv) => (
                <button
                  key={lv.id}
                  type="button"
                  onClick={() => setBotDifficulty(lv.id)}
                  className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    botDifficulty === lv.id
                      ? 'bg-gradient-to-b from-[#fae19c] to-[#c79531] text-[#1c1302] shadow-sm'
                      : 'text-emerald-100/70 hover:text-white'
                  }`}
                >
                  <span>{lv.icon}</span>
                  <span>{lang === 'tr' ? lv.tr : lv.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aksiyon Alanı */}
          <div className="relative z-10 w-full pt-1">
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
                    <span>✨</span>
                    <span>{loading ? t.hs_creating : t.hs_create_room}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    <button
                      type="button"
                      disabled={!canProceed}
                      onClick={() => setMode('join')}
                      className="py-3.5 rounded-2xl btn-emerald-3d font-bold text-xs tracking-wider uppercase disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🔑</span>
                      <span>{t.hs_join_room}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePlayWithBots}
                      className="py-3.5 rounded-2xl btn-emerald-3d font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🤖</span>
                      <span>{t.hs_with_bots}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRules(true)}
                    className="w-full py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 text-white/90 font-bold text-xs tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2 mt-0.5"
                  >
                    <span>📖</span>
                    <span>
                      {lang === 'tr'
                        ? 'Oyun Kuralları & Kart Güçleri Rehberi'
                        : 'Game Rules & Card Powers Guide'}
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
                    <label className="text-white/60 text-xs font-bold uppercase tracking-[0.15em] text-center w-full">
                      {t.hs_join_code}
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="XXXX"
                      maxLength={4}
                      className="w-full bg-black/40 border border-white/15 rounded-2xl px-5 py-3
                                 text-[#f7e2ab] placeholder-white/20 text-center tracking-[0.5em]
                                 text-2xl font-black focus:outline-none focus:border-[#f7e2ab]/70
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
                      disabled={!canProceed || joinCode.length < 4 || loading}
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
                <div className="text-red-300 text-xs bg-red-500/15 border border-red-400/30 rounded-xl py-2.5 px-4 font-semibold text-center">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Alt Oyuncu Kariyer & İstatistik Rozet Barı */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35 }}
          className="w-full grid grid-cols-3 gap-2.5"
        >
          <div className="luxury-panel rounded-2xl px-3 py-2.5 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/65">
              {lang === 'tr' ? 'OYNANAN EL' : 'HANDS PLAYED'}
            </span>
            <span className="text-base font-black text-white font-['JetBrains_Mono'] mt-0.5">
              {stats.gamesPlayed}
            </span>
          </div>

          <div className="luxury-panel rounded-2xl px-3 py-2.5 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/65">
              {lang === 'tr' ? 'GALİBİYET' : 'VICTORIES'}
            </span>
            <span className="text-base font-black text-[#f7e2ab] font-['JetBrains_Mono'] mt-0.5">
              🏆 {stats.wins}
            </span>
          </div>

          <div className="luxury-panel rounded-2xl px-3 py-2.5 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/65">
              {lang === 'tr' ? 'EN DÜŞÜK SKOR' : 'BEST LOW SCORE'}
            </span>
            <span className="text-base font-black text-emerald-300 font-['JetBrains_Mono'] mt-0.5">
              {stats.bestScore !== null ? `${stats.bestScore} pt` : '—'}
            </span>
          </div>
        </motion.div>
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
