import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function Logo({ compact = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-ink-950" aria-hidden>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          EV Charge<span className="text-gradient"> Network</span>
        </span>
      )}
    </Link>
  );
}

const FEATURES = [
  {
    title: 'Plug fits, guaranteed',
    desc: 'Only see chargers that match your car — CCS2, CHAdeMO or Type 2.',
    icon: 'M13 2 3 14h7l-1 8 10-12h-7l1-8z',
  },
  {
    title: 'Cost before you charge',
    desc: 'Know the full price upfront. No surprises at the station.',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  {
    title: 'Book a slot or join the queue',
    desc: 'Skip the waiting line — reserve your charger in advance.',
    icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  },
];

function Hero() {
  return (
    <div className="hidden flex-col justify-between p-12 lg:sticky lg:top-0 lg:flex lg:h-screen xl:p-16">
      <Logo />
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-lg"
      >
        <span className="badge bg-brand-500/10 text-brand-300 ring-brand-400/20">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" /> Pakistan&apos;s connected EV network
        </span>
        <h1 className="mt-5 text-5xl font-bold leading-[1.1] text-white xl:text-6xl">
          Charge smarter.<br />
          <span className="text-gradient">Drive further.</span>
        </h1>
        <p className="mt-5 text-lg text-slate-400">
          Public stations, home chargers and business points — all on one platform.
        </p>
        <ul className="mt-10 space-y-5">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="flex gap-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
                <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-brand-300" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>
      <p className="text-xs text-slate-500">© {new Date().getFullYear()} EV Charge Network · SZABIST Islamabad FYP</p>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <Hero />
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex justify-center lg:hidden"><Logo /></div>
          <div className="relative">
            {/* gradient border glow */}
            <div className="absolute -inset-px rounded-[1.1rem] bg-gradient-to-br from-brand-400/40 via-white/5 to-cyan-400/30 opacity-70 blur-[1px]" />
            <div className="card relative p-8">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
              <div className="mt-7">{children}</div>
            </div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}
