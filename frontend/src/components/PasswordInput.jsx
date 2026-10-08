import { useState } from 'react';
import { passwordStrength } from '../utils/validation';

const LEVELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-600'];

export default function PasswordInput({ label, name, value, error, showStrength, ...props }) {
  const [visible, setVisible] = useState(false);
  const score = passwordStrength(value);
  return (
    <div>
      {label && <label htmlFor={name} className="label">{label}</label>}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          className={`input pr-16 ${error ? 'input-error' : ''}`}
          aria-invalid={!!error}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded ${i < score ? COLORS[score] : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Strength: {LEVELS[score]}</p>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
