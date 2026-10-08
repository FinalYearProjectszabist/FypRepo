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
  { make: 'BYD', model: 'Atto 3', batteryCapacityKwh: '60.48', connectorType: 'CCS2', rangeKm: '420' },
  { make: 'MG', model: 'ZS EV', batteryCapacityKwh: '51', connectorType: 'CCS2', rangeKm: '320' },
  { make: 'Hyundai', model: 'Ioniq 5', batteryCapacityKwh: '72.6', connectorType: 'CCS2', rangeKm: '480' },
  { make: 'Nissan', model: 'Leaf', batteryCapacityKwh: '40', connectorType: 'CHADEMO', rangeKm: '270' },
  { make: 'Honeta', model: 'Seagull', batteryCapacityKwh: '30.08', connectorType: 'TYPE2', rangeKm: '305' },
];

const EMPTY = {
  make: '', model: '', year: String(new Date().getFullYear()), batteryCapacityKwh: '', connectorType: 'CCS2',
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
          <span className="text-xs text-slate-500">Quick fill:</span>
          {PRESETS.map((p) => (
            <button type="button" key={p.model} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-100"
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
        <FormField label="Full-charge range (km)" name="rangeKm" type="number"
          value={values.rangeKm} onChange={onChange} onBlur={onBlur} error={errors.rangeKm} />
        <div>
          <FormField label={`Current battery: ${values.currentBatteryPercent || 0}%`} name="currentBatteryPercent" error={errors.currentBatteryPercent}>
            <input id="currentBatteryPercent" name="currentBatteryPercent" type="range" min="0" max="100"
              value={values.currentBatteryPercent} onChange={onChange} className="w-full accent-brand-600" />
          </FormField>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="primaryVehicle" checked={values.primaryVehicle} onChange={onChange}
          className="h-4 w-4 rounded border-slate-300" />
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
  const color = percent < 20 ? 'bg-red-500' : percent < 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="h-2 w-full rounded bg-slate-200">
      <motion.div className={`h-2 rounded ${color}`} initial={{ width: 0 }} animate={{ width: `${percent}%` }} />
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
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My vehicles</h1>
          <p className="text-sm text-slate-500">Your connector type and battery size decide which chargers fit and what charging will cost.</p>
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
        <div className="flex justify-center py-10 text-brand-600"><Spinner className="h-6 w-6" /></div>
      ) : vehicles.length === 0 && !editing ? (
        <div className="card text-center text-slate-500">No vehicles yet. Add your EV to get started.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((v) => (
            <motion.div layout key={v.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{v.make} {v.model}</h3>
                  <p className="text-xs text-slate-500">{v.year}{v.licensePlate && ` · ${v.licensePlate}`}</p>
                </div>
                {v.primaryVehicle && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Primary</span>
                )}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-xs text-slate-500">Connector</dt><dd className="font-medium">{v.connectorType}</dd></div>
                <div><dt className="text-xs text-slate-500">Battery</dt><dd className="font-medium">{v.batteryCapacityKwh} kWh</dd></div>
                <div><dt className="text-xs text-slate-500">Range</dt><dd className="font-medium">{v.rangeKm} km</dd></div>
              </dl>
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{v.currentBatteryPercent}% charged</span><span>~{v.estimatedRangeLeftKm} km left</span>
                </div>
                <BatteryBar percent={v.currentBatteryPercent} />
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setEditing(v)}>Edit</button>
                <button className="btn-secondary text-red-600" onClick={() => remove(v)}>Remove</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
