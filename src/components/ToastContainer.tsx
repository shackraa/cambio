import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../store/useToastStore';

const TOAST_STYLES = {
  info: 'bg-[#0e3023]/95 border-[#e8c468]/45 text-[#fdf6e3]',
  success: 'bg-emerald-950/95 border-emerald-400/50 text-emerald-100',
  warning: 'bg-amber-950/95 border-amber-400/50 text-amber-100',
  error: 'bg-[#2b0c10]/95 border-red-400/55 text-red-100',
};

const TOAST_BADGES = {
  info: { bg: 'bg-[#e8c468]/20 text-[#f7e2ab]', icon: '✦' },
  success: { bg: 'bg-emerald-500/25 text-emerald-300', icon: '✓' },
  warning: { bg: 'bg-amber-500/25 text-amber-300', icon: '!' },
  error: { bg: 'bg-red-500/25 text-red-300', icon: '✕' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[150] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const badge = TOAST_BADGES[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -14, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md cursor-pointer ${TOAST_STYLES[toast.type]}`}
              onClick={() => removeToast(toast.id)}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${badge.bg}`}
              >
                {badge.icon}
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wide">
                {toast.message}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
