import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '../components/GameCard';
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative">

      {/* Ana Kapsayıcı */}
      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center gap-8">
        
        {/* Logo Alanı */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-md">
            CAMBIO
          </h1>
          <p className="text-emerald-400 text-[11px] tracking-widest uppercase font-bold">
            THE CARD GAME
          </p>
        </motion.div>

        {/* Etkileşim Paneli (Yeni, Yumuşak ve Zarif Kutu) */}
        <motion.div
          className="w-full flex flex-col items-center gap-6 p-8 rounded-[2rem] bg-[#0A1F17]/80 border border-emerald-500/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        >
          {/* Nickname Girişi */}
          <div className="flex flex-col items-center gap-2 w-[85%] relative z-10 mx-auto">
            <label className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em] text-center w-full">
              {t.hs_player_name}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder={t.hs_placeholder}
              maxLength={16}
              className="w-full bg-[#11271D]/80 border border-white/5 rounded-2xl px-5 py-3.5
                         text-white placeholder-white/20 text-center focus:outline-none focus:border-emerald-500/50
                         focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium"
            />
          </div>

          {/* Aksiyon Alanı */}
          <div className="relative z-10 w-full min-h-[110px]">
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
                    className="w-[85%] py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? t.hs_creating : t.hs_create_room}
                  </button>

                  <div className="flex gap-3 justify-center w-[85%]">
                    <button
                      disabled={!canProceed}
                      onClick={() => setMode('join')}
                      className="flex-1 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-[11px] tracking-wide disabled:opacity-40 transition-colors"
                    >
                      {t.hs_join_room}
                    </button>
                    <button
                      onClick={handlePlayWithBots}
                      className="flex-1 py-2.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 font-medium text-[11px] tracking-wide transition-colors flex items-center justify-center gap-1.5"
                    >
                      {t.hs_with_bots}
                    </button>
                  </div>
                  
                  <div className="w-[85%] mt-1">
                    <button
                      onClick={() => setShowRules(true)}
                      className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-bold text-[11px] tracking-wide transition-colors"
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
                  className="flex flex-col items-center gap-4 w-full px-2"
                >
                  <div className="flex flex-col items-center gap-2 w-[85%] mx-auto">
                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em] text-center w-full">
                      {t.hs_join_code}
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="XXXX"
                      maxLength={4}
                      className="w-full bg-[#11271D]/80 border border-white/5 rounded-2xl px-5 py-3.5
                                 text-emerald-400 placeholder-white/20 text-center tracking-[1em]
                                 text-xl font-black focus:outline-none focus:border-emerald-500/50
                                 focus:ring-2 focus:ring-emerald-500/20 transition-all uppercase"
                    />
                  </div>

                  <div className="flex gap-3 justify-center w-[85%] mt-1 mx-auto">
                    <button
                      onClick={() => { setMode('idle'); setJoinCode(''); }}
                      className="py-3 px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold tracking-wide transition-colors"
                    >
                      {t.hs_cancel}
                    </button>
                    <button
                      disabled={!canProceed || joinCode.length < 4 || loading}
                      onClick={() => joinRoom(joinCode, nickname.trim())}
                      className="flex-1 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <div className="mt-2 text-red-400 text-[11px] bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-4 font-medium text-center">
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
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md h-[80vh] flex flex-col"
            >
              <button
                onClick={() => setShowRules(false)}
                className="absolute -top-10 right-0 text-white/70 hover:text-white font-bold bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
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
