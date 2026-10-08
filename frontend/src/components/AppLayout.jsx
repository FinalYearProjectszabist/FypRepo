import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROLE_LABEL, useAuth } from '../context/AuthContext';
import { Logo } from './AuthLayout';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['DRIVER', 'STATION_OWNER'] },
  { to: '/vehicles', label: 'My Vehicles', roles: ['DRIVER'] },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
  { to: '/profile', label: 'Profile', roles: ['DRIVER', 'STATION_OWNER', 'ADMIN'] },
  { to: '/security', label: 'Security', roles: ['DRIVER', 'STATION_OWNER', 'ADMIN'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{user.fullName}</span>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {ROLE_LABEL[user.role]}
            </span>
            <button
              className="btn-secondary"
              onClick={() => { logout(); navigate('/login'); }}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
          {LINKS.filter((l) => l.roles.includes(user.role)).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                  isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
