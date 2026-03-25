import { motion, AnimatePresence } from 'framer-motion';
import type { PowerType } from '../engine/gameEngine';
import type { Player } from '../types/game';
import { GameCard } from './GameCard';

interface PowerModalProps {
  power: PowerType;
  myCards: Player['cards'];
  opponents: Player[];
  myTurn: boolean;
  onUse: (targetSeat: number, targetPos: number, swapWithPos?: number) => void;
  onSkip: () => void;
}

const POWER_INFO: Record<PowerType, { emoji: string; title: string; desc: string }> = {
  peek_own:   { emoji: '🔍', title: 'Kendi Kartına Bak', desc: 'Elindeki bir kartı gizlice görürsün.' },
  peek_other: { emoji: '👁', title: 'Rakip Kartına Bak',  desc: 'Bir rakibinin kartını gizlice görürsün.' },
  blind_swap: { emoji: '🔀', title: 'Kör Takas',          desc: 'Bakmadan iki kartı yer değiştirir.' },
  spy_swap:   { emoji: '🕵️', title: 'Gizli Ajan',         desc: 'Bir kartı gör, istersen kendinle takas et.' },
};

export function PowerModal({ power, myCards, opponents, onUse, onSkip }: PowerModalProps) {
  const info = POWER_INFO[power];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-[var(--felt-mid)] border border-[var(--gold)]/40 rounded-3xl
                     p-6 flex flex-col items-center gap-5 max-w-md w-full mx-4"
          initial={{ scale: 0.85, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div className="text-5xl">{info.emoji}</div>
          <div className="text-center">
            <h2 className="text-[var(--gold)] font-bold text-lg">{info.title}</h2>
            <p className="text-white/60 text-sm mt-1">{info.desc}</p>
          </div>

          {/* peek_own: kendi kartlarından seç */}
          {power === 'peek_own' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/50 text-xs">Hangi kartına bakmak istiyorsun?</span>
              <div className="flex gap-3">
                {myCards.map((card, pos) => (
                  <motion.div
                    key={pos}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onUse(0, pos)}
                    className="cursor-pointer"
                  >
                    <GameCard card={{ ...card, isRevealed: false }} size="sm" canInteract />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* peek_other / spy_swap: rakip seç */}
          {(power === 'peek_other' || power === 'spy_swap') && (
            <div className="flex flex-col gap-3 w-full">
              {opponents.map(opp => (
                <div key={opp.id} className="flex flex-col gap-1">
                  <span className="text-white/50 text-xs">{opp.nickname}</span>
                  <div className="flex gap-2">
                    {opp.cards.map((card, pos) => (
                      <motion.div
                        key={pos}
                        whileHover={{ scale: 1.1, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onUse(opp.seat, pos)}
                        className="cursor-pointer"
                      >
                        <GameCard card={{ ...card, isRevealed: false }} size="sm" canInteract />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* blind_swap: iki kart seç */}
          {power === 'blind_swap' && (
            <div className="flex flex-col items-center gap-3">
              <span className="text-white/50 text-xs text-center">
                Kendi kartından birini seç → rakibininkiyle takas
              </span>
              <div className="flex gap-2">
                {myCards.map((card, pos) => (
                  <motion.div
                    key={pos}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const opp = opponents[0];
                      if (opp) onUse(opp.seat, 0, pos);
                    }}
                    className="cursor-pointer"
                  >
                    <GameCard card={{ ...card, isRevealed: false }} size="sm" canInteract />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <motion.button
            className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSkip}
          >
            Gücü Geç →
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
