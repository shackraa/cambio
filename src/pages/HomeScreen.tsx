import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useNavigate } from 'react-router-dom';

export function HomeScreen() {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative"
         style={{
           background: 'radial-gradient(circle at 50% 30%, #1a2416 0%, #0a0f08 100%)'
         }}>
      
      {/* Arka plan süslemeleri (Glowing orbs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--gold)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-green-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Ana Kapsayıcı */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-12">
        
        {/* Logo Alanı */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="text-8xl drop-shadow-[0_0_30px_rgba(212,168,67,0.3)]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🃏
          </motion.div>
          <div className="flex flex-col items-center">
            <h1
              className="font-['Cinzel'] text-7xl font-black tracking-[0.15em] text-center"
              style={{
                background: 'linear-gradient(to bottom, #fff8e7 0%, #d4a843 50%, #8a661c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 20px rgba(212,168,67,0.4))',
              }}
            >
              CAMBIO
            </h1>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent mt-4 mb-3" />
            <p className="text-[var(--gold)]/60 text-xs tracking-[0.3em] uppercase font-light">
              Premium Card Experience
            </p>
          </div>
        </motion.div>

        {/* Etkileşim Paneli (Cam Efekti) */}
        <motion.div
          className="w-full flex flex-col gap-6 p-8 rounded-[2rem] relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* İnce iç border */}
          <div className="absolute inset-0 rounded-[2rem] border border-white/10 pointer-events-none" />

          {/* Nickname Girişi */}
          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-[var(--gold)]/70 text-[10px] uppercase tracking-[0.2em] ml-2">
              Oyuncu Adı
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Örn. Asil"
              maxLength={16}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4
                         text-white/90 placeholder-white/20 focus:outline-none focus:border-[var(--gold)]/50
                         focus:bg-black/60 transition-all text-base shadow-inner font-medium"
            />
          </div>

          {/* Aksiyon Alanı */}
          <div className="relative z-10 min-h-[160px]">
            <AnimatePresence mode="wait">
              {mode === 'idle' ? (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-3"
                >
                  <button
                    disabled={!canProceed || loading}
                    onClick={() => createRoom(nickname.trim())}
                    className="group relative w-full py-4 rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)] to-yellow-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                    <span className="relative text-black font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3">
                      {loading ? 'Oluşturuluyor...' : 'Yeni Oda Kur'}
                    </span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      disabled={!canProceed}
                      onClick={() => setMode('join')}
                      className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium text-sm tracking-wider uppercase disabled:opacity-40 transition-all active:scale-[0.98]"
                    >
                      Odaya Katıl
                    </button>
                    <button
                      onClick={handlePlayWithBots}
                      className="flex-1 py-4 rounded-2xl bg-black/40 hover:bg-black/60 border border-[var(--gold)]/30 text-[var(--gold)] font-medium text-sm tracking-wider uppercase transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <span>🤖</span> Botlarla
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--gold)]/70 text-[10px] uppercase tracking-[0.2em] ml-2">
                      Katılım Kodu
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="XXXX"
                      maxLength={4}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4
                                 text-[var(--gold)] placeholder-white/10 text-center tracking-[1em]
                                 text-2xl font-black focus:outline-none focus:border-[var(--gold)]/50
                                 transition-all uppercase shadow-inner"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setMode('idle'); setJoinCode(''); }}
                      className="py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm font-medium transition-all active:scale-[0.98]"
                    >
                      İptal
                    </button>
                    <button
                      disabled={!canProceed || joinCode.length < 4 || loading}
                      onClick={() => joinRoom(joinCode, nickname.trim())}
                      className="flex-1 relative rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)] to-yellow-600 opacity-90 hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center justify-center h-full text-black font-bold text-sm tracking-wider uppercase">
                        {loading ? 'Katılınıyor...' : 'Masaya Otur'}
                      </span>
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
                className="relative z-10"
              >
                <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4 font-medium">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Alt Bilgi */}
      <motion.div
        className="absolute bottom-8 text-white/20 text-[10px] uppercase tracking-[0.3em] flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <span>2-4 Oyuncu</span>
        <span>•</span>
        <span>Çevrimiçi & Bot</span>
      </motion.div>
    </div>
  );
}
