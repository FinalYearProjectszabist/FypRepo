import { CONNECTORS, FACILITIES, STATUSES } from '../../utils/stations';

function Section({ title, children, action }) {
  return (
    <div className="border-b border-white/10 py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="mb-2.5 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
        active ? 'border-brand-400/50 bg-brand-500/15 text-brand-200' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
      <span className="relative">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-brand-500" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function FiltersPanel({ filters, set, vehicles, vehicleId, setVehicleId, onReset }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Filters</h3>
        <button type="button" onClick={onReset} className="text-xs font-medium text-slate-400 hover:text-white">Reset all</button>
      </div>

      {vehicles.length > 0 && (
        <Section title="Compatibility">
          <label className="label text-xs" htmlFor="vehicleSelect">Charging for</label>
          <select id="vehicleSelect" className="input py-2" value={vehicleId ?? ''}
            onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">No vehicle (show everything)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model} · {v.compatibleConnectors.join(' / ')}</option>
            ))}
          </select>
          {vehicleId && (
            <div className="mt-3">
              <Toggle label="Hide incompatible stations" hint="Only show chargers that fit your car"
                checked={filters.hideIncompatible} onChange={(v) => set({ hideIncompatible: v })} />
            </div>
          )}
        </Section>
      )}

      <Section title="Connector">
        <div className="flex flex-wrap gap-2">
          {CONNECTORS.map((c) => (
            <Chip key={c.value} active={filters.connectors.includes(c.value)}
              onClick={() => set({ connectors: toggleIn(filters.connectors, c.value) })}>
              {c.label} <span className="text-slate-500">· {c.hint}</span>
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Availability & status">
        <div className="space-y-3">
          <Toggle label="Available now" hint="A matching charger is free" checked={filters.availableOnly}
            onChange={(v) => set({ availableOnly: v })} />
          <Toggle label="Open now" checked={filters.openNow} onChange={(v) => set({ openNow: v })} />
          <div className="flex flex-wrap gap-2 pt-1">
            {STATUSES.map((s) => (
              <Chip key={s.value} active={filters.statuses.includes(s.value)}
                onClick={() => set({ statuses: toggleIn(filters.statuses, s.value) })}>
                {s.label}
              </Chip>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">No status selected = show all.</p>
        </div>
      </Section>

      <Section title="Charging speed">
        <div className="flex flex-wrap gap-2">
          {[0, 22, 50, 120].map((kw) => (
            <Chip key={kw} active={filters.minPowerKw === kw} onClick={() => set({ minPowerKw: kw })}>
              {kw === 0 ? 'Any' : `${kw}+ kW`}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Max price" action={<span className="text-xs font-semibold text-brand-300">{filters.maxPrice >= 150 ? 'Any' : `Rs ${filters.maxPrice}/kWh`}</span>}>
        <input type="range" min="40" max="150" step="5" value={filters.maxPrice}
          onChange={(e) => set({ maxPrice: Number(e.target.value) })} className="w-full accent-brand-500" />
      </Section>

      <Section title="Rating">
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <Chip key={r} active={filters.minRating === r} onClick={() => set({ minRating: r })}>
              {r === 0 ? 'Any' : <>{r}+ <span className="text-amber-300">★</span></>}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Facilities">
        <div className="flex flex-wrap gap-2">
          {FACILITIES.map((f) => (
            <Chip key={f.value} active={filters.facilities.includes(f.value)}
              onClick={() => set({ facilities: toggleIn(filters.facilities, f.value) })}>
              {f.label}
            </Chip>
          ))}
        </div>
      </Section>
    </div>
  );
}
