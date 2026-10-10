import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseError } from '../../api/client';
import { stationApi, vehicleApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import Spinner from '../../components/Spinner';
import FiltersPanel from '../../components/stations/FiltersPanel';
import StationCard from '../../components/stations/StationCard';
import StationDetailDrawer from '../../components/stations/StationDetailDrawer';
import StationMap from '../../components/stations/StationMap';
import { useAuth } from '../../context/AuthContext';
import { AREAS, CATEGORIES, SORTS } from '../../utils/stations';

const DEFAULT_FILTERS = {
  q: '',
  category: null,
  connectors: [],
  minPowerKw: 0,
  maxPrice: 150,
  availableOnly: false,
  openNow: false,
  statuses: [],
  minRating: 0,
  facilities: [],
  sort: 'DISTANCE',
  radiusKm: 25,
};

const VIEWS = [
  { value: 'split', label: 'List + Map' },
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
];

function Icon({ d, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Module 2 — Station Discovery. */
export default function StationsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('Islamabad');
  const [gps, setGps] = useState(null); // [lat, lng]
  const [locating, setLocating] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [view, setView] = useState(() => (window.innerWidth < 1024 ? 'list' : 'split'));
  const [showFilters, setShowFilters] = useState(false);
  const abortRef = useRef(null);
  const wide = useMediaQuery('(min-width: 1280px)');

  const set = useCallback((patch) => setFilters((f) => ({ ...f, ...patch })), []);

  const center = useMemo(() => {
    if (area === 'near') return gps;
    const a = AREAS.find((x) => x.value === area);
    return a?.lat ? [a.lat, a.lng] : null;
  }, [area, gps]);
  const hasRadius = !!center;

  // Drivers: pre-select the primary vehicle's connector so only compatible chargers show.
  useEffect(() => {
    if (user.role !== 'DRIVER') return;
    vehicleApi.list().then((list) => {
      const primary = list.find((v) => v.primaryVehicle);
      if (primary) {
        setVehicle(primary);
        set({ connectors: [primary.connectorType] });
      }
    }).catch(() => {});
  }, [user.role, set]);

  // Ask for the device location once; fall back to Islamabad.
  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Location is not supported by this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps([pos.coords.latitude, pos.coords.longitude]);
        setArea('near');
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Could not get your location. Allow location access or choose a city.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  // Try the device location once, silently; Islamabad stays the default if it is refused.
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setGps([pos.coords.latitude, pos.coords.longitude]); setArea('near'); },
      () => {},
      { timeout: 6000, maximumAge: 300000 },
    );
  }, []);

  // Debounce free-text search.
  useEffect(() => {
    const t = setTimeout(() => set({ q: query }), 350);
    return () => clearTimeout(t);
  }, [query, set]);

  // Search whenever filters / area change.
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    const t = setTimeout(() => {
      stationApi.search({
        q: filters.q.trim(),
        lat: center?.[0],
        lng: center?.[1],
        radiusKm: hasRadius ? filters.radiusKm : undefined,
        category: filters.category,
        connectors: filters.connectors,
        minPowerKw: filters.minPowerKw || undefined,
        maxPrice: filters.maxPrice < 150 ? filters.maxPrice : undefined,
        availableOnly: filters.availableOnly,
        openNow: filters.openNow,
        statuses: filters.statuses,
        minRating: filters.minRating || undefined,
        facilities: filters.facilities,
        sort: !hasRadius && filters.sort === 'DISTANCE' ? 'RATING' : filters.sort,
      }, controller.signal)
        .then((res) => {
          setData(res);
          setError('');
          setLoading(false);
        })
        .catch((e) => {
          if (e.name === 'CanceledError') return;
          setError(parseError(e).message);
          setLoading(false);
        });
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [filters, center, hasRadius]);

  const results = useMemo(() => data?.results || [], [data]);

  const onSelect = useCallback((s) => setSelected(s), []);
  const onDetails = useCallback((s) => setDetailId(s.id), []);

  const activeCount =
    filters.connectors.length + filters.statuses.length + filters.facilities.length
    + (filters.availableOnly ? 1 : 0) + (filters.openNow ? 1 : 0) + (filters.minPowerKw ? 1 : 0)
    + (filters.maxPrice < 150 ? 1 : 0) + (filters.minRating ? 1 : 0);

  const reset = () => {
    setFilters({ ...DEFAULT_FILTERS, q: filters.q });
  };

  const sortOptions = hasRadius ? SORTS : SORTS.filter((s) => s.value !== 'DISTANCE');
  const effectiveSort = !hasRadius && filters.sort === 'DISTANCE' ? 'RATING' : filters.sort;

  const list = (
    <div className="space-y-3">
      {loading && !data && <div className="flex justify-center py-16 text-brand-400"><Spinner className="h-6 w-6" /></div>}
      {data && results.length === 0 && (
        <div className="card py-12 text-center">
          <p className="text-lg font-semibold text-white">No chargers match</p>
          <p className="mt-1 text-sm text-slate-400">Try a bigger radius or fewer filters.</p>
          <div className="mt-4 flex justify-center gap-2">
            {hasRadius && filters.radiusKm < 100 && (
              <button className="btn-secondary" onClick={() => set({ radiusKm: Math.min(100, filters.radiusKm * 2) })}>Search {Math.min(100, filters.radiusKm * 2)} km</button>
            )}
            {activeCount > 0 && <button className="btn-secondary" onClick={reset}>Clear filters</button>}
          </div>
        </div>
      )}
      {results.map((s) => (
        <StationCard key={s.id} station={s} selected={selected?.id === s.id} onSelect={onSelect} onDetails={onDetails} />
      ))}
    </div>
  );

  const map = (heightClass) => (
    <StationMap
      stations={results}
      center={center}
      radiusKm={hasRadius ? filters.radiusKm : null}
      selected={selected}
      onSelect={setSelected}
      onDetails={onDetails}
      className={heightClass}
    />
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Find chargers</h1>
          <p className="mt-1 text-sm text-slate-400">Public stations, business chargers and home chargers — all in one place.</p>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
          {VIEWS.map((v) => (
            <button key={v.value} onClick={() => setView(v.value)}
              className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition ${v.value === 'split' ? 'hidden lg:block' : ''} ${view === v.value ? 'text-ink-950' : 'text-slate-300 hover:text-white'}`}>
              {view === v.value && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-400 to-cyan-400" />}
              <span className="relative">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="card flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icon d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input border-transparent bg-transparent pl-10 hover:border-transparent" placeholder="Search by station name, area or city…"
            value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search stations" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={locate} disabled={locating}
            className={`btn-secondary ${area === 'near' ? 'border-brand-400/50 text-brand-200' : ''}`}>
            {locating ? <Spinner /> : <Icon d="M12 2v3M12 19v3M2 12h3M19 12h3M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />}
            Near me
          </button>
          <select className="input w-auto py-2" value={area === 'near' ? 'near' : area} aria-label="Area"
            onChange={(e) => (e.target.value === 'near' ? locate() : setArea(e.target.value))}>
            {AREAS.filter((a) => a.value !== 'near' || gps).map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          {hasRadius && (
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <span className="whitespace-nowrap">Within <b className="text-white">{filters.radiusKm} km</b></span>
              <input type="range" min="2" max="100" step="1" value={filters.radiusKm} aria-label="Search radius"
                onChange={(e) => set({ radiusKm: Number(e.target.value) })} className="w-24 accent-brand-500" />
            </label>
          )}
        </div>
      </div>

      {/* Category buttons + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CATEGORIES.map((c) => {
            const active = filters.category === c.value;
            return (
              <button key={c.label} onClick={() => set({ category: c.value })}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                  active ? 'border-brand-400/50 bg-brand-500/15 text-brand-200 shadow-glow' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                }`}>
                <Icon d={c.icon} /> {c.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary lg:hidden" onClick={() => setShowFilters(true)}>
            <Icon d="M3 6h18M7 12h10M10 18h4" /> Filters {activeCount > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-xs text-ink-950">{activeCount}</span>}
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            Sort
            <select className="input w-auto py-2" value={effectiveSort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort results">
              {sortOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {data ? <><b className="text-white">{data.total}</b> {data.total === 1 ? 'station' : 'stations'} found</> : 'Searching…'}
          {data && hasRadius && <> within {filters.radiusKm} km of {area === 'near' ? 'you' : area}</>}
        </span>
        {loading && data && <Spinner className="h-4 w-4 text-brand-400" />}
      </div>

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            <FiltersPanel filters={filters} set={set} vehicle={vehicle} onReset={reset} />
          </div>
        </aside>

        <div className="min-w-0">
          {view === 'split' && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {/* one map only: Leaflet breaks on a display:none container */}
              {!wide && map('h-[420px]')}
              <div className="min-w-0">{list}</div>
              {wide && <div><div className="sticky top-24">{map('h-[calc(100vh-8rem)]')}</div></div>}
            </div>
          )}
          {view === 'list' && list}
          {view === 'map' && map('h-[calc(100vh-14rem)] min-h-[460px]')}
        </div>
      </div>

      {/* Mobile filters sheet (portal: see StationDetailDrawer) */}
      {createPortal(<AnimatePresence>
        {showFilters && (
          <>
            <motion.div className="fixed inset-0 z-[1000] bg-ink-950/70 backdrop-blur-sm lg:hidden" onClick={() => setShowFilters(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="fixed inset-x-0 bottom-0 z-[1001] max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-900 p-4 lg:hidden"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
              <FiltersPanel filters={filters} set={set} vehicle={vehicle} onReset={reset} />
              <button className="btn-primary mt-4 w-full" onClick={() => setShowFilters(false)}>
                Show {data?.total ?? ''} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}

      <StationDetailDrawer stationId={detailId} origin={center} onClose={() => setDetailId(null)} />
    </div>
  );
}
