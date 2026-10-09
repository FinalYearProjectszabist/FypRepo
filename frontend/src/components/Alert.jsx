import { AnimatePresence, motion } from 'framer-motion';

const STYLES = {
  error: 'border-red-400/25 bg-red-500/10 text-red-200',
  success: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  info: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
};

export default function Alert({ type = 'error', children }) {
  return (
    <AnimatePresence>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`rounded-xl border px-3.5 py-2.5 text-sm backdrop-blur ${STYLES[type]}`}
          role={type === 'error' ? 'alert' : 'status'}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
