import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useNavigate } from 'react-router-dom';
import { RulesPanel } from '../components/RulesPanel';
import { GameCard } from '../components/GameCard';
import { CustomizationModal } from '../components/CustomizationModal';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function HomeScreen() {
  const langStore = useLangStore();
  const lang = langStore.lang;
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const [nickname, setNickname] = useState(() => sessionStorage.getItem('nickname') ?? '');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [showRules, setShowRules] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const { loading, error, createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  const canProceed = nickname.trim().length >= 2;

  const handlePlayWithBots = () => {
    const cleanNick = nickname.trim() || (lang === 'tr' ? 'Sen' : 'You');
    sessionStorage.setItem('nickname', cleanNick);
    sessionStorage.removeItem('roomId');
    sessionStorage.setItem('playerId', 'local');
    sessionStorage.setItem('seat', '0');
    sessionStorage.setItem('isHost', 'true');
    navigate('/game/local');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Sağ Üst Kontroller: Kişiselleştirme (Kart Görünümü) + Dil Seçici (EN / TR) */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => setShowCustomize(true)}
          className="btn-emerald-3d h-10 px-3.5 sm:px-4 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer"
        >
          <span>🎨</span>
          <span className="tracking-wide">
            {lang === 'tr' ? 'Kart Tasarımı' : 'Customize Cards'}
          </span>
        </button>

        {/* Dil Seçici (Globe Icon + EN / TR) */}
        <div className="luxury-panel h-10 p-1 rounded-xl flex items-center gap-1">
          <span className="pl-2 pr-1 text-xs opacity-80 select-none" title="Language / Dil">
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
      </div>

      {/* Ana Kapsayıcı */}
      <div className="relative z-10 w-full max-w-[430px] flex flex-col items-center gap-6">
        {/* Üst Kart Yelpazesi + CAMBIO Başlığı */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Canlı İskambil Kartı Yelpazesi (Seçilen kart arkasını anında gösterir) */}
          <div
            onClick={() => setShowCustomize(true)}
            className="relative h-24 w-32 flex items-center justify-center mb-1 cursor-pointer group"
            title={lang === 'tr' ? 'Kart görünümünü değiştirmek için tıkla' : 'Click to customize cards'}
          >
            <div className="transform -rotate-12 -translate-x-4 transition-transform group-hover:-rotate-16 group-hover:-translate-x-5">
              <GameCard
                card={{ id: 'hero-back', suit: 'spades', rank: 'A', value: 1, isRevealed: false, isPenalty: false }}
                size="sm"
              />
            </div>
            <div className="transform rotate-10 translate-x-4 transition-transform group-hover:rotate-14 group-hover:translate-x-5">
              <GameCard
                card={{ id: 'hero-front', suit: 'hearts', rank: 'K', value: -1, isRevealed: true, isPenalty: false }}
                size="sm"
              />
            </div>
          </div>

          <h1
            className="text-5xl sm:text-6xl font-black tracking-[0.16em] text-transparent bg-clip-text leading-none"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f7e2ab 60%, #d9a74a 100%)',
              filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.35))',
            }}
          >
            CAMBIO
          </h1>
          <p className="text-emerald-200/80 text-xs tracking-[0.26em] uppercase font-bold">
            {lang === 'tr' ? 'HAFIZA & STRATEJİ KART OYUNU' : 'MEMORY & STRATEGY CARD GAME'}
          </p>
        </motion.div>

        {/* Etkileşim Paneli */}
        <motion.div
          className="w-full flex flex-col items-center gap-5 p-6 sm:p-8 rounded-[28px] luxury-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: 'easeOut' }}
        >
          {/* Nickname Girişi */}
          <div className="flex flex-col items-center gap-2 w-full">
            <label className="text-[#f7e2ab] text-[11px] font-extrabold uppercase tracking-[0.16em] text-center w-full">
              {t.hs_player_name}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder={t.hs_placeholder}
              maxLength={16}
              className="w-full bg-black/35 border border-white/15 rounded-2xl px-5 py-3.5
                         text-white placeholder-white/30 text-center focus:outline-none focus:border-[#f7e2ab]/70
                         focus:ring-2 focus:ring-[#f7e2ab]/20 transition-all text-base font-bold"
            />
          </div>

          {/* Aksiyon Alanı */}
          <div className="relative z-10 w-full">
            <AnimatePresence mode="wait">
              {mode === 'idle' ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <button
                    disabled={!canProceed || loading}
                    onClick={() => {
                      sessionStorage.setItem('nickname', nickname.trim());
                      createRoom(nickname.trim());
                    }}
                    className="w-full py-3.5 rounded-2xl btn-gold-3d font-black text-xs sm:text-sm uppercase tracking-[0.14em] disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
                  >
                    {loading ? t.hs_creating : t.hs_create_room}
                  </button>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      disabled={!canProceed}
                      onClick={() => setMode('join')}
                      className="py-3.5 rounded-2xl btn-emerald-3d font-bold text-xs tracking-wider uppercase disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      {t.hs_join_room}
                    </button>
                    <button
                      onClick={handlePlayWithBots}
                      className="py-3.5 rounded-2xl btn-emerald-3d font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🤖</span>
                      <span>{t.hs_with_bots}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full pt-1">
                    <button
                      onClick={() => setShowRules(true)}
                      className="py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 text-white/90 font-bold text-xs tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📖</span>
                      <span>{t.hs_rules}</span>
                    </button>
                    <button
                      onClick={() => setShowCustomize(true)}
                      className="py-3 rounded-2xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-300/25 text-[#f7e2ab] font-bold text-xs tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🎨</span>
                      <span>{lang === 'tr' ? 'Kart Görünümü' : 'Card Skins'}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <div className="flex flex-col items-center gap-2 w-full mx-auto">
                    <label className="text-white/60 text-xs font-bold uppercase tracking-[0.15em] text-center w-full">
                      {t.hs_join_code}
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="XXXX"
                      maxLength={4}
                      className="w-full bg-black/40 border border-white/15 rounded-2xl px-5 py-3.5
                                 text-[#f7e2ab] placeholder-white/20 text-center tracking-[0.5em]
                                 text-2xl font-black focus:outline-none focus:border-[#f7e2ab]/70
                                 focus:ring-2 focus:ring-[#f7e2ab]/20 transition-all uppercase font-['JetBrains_Mono']"
                    />
                  </div>

                  <div className="flex gap-3 justify-center w-full">
                    <button
                      onClick={() => {
                        setMode('idle');
                        setJoinCode('');
                      }}
                      className="py-3.5 px-6 rounded-2xl btn-emerald-3d text-xs font-bold tracking-wide cursor-pointer"
                    >
                      {t.hs_cancel}
                    </button>
                    <button
                      disabled={!canProceed || joinCode.length < 4 || loading}
                      onClick={() => {
                        sessionStorage.setItem('nickname', nickname.trim());
                        joinRoom(joinCode, nickname.trim());
                      }}
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
      </div>

      {/* Kişiselleştirme (Kart Görünümü & Masa Rengi) Modalı */}
      <CustomizationModal isOpen={showCustomize} onClose={() => setShowCustomize(false)} />

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
              onClick={e => e.stopPropagation()}
            >
              <button
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
