import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseError } from '../../api/client';
import { compatibilityApi, stationApi } from '../../api/endpoints';
import {
  AVAILABILITY, CATEGORY_LABEL, CHARGER_STATUS, COMPATIBILITY, CONNECTOR_LABEL, directionsUrl, distanceLabel,
  FACILITY_LABEL, formatPkr, hoursLabel, SEVERITY, VERDICT,
} from '../../utils/stations';
import Alert from '../Alert';
import Spinner from '../Spinner';
import Stars from './Stars';

/** Pre Booking Compatibility Warning (Module 3) result panel. */
function PreBookingResult({ result, onPick }) {
  const v = VERDICT[result.verdict];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-4 ${v.cls}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-sm font-bold">{v.icon}</span>
        <p className="font-semibold">{v.label}</p>
      </div>
      <p className="mt-1 text-xs opacity-80">
        {result.vehicle.name} · {result.chargerLabel ? `${result.chargerLabel}` : 'no suitable charger'}
        {result.effectivePowerKw && ` · charges at ${Number(result.effectivePowerKw)} kW`}
      </p>
      <ul className="mt-3 space-y-2">
        {result.checks.map((c, i) => (
          <li key={i} className="flex gap-2.5 text-sm">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY[c.severity].dot}`} />
            <span className="text-slate-200">
              <span className={`mr-1.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY[c.severity].cls}`}>{c.severity}</span>
              {c.message}
            </span>
          </li>
        ))}
      </ul>
      {result.recommendedChargerId && (
        <button type="button" onClick={() => onPick(result.recommendedChargerId)} className="btn-secondary mt-4 w-full">
          Switch to {result.recommendedChargerLabel} (recommended)
        </button>
      )}
    </motion.div>
  );
}

export default function StationDetailDrawer({ stationId, origin, vehicleId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [chargerId, setChargerId] = useState(null);
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!stationId) return;
    setData(null);
    setError('');
    setCheck(null);
    stationApi.get(stationId, origin?.[0], origin?.[1], vehicleId)
      .then((d) => {
        setData(d);
        // pre-select the fastest charger that fits and is free
        const best = d.chargers
          .filter((c) => c.compatible !== false && c.status === 'AVAILABLE')
          .sort((a, b) => Number(b.effectivePowerKw ?? b.powerKw) - Number(a.effectivePowerKw ?? a.powerKw))[0];
        setChargerId(best?.id ?? null);
      })
      .catch((e) => setError(parseError(e).message));
  }, [stationId, origin, vehicleId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const runCheck = async (id = chargerId) => {
    setChecking(true);
    setError('');
    try {
      setCheck(await compatibilityApi.preBookingCheck({
        vehicleId, stationId, chargerId: id, lat: origin?.[0], lng: origin?.[1],
      }));
    } catch (e) {
      setError(parseError(e).message);
    } finally {
      setChecking(false);
    }
  };

  const pick = (id) => {
    setChargerId(id);
    setCheck(null);
    if (check) runCheck(id);
  };

  const s = data?.summary;
  const compat = s?.compatibility ? COMPATIBILITY[s.compatibility] : null;
  // Portal: the page wrapper is animated (transform), which would break position:fixed.
  return createPortal(
    <AnimatePresence>
      {stationId && (
        <>
          <motion.div className="fixed inset-0 z-[1000] bg-ink-950/60 backdrop-blur-sm" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            role="dialog" aria-modal="true"
            className="fixed inset-y-0 right-0 z-[1001] flex w-full max-w-xl flex-col border-l border-white/10 bg-ink-900/95 shadow-2xl backdrop-blur-xl"
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

                  {compat && (
                    <div className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${compat.badge}`}>
                      <p className="font-semibold">{compat.icon} {compat.label} — {data.vehicle.name}</p>
                      <p className="mt-0.5 text-xs opacity-80">
                        {s.compatibleChargers} of {data.chargers.length} chargers fit
                        {s.effectiveMaxPowerKw && ` · fastest for your car: ${Number(s.effectiveMaxPowerKw)} kW`}
                      </p>
                    </div>
                  )}

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
                    <h3 className="mb-2 text-sm font-semibold text-white">
                      Chargers {vehicleId && <span className="font-normal text-slate-500">— pick one to check before booking</span>}
                    </h3>
                    <div className="space-y-2">
                      {data.chargers.map((c) => {
                        const fits = c.compatible;
                        const selected = vehicleId && chargerId === c.id;
                        return (
                          <button
                            type="button"
                            key={c.id}
                            disabled={!vehicleId}
                            onClick={() => pick(c.id)}
                            className={`w-full rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-default ${
                              selected ? 'border-brand-400/60 bg-brand-500/10' : 'border-white/10 bg-white/[0.02] enabled:hover:border-white/20'
                            } ${fits === false ? 'opacity-60' : ''}`}
                          >
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                              {vehicleId && (
                                <span className={`grid h-4 w-4 place-items-center rounded-full border ${selected ? 'border-brand-400' : 'border-white/30'}`}>
                                  {selected && <span className="h-2 w-2 rounded-full bg-brand-400" />}
                                </span>
                              )}
                              <span className="w-12 text-slate-300">{c.label}</span>
                              <span className="w-16 font-medium text-cyan-200">{CONNECTOR_LABEL[c.connectorType]}</span>
                              <span className="text-slate-200">{Number(c.powerKw)} kW</span>
                              <span className="text-slate-200">{formatPkr(c.pricePerKwh)}<span className="text-slate-500">/kWh</span></span>
                              <span className={`ml-auto text-xs font-semibold ${CHARGER_STATUS[c.status].cls}`}>{CHARGER_STATUS[c.status].label}</span>
                            </div>
                            {fits !== null && fits !== undefined && (
                              <p className={`mt-1.5 text-xs ${fits ? 'text-emerald-300' : 'text-red-300'} ${vehicleId ? 'pl-8' : ''}`}>
                                {fits ? '✓' : '✕'} {c.compatibilityNote}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!vehicleId && (
                      <p className="mt-2 text-xs text-slate-500">Select your vehicle in Filters → Compatibility to see which chargers fit.</p>
                    )}
                  </div>

                  {check && <PreBookingResult result={check} onPick={pick} />}

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
                {vehicleId ? (
                  check && check.verdict !== 'BLOCKED' ? (
                    <button className="btn-primary flex-1" disabled title="Coming with the Booking & Queue module">Book slot · soon</button>
                  ) : (
                    <button className="btn-primary flex-1" onClick={() => runCheck()} disabled={checking}>
                      {checking && <Spinner />} Check &amp; book
                    </button>
                  )
                ) : (
                  <button className="btn-primary flex-1" disabled title="Add a vehicle to check compatibility before booking">Book a slot</button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
