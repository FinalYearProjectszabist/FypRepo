import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseError } from '../../api/client';
import { stationApi } from '../../api/endpoints';
import {
  AVAILABILITY, CATEGORY_LABEL, CHARGER_STATUS, CONNECTOR_LABEL, directionsUrl, distanceLabel, FACILITY_LABEL,
  formatPkr, hoursLabel,
} from '../../utils/stations';
import Alert from '../Alert';
import Spinner from '../Spinner';
import Stars from './Stars';

export default function StationDetailDrawer({ stationId, origin, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!stationId) return;
    setData(null);
    setError('');
    stationApi.get(stationId, origin?.[0], origin?.[1]).then(setData).catch((e) => setError(parseError(e).message));
  }, [stationId, origin]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const s = data?.summary;
  // Portal: the page wrapper is animated (transform), which would break position:fixed.
  return createPortal(
    <AnimatePresence>
      {stationId && (
        <>
          <motion.div className="fixed inset-0 z-[1000] bg-ink-950/60 backdrop-blur-sm" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            role="dialog" aria-modal="true"
            className="fixed inset-y-0 right-0 z-[1001] flex w-full max-w-lg flex-col border-l border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Station details</span>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <Alert>{error}</Alert>
              {!s && !error && <div className="flex justify-center py-16 text-brand-400"><Spinner className="h-6 w-6" /></div>}
              {s && (
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${AVAILABILITY[s.availability].badge}`}>{AVAILABILITY[s.availability].label}</span>
                      <span className="badge bg-white/5 text-slate-300 ring-white/10">{CATEGORY_LABEL[s.category]}</span>
                      {s.status !== 'OPERATIONAL' && <span className="badge bg-red-500/15 text-red-300 ring-red-400/25">{s.status}</span>}
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-white">{s.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{s.address}, {s.city}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Stars value={Number(s.rating)} size="h-4 w-4" />
                      <span className="font-semibold text-white">{Number(s.rating).toFixed(1)}</span>
                      <span className="text-slate-500">{s.reviewCount} reviews</span>
                    </div>
                    {data.description && <p className="mt-4 text-sm text-slate-300">{data.description}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Free now', `${s.availableChargers}/${s.totalChargers}`],
                      ['Max power', `${Number(s.maxPowerKw)} kW`],
                      [s.distanceKm !== null ? 'Distance' : 'From', s.distanceKm !== null ? distanceLabel(s.distanceKm) : `${formatPkr(s.minPricePerKwh)}`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <p className="font-display text-lg font-semibold text-white">{v}</p>
                        <p className="text-[11px] text-slate-400">{k}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-white">Chargers</h3>
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-400">
                          <tr><th className="px-3 py-2">Bay</th><th className="px-3 py-2">Connector</th><th className="px-3 py-2">Power</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Status</th></tr>
                        </thead>
                        <tbody>
                          {data.chargers.map((c) => (
                            <tr key={c.id} className="border-t border-white/5">
                              <td className="px-3 py-2.5 text-slate-300">{c.label}</td>
                              <td className="px-3 py-2.5 font-medium text-cyan-200">{CONNECTOR_LABEL[c.connectorType]}</td>
                              <td className="px-3 py-2.5 text-slate-200">{Number(c.powerKw)} kW</td>
                              <td className="px-3 py-2.5 text-slate-200">{formatPkr(c.pricePerKwh)}<span className="text-slate-500">/kWh</span></td>
                              <td className={`px-3 py-2.5 text-xs font-semibold ${CHARGER_STATUS[c.status].cls}`}>{CHARGER_STATUS[c.status].label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-white">Opening hours</h3>
                      <p className="text-sm text-slate-300">{hoursLabel(s)}</p>
                      <p className={`mt-0.5 text-xs font-semibold ${s.openNow ? 'text-emerald-400' : 'text-slate-500'}`}>{s.openNow ? 'Open now' : 'Closed now'}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-white">Facilities</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {s.facilities.length ? s.facilities.map((f) => (
                          <span key={f} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">{FACILITY_LABEL[f]}</span>
                        )) : <span className="text-sm text-slate-500">None listed</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {s && (
              <div className="flex gap-3 border-t border-white/10 px-6 py-4">
                <a href={directionsUrl(s)} target="_blank" rel="noreferrer" className="btn-secondary flex-1">Get directions ↗</a>
                <button className="btn-primary flex-1" disabled title="Coming with the Booking & Queue module">Book a slot · soon</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
