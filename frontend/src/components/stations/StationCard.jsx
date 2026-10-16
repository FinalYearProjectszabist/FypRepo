import { motion } from 'framer-motion';
import { AVAILABILITY, CATEGORY_LABEL, COMPATIBILITY, CONNECTOR_LABEL, distanceLabel, FACILITY_LABEL, formatPkr } from '../../utils/stations';
import Stars from './Stars';

export default function StationCard({ station: s, selected, onSelect, onDetails }) {
  const a = AVAILABILITY[s.availability];
  const compat = s.compatibility ? COMPATIBILITY[s.compatibility] : null;
  const incompatible = s.compatibility === 'INCOMPATIBLE';
  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(s)}
      className={`group cursor-pointer rounded-2xl border p-4 backdrop-blur-xl transition ${
        selected ? 'border-brand-400/50 bg-brand-500/10 shadow-glow' : 'border-white/10 bg-ink-900/60 hover:border-white/20 hover:bg-ink-900/80'
      } ${incompatible ? 'opacity-55 saturate-50 hover:opacity-80' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <span>{CATEGORY_LABEL[s.category]}</span>
            {s.distanceKm !== null && <><span className="text-slate-600">•</span><span className="text-brand-300">{distanceLabel(s.distanceKm)}</span></>}
          </div>
          <h3 className="mt-1 truncate font-semibold text-white">{s.name}</h3>
          <p className="truncate text-sm text-slate-400">{s.address}, {s.city}</p>
        </div>
        <span className={`badge shrink-0 ${a.badge}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.color }} />
          {a.label}
        </span>
      </div>

      {compat && (
        <div className={`mt-3 flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-inset ${compat.badge}`}>
          <span className="font-semibold">{compat.icon} {compat.label}</span>
          {s.compatibility === 'PARTIAL' && <span className="opacity-80">· {s.compatibleChargers} {s.compatibleChargers === 1 ? 'charger fits' : 'chargers fit'}</span>}
          {s.effectiveMaxPowerKw && <span className="ml-auto opacity-90">Your car: up to <b>{Number(s.effectiveMaxPowerKw)} kW</b></span>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5">
          <Stars value={Number(s.rating)} />
          <span className="text-slate-300">{Number(s.rating).toFixed(1)}</span>
          <span className="text-slate-500">({s.reviewCount})</span>
        </span>
        <span className="text-slate-300"><b className="text-white">{s.availableChargers}</b>/{s.totalChargers} free</span>
        <span className="text-slate-300">up to <b className="text-white">{Number(s.maxPowerKw)} kW</b></span>
        <span className="text-slate-300">from <b className="text-white">{formatPkr(s.minPricePerKwh)}</b>/kWh</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {s.connectors.map((c) => (
          <span key={c} className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-200">
            {CONNECTOR_LABEL[c]}
          </span>
        ))}
        {s.facilities.slice(0, 4).map((f) => (
          <span key={f} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">{FACILITY_LABEL[f]}</span>
        ))}
        {s.facilities.length > 4 && <span className="text-xs text-slate-500">+{s.facilities.length - 4}</span>}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDetails(s); }}
          className="ml-auto text-sm font-semibold text-brand-300 opacity-80 transition hover:text-brand-200 group-hover:opacity-100"
        >
          Details →
        </button>
      </div>
    </motion.article>
  );
}
