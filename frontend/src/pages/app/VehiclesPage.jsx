import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { parseError } from '../../api/client';
import { vehicleApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';

const CONNECTORS = [
  { value: 'CCS2', label: 'CCS2 (Combo 2) — DC fast' },
  { value: 'CHADEMO', label: 'CHAdeMO — DC fast' },
  { value: 'TYPE2', label: 'Type 2 (Mennekes) — AC' },
];

// Quick-fill presets for EVs common in Pakistan (values are approximate).
const PRESETS = [
  { make: 'BYD', model: 'Atto 3', batteryCapacityKwh: '60.48', connectorType: 'CCS2', additionalConnectors: [], maxAcPowerKw: '7', maxDcPowerKw: '88', rangeKm: '420' },
  { make: 'MG', model: 'ZS EV', batteryCapacityKwh: '51', connectorType: 'CCS2', additionalConnectors: [], maxAcPowerKw: '7', maxDcPowerKw: '76', rangeKm: '320' },
  { make: 'Hyundai', model: 'Ioniq 5', batteryCapacityKwh: '72.6', connectorType: 'CCS2', additionalConnectors: [], maxAcPowerKw: '11', maxDcPowerKw: '220', rangeKm: '480' },
  { make: 'Nissan', model: 'Leaf', batteryCapacityKwh: '40', connectorType: 'CHADEMO', additionalConnectors: ['TYPE2'], maxAcPowerKw: '6.6', maxDcPowerKw: '50', rangeKm: '270' },
  { make: 'Honeta', model: 'Seagull', batteryCapacityKwh: '30.08', connectorType: 'TYPE2', additionalConnectors: [], maxAcPowerKw: '6.6', maxDcPowerKw: '', rangeKm: '305' },
];

const CONNECTOR_SHORT = { CCS2: 'CCS2', CHADEMO: 'CHAdeMO', TYPE2: 'Type 2' };

const EMPTY = {
  make: '', model: '', year: String(new Date().getFullYear()), batteryCapacityKwh: '', connectorType: 'CCS2',
  additionalConnectors: [], maxAcPowerKw: '', maxDcPowerKw: '',
  rangeKm: '', currentBatteryPercent: '80', licensePlate: '', primaryVehicle: false,
};

const schema = {
  make: rules.make,
  model: rules.model,
  year: rules.year,
  batteryCapacityKwh: rules.batteryCapacityKwh,
  connectorType: rules.connectorType,
  rangeKm: rules.rangeKm,
  currentBatteryPercent: rules.currentBatteryPercent,
  licensePlate: rules.licensePlate,
  maxAcPowerKw: rules.maxAcPowerKw,
  maxDcPowerKw: rules.maxDcPowerKw,
};

function VehicleForm({ initial, onSaved, onCancel }) {
  const { values, setValues, errors, setErrors, onChange, onBlur, validateAll } = useForm(initial || EMPTY, schema);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setBusy(true);
    const body = {
      ...values,
      year: +values.year,
      batteryCapacityKwh: +values.batteryCapacityKwh,
      rangeKm: +values.rangeKm,
      currentBatteryPercent: +values.currentBatteryPercent,
      licensePlate: values.licensePlate.trim() || null,
      additionalConnectors: values.additionalConnectors.filter((c) => c !== values.connectorType),
      maxAcPowerKw: values.maxAcPowerKw === '' ? null : +values.maxAcPowerKw,
      maxDcPowerKw: values.maxDcPowerKw === '' ? null : +values.maxDcPowerKw,
    };
    try {
      onSaved(initial?.id ? await vehicleApi.update(initial.id, body) : await vehicleApi.create(body));
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      setErrors(fieldErrors);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      onSubmit={submit} className="card space-y-4 overflow-hidden" noValidate
    >
      <h2 className="text-lg font-semibold">{initial?.id ? 'Edit vehicle' : 'Add a vehicle'}</h2>
      {!initial?.id && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400">Quick fill:</span>
          {PRESETS.map((p) => (
            <button type="button" key={p.model} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-200"
              onClick={() => { setValues((v) => ({ ...v, ...p })); setErrors({}); }}>
              {p.make} {p.model}
            </button>
          ))}
        </div>
      )}
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Make" name="make" placeholder="BYD" value={values.make} onChange={onChange} onBlur={onBlur} error={errors.make} />
        <FormField label="Model" name="model" placeholder="Atto 3" value={values.model} onChange={onChange} onBlur={onBlur} error={errors.model} />
        <FormField label="Year" name="year" type="number" min="2010" max="2030" value={values.year} onChange={onChange} onBlur={onBlur} error={errors.year} />
        <FormField label="Registration no. (optional)" name="licensePlate" placeholder="LEA-1234"
          value={values.licensePlate} onChange={onChange} onBlur={onBlur} error={errors.licensePlate} />
        <FormField label="Battery capacity (kWh)" name="batteryCapacityKwh" type="number" step="0.01"
          value={values.batteryCapacityKwh} onChange={onChange} onBlur={onBlur} error={errors.batteryCapacityKwh} />
        <FormField label="Connector type" name="connectorType" error={errors.connectorType}>
          <select id="connectorType" name="connectorType" className={`input ${errors.connectorType ? 'input-error' : ''}`}
            value={values.connectorType} onChange={onChange} onBlur={onBlur}>
            {CONNECTORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </FormField>
        <div className="sm:col-span-2">
          <span className="label">Extra ports / adapters <span className="font-normal text-slate-500">(optional — multi-connector cars)</span></span>
          <div className="flex flex-wrap gap-2">
            {CONNECTORS.filter((c) => c.value !== values.connectorType).map((c) => {
              const on = values.additionalConnectors.includes(c.value);
              return (
                <button type="button" key={c.value} aria-pressed={on}
                  onClick={() => setValues((v) => ({
                    ...v,
                    additionalConnectors: on ? v.additionalConnectors.filter((x) => x !== c.value) : [...v.additionalConnectors, c.value],
                  }))}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${on ? 'border-brand-400/50 bg-brand-500/15 text-brand-200' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'}`}>
                  {on ? '✓ ' : '+ '}{CONNECTOR_SHORT[c.value]}
                </button>
              );
            })}
          </div>
          {values.connectorType === 'CCS2' && (
            <p className="mt-1.5 text-xs text-slate-500">CCS2 cars can already use Type 2 AC chargers (the top half of the CCS2 inlet is Type 2).</p>
          )}
        </div>
        <FormField label="Max AC charging (kW)" name="maxAcPowerKw" type="number" step="0.1" placeholder="e.g. 7"
          hint="On-board charger limit — optional"
          value={values.maxAcPowerKw} onChange={onChange} onBlur={onBlur} error={errors.maxAcPowerKw} />
        <FormField label="Max DC fast charging (kW)" name="maxDcPowerKw" type="number" step="0.1" placeholder="e.g. 88"
          hint="Leave empty if the car has no DC port"
          value={values.maxDcPowerKw} onChange={onChange} onBlur={onBlur} error={errors.maxDcPowerKw} />
        <FormField label="Full-charge range (km)" name="rangeKm" type="number"
          value={values.rangeKm} onChange={onChange} onBlur={onBlur} error={errors.rangeKm} />
        <div>
          <FormField label={`Current battery: ${values.currentBatteryPercent || 0}%`} name="currentBatteryPercent" error={errors.currentBatteryPercent}>
            <input id="currentBatteryPercent" name="currentBatteryPercent" type="range" min="0" max="100"
              value={values.currentBatteryPercent} onChange={onChange} className="w-full accent-brand-500" />
          </FormField>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="primaryVehicle" checked={values.primaryVehicle} onChange={onChange}
          className="h-4 w-4 rounded border-white/15" />
        Use as my primary vehicle (used for compatibility & cost estimates)
      </label>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save vehicle</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </motion.form>
  );
}

function BatteryBar({ percent }) {
  const color = percent < 20 ? 'from-rose-500 to-red-400' : percent < 50 ? 'from-amber-500 to-yellow-300' : 'from-brand-500 to-cyan-400';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div className={`h-2 rounded-full bg-gradient-to-r ${color} shadow-[0_0_12px_rgba(16,185,129,.6)]`}
        initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | vehicle
  const [error, setError] = useState('');

  const load = () => vehicleApi.list().then(setVehicles).catch((e) => setError(parseError(e).message));
  useEffect(() => { load(); }, []);

  const remove = async (v) => {
    if (!window.confirm(`Remove ${v.make} ${v.model}?`)) return;
    try {
      await vehicleApi.remove(v.id);
      load();
    } catch (e) {
      setError(parseError(e).message);
    }
  };

  const toForm = (v) => ({
    id: v.id, make: v.make, model: v.model, year: String(v.year), batteryCapacityKwh: String(v.batteryCapacityKwh),
    connectorType: v.connectorType, rangeKm: String(v.rangeKm), currentBatteryPercent: String(v.currentBatteryPercent),
    licensePlate: v.licensePlate || '', primaryVehicle: v.primaryVehicle,
    additionalConnectors: v.additionalConnectors || [],
    maxAcPowerKw: v.maxAcPowerKw === null || v.maxAcPowerKw === undefined ? '' : String(v.maxAcPowerKw),
    maxDcPowerKw: v.maxDcPowerKw === null || v.maxDcPowerKw === undefined ? '' : String(v.maxDcPowerKw),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My vehicles</h1>
          <p className="text-sm text-slate-400">Your connector type and battery size decide which chargers fit and what charging will cost.</p>
        </div>
        {!editing && <button className="btn-primary" onClick={() => setEditing('new')}>+ Add vehicle</button>}
      </div>

      <Alert>{error}</Alert>

      <AnimatePresence>
        {editing && (
          <VehicleForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : toForm(editing)}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>

      {vehicles === null ? (
        <div className="flex justify-center py-10 text-brand-400"><Spinner className="h-6 w-6" /></div>
      ) : vehicles.length === 0 && !editing ? (
        <div className="card text-center text-slate-400">No vehicles yet. Add your EV to get started.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((v) => (
            <motion.div layout key={v.id} whileHover={{ y: -3 }} className="card space-y-4 transition-colors hover:border-brand-400/30">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">{v.make} {v.model}</h3>
                  <p className="text-xs text-slate-400">{v.year}{v.licensePlate && ` · ${v.licensePlate}`}</p>
                </div>
                {v.primaryVehicle && (
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-300">Primary</span>
                )}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-xs text-slate-400">Main port</dt><dd className="font-medium">{CONNECTOR_SHORT[v.connectorType]}</dd></div>
                <div><dt className="text-xs text-slate-400">Battery</dt><dd className="font-medium">{v.batteryCapacityKwh} kWh</dd></div>
                <div><dt className="text-xs text-slate-400">Range</dt><dd className="font-medium">{v.rangeKm} km</dd></div>
              </dl>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Compatible chargers</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {v.compatibleConnectors.map((c) => (
                    <span key={c} className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
                      ✓ {CONNECTOR_SHORT[c]}
                      {c === 'TYPE2' && v.connectorType !== 'TYPE2' && !v.additionalConnectors.includes('TYPE2') && <span className="text-emerald-400/70"> (via CCS2)</span>}
                    </span>
                  ))}
                  {CONNECTORS.filter((c) => !v.compatibleConnectors.includes(c.value)).map((c) => (
                    <span key={c.value} className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-slate-500 line-through">{CONNECTOR_SHORT[c.value]}</span>
                  ))}
                </div>
                {(v.maxAcPowerKw || v.maxDcPowerKw) && (
                  <p className="mt-2 text-xs text-slate-400">
                    {v.maxAcPowerKw && <>AC up to <b className="text-slate-200">{Number(v.maxAcPowerKw)} kW</b></>}
                    {v.maxAcPowerKw && v.maxDcPowerKw && ' · '}
                    {v.maxDcPowerKw && <>DC up to <b className="text-slate-200">{Number(v.maxDcPowerKw)} kW</b></>}
                  </p>
                )}
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{v.currentBatteryPercent}% charged</span><span>~{v.estimatedRangeLeftKm} km left</span>
                </div>
                <BatteryBar percent={v.currentBatteryPercent} />
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setEditing(v)}>Edit</button>
                <button className="btn-secondary text-red-400" onClick={() => remove(v)}>Remove</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
