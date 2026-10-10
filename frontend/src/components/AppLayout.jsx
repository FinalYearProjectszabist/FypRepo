import { motion } from 'framer-motion';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROLE_LABEL, useAuth } from '../context/AuthContext';
import { Logo } from './AuthLayout';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['DRIVER', 'STATION_OWNER'] },
  { to: '/stations', label: 'Find Chargers', roles: ['DRIVER', 'STATION_OWNER', 'ADMIN'] },
  { to: '/vehicles', label: 'My Vehicles', roles: ['DRIVER'] },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/profile', label: 'Profile', roles: ['DRIVER', 'STATION_OWNER', 'ADMIN'] },
  { to: '/security', label: 'Security', roles: ['DRIVER', 'STATION_OWNER', 'ADMIN'] },
];

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {LINKS.filter((l) => l.roles.includes(user.role)).map((l) => (
              <NavLink key={l.to} to={l.to} className="relative whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg border border-brand-400/20 bg-brand-500/10"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className={`relative ${isActive ? 'text-brand-200' : 'text-slate-400 hover:text-white'}`}>{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-white">{user.fullName}</p>
              <p className="text-xs text-brand-300">{ROLE_LABEL[user.role]}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-cyan-500 text-sm font-bold text-ink-950">
              {initials(user.fullName)}
            </span>
            <button className="btn-secondary px-3 py-2" onClick={() => { logout(); navigate('/login'); }}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
