// Input Validation Rules — mirrors backend com.evplatform.common.ValidationRules. Keep both in sync.

export const PATTERNS = {
  name: /^[A-Za-z][A-Za-z .'-]{2,59}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/,
  phone: /^(\+92|0)3\d{9}$/,
  otp: /^\d{6}$/,
  plate: /^[A-Za-z]{2,4}-?([A-Za-z]{1,2}-?)?\d{1,4}$/,
};

const required = (v) => (v === undefined || v === null || String(v).trim() === '');

export const rules = {
  fullName: (v) => required(v) ? 'Full name is required'
    : !PATTERNS.name.test(v.trim()) ? "Name must be 3-60 letters (spaces, . ' - allowed)" : null,
  email: (v) => required(v) ? 'Email is required'
    : !PATTERNS.email.test(v.trim()) || v.length > 100 ? 'Enter a valid email address' : null,
  password: (v) => required(v) ? 'Password is required'
    : !PATTERNS.password.test(v) ? 'Use 8-64 characters with uppercase, lowercase, number and special character' : null,
  loginPassword: (v) => required(v) ? 'Password is required' : null,
  phone: (v) => required(v) ? 'Phone number is required'
    : !PATTERNS.phone.test(v.trim()) ? 'Enter a Pakistani mobile number: 03XXXXXXXXX or +923XXXXXXXXX' : null,
  otp: (v) => required(v) ? 'Code is required' : !PATTERNS.otp.test(v.trim()) ? 'Code must be 6 digits' : null,
  role: (v) => (v === 'DRIVER' || v === 'STATION_OWNER') ? null : 'Select an account type',
  confirm: (field) => (v, values) => required(v) ? 'Please confirm the password'
    : v !== values[field] ? 'Passwords do not match' : null,

  // Vehicle
  make: (v) => required(v) ? 'Make is required' : v.trim().length < 2 || v.length > 40 ? 'Make must be 2-40 characters' : null,
  model: (v) => required(v) ? 'Model is required' : v.length > 40 ? 'Model must be at most 40 characters' : null,
  year: (v) => required(v) ? 'Year is required' : !Number.isInteger(+v) || +v < 2010 || +v > 2030 ? 'Year must be 2010-2030' : null,
  batteryCapacityKwh: (v) => required(v) ? 'Battery capacity is required'
    : Number.isNaN(+v) || +v < 10 || +v > 250 ? 'Battery capacity must be 10-250 kWh'
      : !/^\d{1,3}(\.\d{1,2})?$/.test(String(v)) ? 'At most 2 decimals' : null,
  connectorType: (v) => ['CCS2', 'CHADEMO', 'TYPE2'].includes(v) ? null : 'Select a connector type',
  rangeKm: (v) => required(v) ? 'Range is required' : !Number.isInteger(+v) || +v < 50 || +v > 1200 ? 'Range must be 50-1200 km' : null,
  currentBatteryPercent: (v) => required(v) ? 'Battery level is required'
    : !Number.isInteger(+v) || +v < 0 || +v > 100 ? 'Battery level must be 0-100%' : null,
  maxAcPowerKw: (v) => required(v) ? null : Number.isNaN(+v) || +v < 2 || +v > 50 ? 'Max AC power must be 2-50 kW' : null,
  maxDcPowerKw: (v) => required(v) ? null : Number.isNaN(+v) || +v < 10 || +v > 400 ? 'Max DC power must be 10-400 kW' : null,
  licensePlate: (v) => required(v) ? null : !PATTERNS.plate.test(v.trim()) ? 'Registration number must look like ABC-123' : null,
};

/** Runs a { field: ruleFn } schema over values; returns { field: message } for failures. */
export function validate(values, schema) {
  const errors = {};
  for (const [field, rule] of Object.entries(schema)) {
    const msg = rule(values[field], values);
    if (msg) errors[field] = msg;
  }
  return errors;
}

/** 0-4 strength score for the password meter. */
export function passwordStrength(pw = '') {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
