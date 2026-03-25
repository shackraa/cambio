import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../store/useToastStore';

const TOAST_STYLES = {
  info:    'bg-[var(--gold)]/20 border-[var(--gold)]/40 text-[var(--gold)]',
  success: 'bg-green-600/20 border-green-500/40 text-green-300',
  warning: 'bg-orange-500/20 border-orange-400/40 text-orange-200',
  error:   'bg-red-600/20 border-red-500/40 text-red-300',
};

const TOAST_ICONS = {
  info:    'ℹ️',
  success: '✓',
  warning: '⚠️',
  error:   '❌',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md ${TOAST_STYLES[toast.type]}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <span className="text-sm">{TOAST_ICONS[toast.type]}</span>
            <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
