import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { AVAILABILITY, distanceLabel, formatPkr, PAKISTAN_CENTER } from '../../utils/stations';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

/** Pin coloured by availability, showing the number of free chargers. */
function stationIcon(s, selected) {
  const color = AVAILABILITY[s.availability].color;
  const size = selected ? 44 : 34;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `
      <div class="ev-pin ${selected ? 'ev-pin--selected' : ''}" style="--pin:${color};width:${size}px;height:${size}px">
        <svg viewBox="0 0 24 24"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>
        <span>${s.availableChargers}</span>
      </div>`,
  });
}

const userIcon = L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="ev-me"></div>' });

/** Fits the map to the results whenever they change (unless the user picked a station). */
function FitToResults({ stations, center, radiusKm }) {
  const map = useMap();
  const key = stations.map((s) => s.id).join(',');
  useEffect(() => {
    if (!map.getSize().x) return;
    if (stations.length) {
      const bounds = L.latLngBounds(stations.map((s) => [s.latitude, s.longitude]));
      if (center) bounds.extend(center);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
    } else if (center) {
      map.setView(center, radiusKm ? Math.max(9, 14 - Math.log2(radiusKm)) : 11, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, center?.[0], center?.[1]]);
  return null;
}

function FlyToSelected({ selected, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!selected || !map.getSize().x) return;
    map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 14), { duration: 0.6 });
    const m = markers.current[selected.id];
    if (m) setTimeout(() => m.openPopup(), 650);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);
  return null;
}

/** Keeps Leaflet sized correctly when the container changes (view toggle, drawer). */
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export default function StationMap({ stations, center, radiusKm, selected, onSelect, onDetails, className = '' }) {
  const markers = useRef({});
  const icons = useMemo(
    () => Object.fromEntries(stations.map((s) => [s.id, stationIcon(s, selected?.id === s.id)])),
    [stations, selected?.id],
  );

  return (
    <div className={`relative isolate overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      <MapContainer center={center || PAKISTAN_CENTER} zoom={center ? 12 : 6} className="h-full w-full" zoomControl={false}
        scrollWheelZoom worldCopyJump>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={19} />
        <InvalidateOnResize />
        <FitToResults stations={stations} center={center} radiusKm={radiusKm} />
        <FlyToSelected selected={selected} markers={markers} />

        {center && radiusKm && (
          <Circle center={center} radius={radiusKm * 1000}
            pathOptions={{ color: '#10b981', weight: 1, opacity: 0.5, fillColor: '#10b981', fillOpacity: 0.04, dashArray: '4 6' }} />
        )}
        {center && <Marker position={center} icon={userIcon} interactive={false} />}

        {stations.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={icons[s.id]}
            zIndexOffset={selected?.id === s.id ? 1000 : 0}
            ref={(m) => { if (m) markers.current[s.id] = m; }}
            eventHandlers={{ click: () => onSelect(s) }}
          >
            <Popup>
              <div className="w-56">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: AVAILABILITY[s.availability].color }}>
                  {AVAILABILITY[s.availability].label} · {s.availableChargers}/{s.totalChargers} free
                </p>
                <p className="mt-1 font-semibold text-white">{s.name}</p>
                <p className="text-xs text-slate-400">{s.address}</p>
                <p className="mt-2 text-xs text-slate-300">
                  ★ {Number(s.rating).toFixed(1)} · {Number(s.maxPowerKw)} kW · {formatPkr(s.minPricePerKwh)}/kWh
                  {s.distanceKm !== null && <> · {distanceLabel(s.distanceKm)}</>}
                </p>
                <button type="button" onClick={() => onDetails(s)}
                  className="mt-3 w-full rounded-lg bg-gradient-to-r from-brand-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-ink-950">
                  View details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap gap-3 rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
        {Object.entries(AVAILABILITY).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: v.color }} />{v.label}</span>
        ))}
      </div>
    </div>
  );
}
