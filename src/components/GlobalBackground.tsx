import { motion } from 'framer-motion';
import { GameCard } from './GameCard';

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#041C14] overflow-hidden">
      {/* Arka plan süslemeleri (Modern zümrüt/teal renklerle) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-600/15 rounded-full blur-[150px]" />

      {/* Masa konsepti: Dağınık kartlar */}
      <div className="absolute inset-0 opacity-40">
        <motion.div className="absolute top-[10%] left-[10%] rotate-[-15deg] scale-[1.2]" animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <GameCard card={{ id: 'bg1', suit: 'hearts', rank: 'A', value: 1, isRevealed: false, isPenalty: false }} size="lg" />
        </motion.div>
        <motion.div className="absolute top-[60%] left-[5%] rotate-[25deg] scale-[0.9]" animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
          <GameCard card={{ id: 'bg2', suit: 'spades', rank: 'K', value: 10, isRevealed: false, isPenalty: false }} size="lg" />
        </motion.div>
        <motion.div className="absolute top-[20%] right-[15%] rotate-[35deg] scale-[1.1]" animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
          <GameCard card={{ id: 'bg3', suit: 'diamonds', rank: '7', value: 7, isRevealed: false, isPenalty: false }} size="lg" />
        </motion.div>
        <motion.div className="absolute bottom-[10%] right-[10%] rotate-[-20deg] scale-[1.3]" animate={{ y: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
          <GameCard card={{ id: 'bg4', suit: 'clubs', rank: 'J', value: 10, isRevealed: false, isPenalty: false }} size="lg" />
        </motion.div>
      </div>
    </div>
  );
}
