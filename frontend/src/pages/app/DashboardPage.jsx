import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vehicleApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ICONS = {
  car: 'M19 17h2v-4l-2.5-5.5A2 2 0 0 0 16.7 6H7.3a2 2 0 0 0-1.8 1.5L3 13v4h2 M3 13h18 M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0 M13 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  map: 'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z M9 3v15 M15 6v15',
  plug: 'M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0V8zM12 17v5',
};

function Icon({ d }) {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-xl border border-brand-400/20 bg-gradient-to-br from-brand-500/20 to-cyan-500/10">
      <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-brand-300" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </span>
  );
}

function Tile({ icon, title, children, to, cta, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="card flex flex-col transition-colors hover:border-brand-400/30"
    >
      <Icon d={icon} />
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      <div className="mt-1.5 flex-1 text-sm text-slate-400">{children}</div>
      {to && <Link to={to} className="btn-secondary mt-5 self-start">{cta} →</Link>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const isDriver = user.role === 'DRIVER';
  const primary = vehicles.find((v) => v.primaryVehicle);

  useEffect(() => {
    if (isDriver) vehicleApi.list().then(setVehicles).catch(() => {});
  }, [isDriver]);

  const stats = isDriver
    ? [
        { label: 'Vehicles', value: vehicles.length },
        { label: 'Battery', value: primary ? `${primary.currentBatteryPercent}%` : '—' },
        { label: 'Range left', value: primary ? `${primary.estimatedRangeLeftKm} km` : '—' },
      ]
    : [
        { label: 'Chargers listed', value: 0 },
        { label: 'Bookings today', value: 0 },
        { label: 'Earnings', value: 'PKR 0' },
      ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/15 via-ink-900/60 to-cyan-500/10 p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
        <p className="text-sm font-medium text-brand-300">Welcome back</p>
        <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
          Hi, <span className="text-gradient">{user.fullName.split(' ')[0]}</span> 👋
        </h1>
        <p className="mt-2 max-w-xl text-slate-300">
          {isDriver
            ? 'Find compatible chargers, see the cost upfront, and book a slot.'
            : 'List your chargers, set your rates and track usage from one place.'}
        </p>
        <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-ink-950/40 px-4 py-3">
              <p className="font-display text-2xl font-semibold text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isDriver && (
          <Tile icon={ICONS.car} title="Primary vehicle" to="/vehicles" cta={primary ? 'Manage vehicles' : 'Add your EV'} delay={0.05}>
            {primary ? (
              <>
                <p className="text-base font-medium text-slate-100">{primary.make} {primary.model} <span className="text-slate-500">({primary.year})</span></p>
                <p className="mt-1">{primary.connectorType} · {primary.batteryCapacityKwh} kWh</p>
              </>
            ) : (
              <p>Add your car so we only show chargers that fit its connector.</p>
            )}
          </Tile>
        )}
        <Tile icon={ICONS.shield} title="Account security" to="/security" cta="Security settings" delay={0.1}>
          Two-step verification is{' '}
          <span className={user.mfaEnabled ? 'font-semibold text-emerald-400' : 'font-semibold text-amber-400'}>
            {user.mfaEnabled ? 'ON' : 'OFF'}
          </span>
          {!user.mfaEnabled && ' — turn it on for extra protection.'}
        </Tile>
        <Tile icon={ICONS.map} title="Find chargers" to="/stations" cta="Open map" delay={0.15}>
          {isDriver
            ? 'Search nearby stations by connector, price, rating and facilities — see who is free right now.'
            : 'See how stations near you are listed, priced and rated.'}
        </Tile>
      </div>
    </div>
  );
}
