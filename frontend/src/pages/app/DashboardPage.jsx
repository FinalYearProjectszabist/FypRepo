import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vehicleApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

function Tile({ title, children, to, cta }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
      {to && <Link to={to} className="btn-secondary mt-4">{cta}</Link>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [primary, setPrimary] = useState(null);

  useEffect(() => {
    if (user.role === 'DRIVER') {
      vehicleApi.list().then((list) => setPrimary(list.find((v) => v.primaryVehicle) || null)).catch(() => {});
    }
  }, [user.role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.fullName.split(' ')[0]}!</h1>
        <p className="text-slate-500">
          {user.role === 'DRIVER'
            ? 'Find compatible chargers, see the cost upfront, and book a slot.'
            : 'List your chargers, set your rates and track usage from one place.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {user.role === 'DRIVER' && (
          <Tile
            title="Primary vehicle"
            to="/vehicles"
            cta={primary ? 'Manage vehicles' : 'Add your EV'}
          >
            {primary ? (
              <>
                <p className="text-base font-medium text-slate-800">{primary.make} {primary.model} ({primary.year})</p>
                <p>{primary.connectorType} · {primary.batteryCapacityKwh} kWh · {primary.currentBatteryPercent}% (~{primary.estimatedRangeLeftKm} km left)</p>
              </>
            ) : (
              <p>Add your car so we can show only chargers that fit its connector.</p>
            )}
          </Tile>
        )}
        <Tile title="Account security" to="/security" cta="Security settings">
          Two-step verification is{' '}
          <span className={user.mfaEnabled ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-600'}>
            {user.mfaEnabled ? 'ON' : 'OFF'}
          </span>.
        </Tile>
        <Tile title="Coming next">
          {user.role === 'DRIVER'
            ? 'Station Discovery, Compatibility Engine and Cost Calculator modules will appear here.'
            : 'Owner Management and Charger Marketplace modules will appear here.'}
        </Tile>
      </div>
    </div>
  );
}
