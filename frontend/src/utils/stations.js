// Labels, colours and helpers for Station Discovery (Module 2).

export const CATEGORIES = [
  { value: null, label: 'All', icon: 'M4 6h16M4 12h16M4 18h16' },
  { value: 'PUBLIC', label: 'Public stations', icon: 'M13 2 3 14h7l-1 8 10-12h-7l1-8z' },
  { value: 'BUSINESS', label: 'Cafés & businesses', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6' },
  { value: 'HOME', label: 'Home chargers', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
];

export const CATEGORY_LABEL = { PUBLIC: 'Public', BUSINESS: 'Business', HOME: 'Home charger' };

export const CONNECTORS = [
  { value: 'CCS2', label: 'CCS2', hint: 'DC fast' },
  { value: 'CHADEMO', label: 'CHAdeMO', hint: 'DC fast' },
  { value: 'TYPE2', label: 'Type 2', hint: 'AC' },
];
export const CONNECTOR_LABEL = { CCS2: 'CCS2', CHADEMO: 'CHAdeMO', TYPE2: 'Type 2' };

export const FACILITIES = [
  { value: 'WIFI', label: 'Wi-Fi' },
  { value: 'CAFE', label: 'Café' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'RESTROOM', label: 'Restroom' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'WAITING_LOUNGE', label: 'Lounge' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'PRAYER_AREA', label: 'Prayer area' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'WHEELCHAIR_ACCESS', label: 'Wheelchair access' },
];
export const FACILITY_LABEL = Object.fromEntries(FACILITIES.map((f) => [f.value, f.label]));

export const STATUSES = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OFFLINE', label: 'Offline' },
];

export const SORTS = [
  { value: 'DISTANCE', label: 'Nearest' },
  { value: 'PRICE', label: 'Cheapest' },
  { value: 'RATING', label: 'Top rated' },
  { value: 'POWER', label: 'Fastest' },
  { value: 'AVAILABILITY', label: 'Most available' },
];

/** Search "areas": GPS, a city centre, or the whole country (no radius). */
export const AREAS = [
  { value: 'near', label: 'Near me' },
  { value: 'Islamabad', label: 'Islamabad', lat: 33.6938, lng: 73.0652 },
  { value: 'Rawalpindi', label: 'Rawalpindi', lat: 33.5973, lng: 73.0479 },
  { value: 'Lahore', label: 'Lahore', lat: 31.5204, lng: 74.3587 },
  { value: 'Karachi', label: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { value: 'all', label: 'All Pakistan' },
];
export const PAKISTAN_CENTER = [30.3753, 69.3451];

export const AVAILABILITY = {
  AVAILABLE: { label: 'Available', color: '#10b981', badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' },
  BUSY: { label: 'All busy', color: '#f59e0b', badge: 'bg-amber-500/15 text-amber-300 ring-amber-400/25' },
  CLOSED: { label: 'Closed now', color: '#64748b', badge: 'bg-slate-500/15 text-slate-300 ring-slate-400/25' },
  UNAVAILABLE: { label: 'Unavailable', color: '#ef4444', badge: 'bg-red-500/15 text-red-300 ring-red-400/25' },
};

export const CHARGER_STATUS = {
  AVAILABLE: { label: 'Available', cls: 'text-emerald-300' },
  OCCUPIED: { label: 'In use', cls: 'text-amber-300' },
  OUT_OF_SERVICE: { label: 'Out of service', cls: 'text-red-300' },
};

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (h === 23 && m === 59) return '12:00 AM';
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ampm}`;
};

export function hoursLabel(s) {
  if (s.open24Hours) return 'Open 24 hours';
  if (!s.opensAt || !s.closesAt) return 'Hours not listed';
  return `${fmtTime(s.opensAt)} – ${fmtTime(s.closesAt)}`;
}

export function distanceLabel(km) {
  if (km === null || km === undefined) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function directionsUrl(s) {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`;
}

export const formatPkr = (v) => `Rs ${Number(v).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
