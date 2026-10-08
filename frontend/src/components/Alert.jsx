import { AnimatePresence, motion } from 'framer-motion';

const STYLES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export default function Alert({ type = 'error', children }) {
  return (
    <AnimatePresence>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`rounded-lg border px-3 py-2 text-sm ${STYLES[type]}`}
          role={type === 'error' ? 'alert' : 'status'}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
