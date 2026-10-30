import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRoom } from '../hooks/useRoom';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { useLangStore } from '../store/useLangStore';

export function LobbyScreen() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const {
    players,
    room,
    myPlayerId,
    mySeat,
    subscribeToLobby,
    toggleReady,
    toggleBotSeat,
    startGame,
  } = useRoom();

  const [copied, setCopied] = useState(false);

  // Lobiye abone ol
  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }
    const unsub = subscribeToLobby(code);
    return unsub;
  }, [code, navigate, subscribeToLobby]);

  const isHost =
    room?.host_id === myPlayerId || sessionStorage.getItem('isHost') === 'true';

  const { initGameInDB } = useRealtimeGame({
    roomCode: code ?? '',
    roomId: room?.id ?? `room-${code}`,
    myPlayerId: myPlayerId ?? '',
    mySeat: mySeat ?? 0,
    isHost,
  });

  const humanPlayers = players.filter((p) => !p.is_bot);
  const allHumansReady = humanPlayers.length >= 1 && humanPlayers.every((p) => p.is_ready);

  const handleStart = async () => {
    if (!code) return;
    // Tam ekran + yatay mod tetikle (mobilde oyuna girerken)
    try {
      if (window.innerWidth < 1024 && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        // @ts-ignore
        await screen.orientation?.lock?.('landscape');
      }
    } catch {}

    const initialState = await initGameInDB();
    if (initialState) {
      startGame(code, initialState);
    }
  };

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const slots = [0, 1, 2, 3];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
      <div className="w-full max-w-xl luxury-panel rounded-[28px] p-6 sm:p-8 flex flex-col items-center gap-6">
        {/* Üst Başlık + Oda Kodu Kopyalama Kartı */}
        <motion.div
          className="flex flex-col items-center gap-3 w-full"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="px-3.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 text-[11px] font-extrabold uppercase tracking-[0.18em]">
            {lang === 'tr' ? 'CANLI MASA LOBİSİ' : 'LIVE TABLE LOBBY'}
          </span>

          <div className="flex items-center justify-between w-full bg-black/40 border border-[#e8c468]/35 rounded-2xl px-5 py-3.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">
                {lang === 'tr' ? 'ODA DAVET KODU' : 'ROOM INVITE CODE'}
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-[0.35em] text-[#f7e2ab] font-['JetBrains_Mono']">
                {code}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="btn-gold-3d px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <span>{copied ? '✓' : '⧉'}</span>
              <span>
                {copied
                  ? lang === 'tr'
                    ? 'Kopyalandı!'
                    : 'Copied!'
                  : lang === 'tr'
                    ? 'Kodu Kopyala'
                    : 'Copy Code'}
              </span>
            </button>
          </div>

          <p className="text-emerald-100/70 text-xs text-center">
            {lang === 'tr'
              ? 'Arkadaşların bu 4 haneli kodla katılabilir. Boş koltuklara istediğin gibi yapay zeka bot ekleyebilirsin.'
              : 'Friends can join with this 4-letter code. A friend joining automatically replaces a bot seat.'}
          </p>
        </motion.div>

        {/* 4 Masa Koltuğu */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slots.map((seat) => {
            const player = players.find((p) => p.seat === seat);
            const isMe = player?.id === myPlayerId;
            const isBot = Boolean(player?.is_bot);

            return (
              <motion.div
                key={seat}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  player
                    ? isMe
                      ? 'bg-[#e8c468]/15 border-[#e8c468]/60 shadow-[0_0_20px_rgba(232,196,104,0.15)]'
                      : isBot
                        ? 'bg-black/25 border-white/15'
                        : 'bg-emerald-900/35 border-emerald-400/35'
                    : 'bg-black/15 border-dashed border-white/15'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: seat * 0.06 }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black shrink-0 border ${
                      isMe
                        ? 'bg-[#e8c468]/25 border-[#e8c468] text-[#f7e2ab]'
                        : isBot
                          ? 'bg-white/5 border-white/15 text-emerald-200/80'
                          : 'bg-emerald-500/20 border-emerald-400/30 text-white'
                    }`}
                  >
                    {player ? (isBot ? 'AI' : ['♠', '♥', '♦', '♣'][seat]) : '—'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`font-extrabold text-sm truncate ${
                          isMe ? 'text-[#f7e2ab]' : 'text-white'
                        }`}
                      >
                        {player
                          ? player.nickname
                          : lang === 'tr'
                            ? 'Arkadaş Bekleniyor...'
                            : 'Waiting for Friend...'}
                      </p>
                      {isBot && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-extrabold text-emerald-200 uppercase">
                          BOT
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-100/50 text-[11px] font-semibold">
                      {lang === 'tr' ? `Koltuk ${seat + 1}` : `Seat ${seat + 1}`}
                      {seat === 0 ? ' • Host' : ''}
                    </p>
                  </div>
                </div>

                {/* Sağ Aksiyon: Hazır Butonu veya Bot Değiştirme (Host için) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isMe && seat !== 0 && player && (
                    <button
                      type="button"
                      onClick={() => code && toggleReady(code, player.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                        player.is_ready
                          ? 'bg-emerald-500/30 border border-emerald-400/50 text-emerald-200'
                          : 'bg-white/10 border border-white/20 text-white/70'
                      }`}
                    >
                      {player.is_ready
                        ? lang === 'tr'
                          ? '✓ Hazır'
                          : '✓ Ready'
                        : lang === 'tr'
                          ? 'Hazır Ol'
                          : 'Ready Up'}
                    </button>
                  )}

                  {isHost && seat !== 0 && (!player || isBot) && (
                    <button
                      type="button"
                      onClick={() => code && toggleBotSeat(code, seat)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-[11px] font-bold text-emerald-100 transition-colors cursor-pointer"
                      title={
                        isBot
                          ? lang === 'tr'
                            ? 'Botu çıkar ve koltuğu boş bırak'
                            : 'Remove bot & wait for human'
                          : lang === 'tr'
                            ? 'Bu koltuğa yapay zeka bot ekle'
                            : 'Fill seat with AI Bot'
                      }
                    >
                      {isBot
                        ? lang === 'tr'
                          ? 'Boşalt'
                          : 'Clear'
                        : lang === 'tr'
                          ? '+ Bot Ekle'
                          : '+ Add Bot'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Alt Aksiyonlar: Oyunu Başlat / Lobiden Ayrıl */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl btn-emerald-3d text-xs font-extrabold uppercase tracking-wider cursor-pointer"
          >
            {lang === 'tr' ? '← Ana Ekran' : '← Home'}
          </button>

          {isHost ? (
            <button
              type="button"
              disabled={!allHumansReady}
              onClick={handleStart}
              className="w-full flex-1 py-3.5 px-8 rounded-2xl btn-gold-3d font-black text-xs sm:text-sm uppercase tracking-[0.14em] disabled:opacity-45 cursor-pointer"
            >
              {lang === 'tr' ? 'MASAYI BAŞLAT' : 'START TABLE'}
            </button>
          ) : (
            <div className="flex-1 py-3.5 px-6 rounded-2xl bg-black/30 border border-white/10 text-center text-emerald-100/80 text-xs font-bold">
              {lang === 'tr'
                ? 'Masa sahibi (Host) oyunu başlatacak...'
                : 'Waiting for the Host to start the game...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
