import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';

export function HomeScreen() {
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const { loading, error, createRoom, joinRoom } = useRoom();

  const canProceed = nickname.trim().length >= 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-10">
      {/* Logo */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="text-7xl">🃏</div>
        <h1
          className="font-['Cinzel'] text-6xl font-black tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #d4a843 0%, #f0c96c 50%, #d4a843 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 16px rgba(212,168,67,0.7))',
          }}
        >
          CAMBIO
        </h1>
        <p className="text-white/40 text-sm tracking-widest uppercase">Hafıza & Strateji Kart Oyunu</p>
      </motion.div>

      {/* Kart */}
      <motion.div
        className="w-full max-w-sm flex flex-col gap-5
                   bg-black/30 backdrop-blur-sm rounded-3xl p-6
                   border border-white/10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Nickname */}
        <div className="flex flex-col gap-1.5">
          <label className="text-white/50 text-xs uppercase tracking-wider">Kullanıcı Adın</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="örn. Ahmet"
            maxLength={16}
            className="bg-white/8 border border-white/15 rounded-xl px-4 py-3
                       text-white placeholder-white/25 focus:outline-none focus:border-[var(--gold)]/60
                       transition-colors text-sm"
          />
        </div>

        {/* Mod: idle → butonlar, join → kod girişi */}
        {mode === 'idle' ? (
          <div className="flex flex-col gap-3">
            <motion.button
              className="w-full py-3.5 font-bold text-black rounded-xl text-sm tracking-wide
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96c)' }}
              whileHover={canProceed ? { scale: 1.02 } : {}}
              whileTap={canProceed ? { scale: 0.98 } : {}}
              disabled={!canProceed || loading}
              onClick={() => createRoom(nickname.trim())}
            >
              {loading ? '⏳ Oluşturuluyor...' : '🏠 Oda Oluştur'}
            </motion.button>

            <motion.button
              className="w-full py-3.5 font-bold text-white/80 rounded-xl text-sm
                         border border-white/15 bg-white/5 hover:bg-white/10
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              whileHover={canProceed ? { scale: 1.02 } : {}}
              whileTap={canProceed ? { scale: 0.98 } : {}}
              disabled={!canProceed}
              onClick={() => setMode('join')}
            >
              🚪 Odaya Katıl
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-white/50 text-xs uppercase tracking-wider">Oda Kodu</label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="örn. K4F2"
                maxLength={4}
                className="bg-white/8 border border-white/15 rounded-xl px-4 py-3
                           text-white placeholder-white/25 text-center tracking-[0.5em]
                           text-xl font-bold focus:outline-none focus:border-[var(--gold)]/60
                           transition-colors uppercase"
              />
            </div>

            <div className="flex gap-2">
              <motion.button
                className="flex-1 py-3 text-white/60 rounded-xl text-sm border border-white/10
                           bg-white/5 hover:bg-white/10 transition-colors"
                whileTap={{ scale: 0.97 }}
                onClick={() => { setMode('idle'); setJoinCode(''); }}
              >
                ← Geri
              </motion.button>
              <motion.button
                className="flex-1 py-3 font-bold text-black rounded-xl text-sm
                           disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96c)' }}
                whileHover={joinCode.length === 4 && canProceed ? { scale: 1.02 } : {}}
                whileTap={joinCode.length === 4 && canProceed ? { scale: 0.98 } : {}}
                disabled={!canProceed || joinCode.length < 4 || loading}
                onClick={() => joinRoom(joinCode, nickname.trim())}
              >
                {loading ? '⏳ Katılınıyor...' : 'Katıl →'}
              </motion.button>
            </div>
          </div>
        )}

        {/* Hata */}
        {error && (
          <motion.p
            className="text-red-400 text-xs text-center bg-red-900/20 rounded-lg py-2 px-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ⚠️ {error}
          </motion.p>
        )}
      </motion.div>

      {/* Alt bilgi */}
      <motion.p
        className="text-white/20 text-xs text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        2–4 oyuncu · Gerçek zamanlı · Hafıza & Strateji
      </motion.p>
    </div>
  );
}
