import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useNavigate } from 'react-router-dom';
import { RulesPanel } from '../components/RulesPanel';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function HomeScreen() {
  const lang = useLangStore(s => s.lang);
  const t = translations[lang];

  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [showRules, setShowRules] = useState(false);
  const { loading, error, createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  const canProceed = nickname.trim().length >= 2;

  const handlePlayWithBots = () => {
    sessionStorage.removeItem('roomId');
    sessionStorage.setItem('playerId', 'local');
    sessionStorage.setItem('seat', '0');
    sessionStorage.setItem('isHost', 'true');
    navigate('/game/local');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Ana Kapsayıcı: Sitenin bulanıklaşmasını önlemek için transform: scale kaldırıldı, doğal 4K netliğinde boyutlar kullanıldı */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center gap-6 sm:gap-8">
        {/* Logo Alanı */}
        <motion.div
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="text-5xl sm:text-6xl font-black tracking-[0.14em] text-white drop-shadow-md">
            CAMBIO
          </h1>
          <p className="text-emerald-300/80 text-xs sm:text-sm tracking-[0.25em] uppercase font-bold">
            {lang === 'tr' ? 'KUTU & KART OYUNU' : 'THE BOARD & CARD GAME'}
          </p>
        </motion.div>

        {/* Etkileşim Paneli */}
        <motion.div
          className="w-full flex flex-col items-center gap-6 p-6 sm:p-9 rounded-[2rem] bg-[#0A1F17]/85 border border-[#e8c468]/20 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
        >
          {/* Nickname Girişi */}
          <div className="flex flex-col items-center gap-2.5 w-full relative z-10 mx-auto">
            <label className="text-white/60 text-xs font-bold uppercase tracking-[0.15em] text-center w-full">
              {t.hs_player_name}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder={t.hs_placeholder}
              maxLength={16}
              className="w-full bg-[#11271D]/90 border border-white/10 rounded-2xl px-5 py-4
                         text-white placeholder-white/25 text-center focus:outline-none focus:border-emerald-400/60
                         focus:ring-2 focus:ring-emerald-500/20 transition-all text-base font-semibold"
            />
          </div>

          {/* Aksiyon Alanı */}
          <div className="relative z-10 w-full min-h-[120px]">
            <AnimatePresence mode="wait">
              {mode === 'idle' ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-3.5 w-full"
                >
                  <button
                    disabled={!canProceed || loading}
                    onClick={() => createRoom(nickname.trim())}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm tracking-wider shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {loading ? t.hs_creating : t.hs_create_room}
                  </button>

                  <div className="flex gap-3 justify-center w-full">
                    <button
                      disabled={!canProceed}
                      onClick={() => setMode('join')}
                      className="flex-1 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs sm:text-sm tracking-wide disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {t.hs_join_room}
                    </button>
                    <button
                      onClick={handlePlayWithBots}
                      className="flex-1 py-3.5 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 text-teal-200 font-semibold text-xs sm:text-sm tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {t.hs_with_bots}
                    </button>
                  </div>

                  <div className="w-full mt-0.5">
                    <button
                      onClick={() => setShowRules(true)}
                      className="w-full py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/90 font-bold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer"
                    >
                      {t.hs_rules}
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
                      className="w-full bg-[#11271D]/90 border border-white/10 rounded-2xl px-5 py-4
                                 text-emerald-300 placeholder-white/20 text-center tracking-[0.6em]
                                 text-2xl font-black focus:outline-none focus:border-emerald-400/60
                                 focus:ring-2 focus:ring-emerald-500/20 transition-all uppercase"
                    />
                  </div>

                  <div className="flex gap-3 justify-center w-full mt-1 mx-auto">
                    <button
                      onClick={() => {
                        setMode('idle');
                        setJoinCode('');
                      }}
                      className="py-3.5 px-6 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/75 text-xs sm:text-sm font-bold tracking-wide transition-colors cursor-pointer"
                    >
                      {t.hs_cancel}
                    </button>
                    <button
                      disabled={!canProceed || joinCode.length < 4 || loading}
                      onClick={() => joinRoom(joinCode, nickname.trim())}
                      className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm tracking-wider shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
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
              >
                <div className="mt-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-4 font-medium text-center">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md h-[82dvh] flex flex-col"
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
