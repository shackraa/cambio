// @ts-nocheck
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { supabase } from '../lib/supabase';

interface LobbyPlayer {
  id: string;
  nickname: string;
  seat: number;
  is_ready: boolean;
  is_online: boolean;
}

const SEAT_ICONS = ['🎴', '🃏', '🂡', '🎲'];

export function LobbyScreen() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { players, room, myPlayerId, mySeat, subscribeToLobby, toggleReady, startGame } = useRoom();
  const [roomId, setRoomId] = useState<string | null>(null);

  // Oda bilgisini yükle
  useEffect(() => {
    if (!code) return;
    supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()
      .then(({ data }) => {
        if (data) {
          setRoomId(data.id);
        } else {
          navigate('/');
        }
      });
  }, [code, navigate]);

  // Lobiye subscribe ol
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToLobby(roomId);
    return unsub;
  }, [roomId, subscribeToLobby]);

  // Host kontrolü (Sayfa yenilemelerinde kaybolmaması için sessionStorage da kontrol ediliyor)
  const isHost = room?.host_id === myPlayerId || sessionStorage.getItem('isHost') === 'true';

  const { initGameInDB } = useRealtimeGame({
    roomCode: code ?? '',
    roomId: roomId ?? '',
    myPlayerId: myPlayerId ?? '',
    mySeat: mySeat ?? 0,
    isHost: isHost,
  });

  const allReady = players.length >= 2 && players.every(p => p.is_ready);

  // Oyunu başlat
  const handleStart = async () => {
    if (!roomId) {
      console.error('roomId yok, oyun başlatılamaz!');
      return;
    }
    await initGameInDB();
    await startGame(roomId);
  };

  const slots = [0, 1, 2, 3];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      {/* Logo + oda kodu */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1
          className="font-['Cinzel'] text-4xl font-black tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #d4a843 0%, #f0c96c 50%, #d4a843 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 10px rgba(212,168,67,0.5))',
          }}
        >
          LOBİ
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm">Oda Kodu:</span>
          <span className="text-[var(--gold)] font-black text-2xl tracking-[0.4em] font-mono">
            {code}
          </span>
          <button
            className="text-white/30 hover:text-white/60 text-sm transition-colors"
            onClick={() => navigator.clipboard.writeText(code ?? '')}
            title="Kodu kopyala"
          >
            📋
          </button>
        </div>
      </motion.div>

      {/* Oyuncu slotları */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {slots.map((seat) => {
          const player = players.find((p: LobbyPlayer) => p.seat === seat);
          const isMe = player?.id === myPlayerId;

          return (
            <motion.div
              key={seat}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl border
                ${player
                  ? 'bg-black/30 border-white/15'
                  : 'bg-black/10 border-dashed border-white/10'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: seat * 0.08 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{player ? SEAT_ICONS[seat] : '⬜'}</span>
                {player ? (
                  <div>
                    <p className={`font-semibold text-sm ${isMe ? 'text-[var(--gold)]' : 'text-white'}`}>
                      {player.nickname}
                    </p>
                    <p className="text-white/30 text-xs">Koltuk {seat + 1}</p>
                  </div>
                ) : (
                  <p className="text-white/25 text-sm italic">Bekleniyor...</p>
                )}
              </div>

              {player && (
                isMe ? (
                  <motion.button
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                      ${player.is_ready
                        ? 'bg-green-600/40 border border-green-500/40 text-green-300'
                        : 'bg-white/10 border border-white/15 text-white/60'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleReady(player.id, player.is_ready)}
                  >
                    {player.is_ready ? '✓ Hazır' : 'Hazır Değil'}
                  </motion.button>
                ) : (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg
                    ${player.is_ready
                      ? 'text-green-400 bg-green-900/20'
                      : 'text-white/30 bg-white/5'}`}>
                    {player.is_ready ? '✓ Hazır' : 'Bekliyor'}
                  </span>
                )
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Başlat / Bekle */}
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {isHost ? (
          <motion.button
            className={`px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all
              ${allReady
                ? 'text-black shadow-[0_0_20px_rgba(212,168,67,0.4)]'
                : 'text-white/30 border border-white/10 bg-transparent cursor-not-allowed'}`}
            style={allReady ? {
              background: 'linear-gradient(135deg, #d4a843, #f0c96c)',
            } : {}}
            whileHover={allReady ? { scale: 1.05 } : {}}
            whileTap={allReady ? { scale: 0.97 } : {}}
            disabled={!allReady}
            onClick={handleStart}
          >
            {allReady ? '🚀 Oyunu Başlat' : `⏳ ${players.filter((p: LobbyPlayer) => !p.is_ready).length} oyuncu hazır değil`}
          </motion.button>
        ) : (
          <p className="text-white/40 text-sm">Host oyunu başlatacak...</p>
        )}

        <button
          className="text-white/25 hover:text-white/50 text-xs transition-colors"
          onClick={() => navigate('/')}
        >
          ← Lobiden Ayrıl
        </button>
      </motion.div>
    </div>
  );
}
