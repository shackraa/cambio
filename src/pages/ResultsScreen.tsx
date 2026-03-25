import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

export function ResultsScreen() {
  const { finalScores, winner, players, cambioCaller } = useGameStore();

  const sorted = [...finalScores].sort((a, b) => a.score - b.score);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      {/* Başlık */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1
          className="text-4xl font-black tracking-widest font-['Cinzel']"
          style={{
            background: 'linear-gradient(135deg, #d4a843 0%, #f0c96c 50%, #d4a843 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.5))',
          }}
        >
          SONUÇLAR
        </h1>
      </motion.div>

      {/* Kazanan */}
      {winner !== null && (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="text-6xl">🏆</div>
          <p className="text-[var(--gold)] font-bold text-2xl">
            {players.find(p => p.seat === winner)?.nickname ?? '—'}
          </p>
          <p className="text-white/50 text-sm">Kazandı!</p>
        </motion.div>
      )}

      {/* Skor tablosu */}
      <motion.div
        className="w-full max-w-sm flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {sorted.map((entry, rank) => {
          const player = players.find(p => p.seat === entry.seat);
          const isWinner = entry.seat === winner;
          const calledCambio = entry.seat === cambioCaller;

          return (
            <motion.div
              key={entry.seat}
              className={`flex items-center justify-between px-5 py-3 rounded-2xl border
                ${isWinner
                  ? 'bg-[var(--gold)]/20 border-[var(--gold)]/60'
                  : 'bg-black/30 border-white/10'}`}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 + rank * 0.12 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-white/40 font-bold w-5 text-center">{rank + 1}.</span>
                <span className={`font-bold ${isWinner ? 'text-[var(--gold)]' : 'text-white'}`}>
                  {player?.nickname ?? '—'}
                </span>
                {calledCambio && (
                  <span className="text-xs bg-red-600/30 border border-red-500/30 text-red-300 px-2 rounded-full">
                    Cambio
                  </span>
                )}
              </div>
              <span className={`font-bold tabular-nums text-lg ${isWinner ? 'text-[var(--gold)]' : 'text-white'}`}>
                {entry.score} pt
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Butonlar */}
      <div className="flex gap-4">
        <motion.button
          className="px-6 py-3 bg-[var(--gold)] text-black font-bold rounded-xl text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => useGameStore.getState().initGame('Sen', ['Ahmet', 'Zeynep', 'Mert'])}
        >
          🔄 Tekrar Oyna
        </motion.button>
        <motion.button
          className="px-6 py-3 bg-white/10 text-white/80 rounded-xl text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🏠 Lobiye Dön
        </motion.button>
      </div>
    </div>
  );
}
