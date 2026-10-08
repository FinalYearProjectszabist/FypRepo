import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold text-brand-700">
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-brand-600" aria-hidden>
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
      <span>EV Charge Network</span>
    </Link>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-slate-600">{footer}</div>}
      </motion.div>
    </div>
  );
}
