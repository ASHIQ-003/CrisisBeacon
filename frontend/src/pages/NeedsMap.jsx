import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiNavigation, FiAlertCircle } from 'react-icons/fi';
import UrgencyBadge from '../components/UrgencyBadge';
import { fetchNeeds } from '../services/api';
import toast from 'react-hot-toast';

const MAP_CONTAINER = { width: '100%', height: 'calc(100vh - 64px)' };
const CHENNAI_CENTER = { lat: 13.0827, lng: 80.2707 };

// Color-coded markers by urgency
const MARKER_COLORS = {
  1: '#ef4444', // Critical → red
  2: '#f59e0b', // Moderate → amber
  3: '#22c55e', // Low → green
};

function createMarkerIcon(urgency) {
  const color = MARKER_COLORS[urgency] || '#6366f1';
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 2,
    scale: 1.8,
    anchor: { x: 12, y: 22 },
  };
}

export default function NeedsMap() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [mapCenter, setMapCenter] = useState(CHENNAI_CENTER);
  const [showFilter, setShowFilter] = useState(false);

  // Try loading Google Maps — fall back gracefully if no API key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  });

  useEffect(() => {
    fetchNeeds().then(data => {
      setNeeds(data.needs || []);
      // Center map on first need if available
      if (data.needs?.length > 0 && data.needs[0].latitude) {
        setMapCenter({ lat: data.needs[0].latitude, lng: data.needs[0].longitude });
      }
    }).catch(() => toast.error('Failed to load needs'));
  }, []);

  const filtered = filterUrgency === 'all'
    ? needs
    : needs.filter(n => n.urgency === Number(filterUrgency));

  const handleMyLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast.error('Could not get your location'),
      );
    }
  }, []);

  // If no API key or load error, show a beautiful fallback list view
  if (loadError || (!isLoaded && !import.meta.env.VITE_GOOGLE_MAPS_KEY)) {
    return (
      <div className="gradient-bg" style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
          <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
              Live Needs Map
            </h1>
            <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <FiAlertCircle size={20} color="var(--color-warning)" />
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Google Maps API key not configured</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Add <code style={{ background: 'var(--color-surface-3)', padding: '2px 6px', borderRadius: 4 }}>VITE_GOOGLE_MAPS_KEY</code> to your <code style={{ background: 'var(--color-surface-3)', padding: '2px 6px', borderRadius: 4 }}>.env</code> file. Showing list view instead.
                </p>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['all', '1', '2', '3'].map(f => (
              <button
                key={f}
                className={filterUrgency === f ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setFilterUrgency(f)}
                style={{ padding: '7px 16px', fontSize: '0.8rem' }}
              >
                {f === 'all' ? 'All' : f === '1' ? '🔴 Critical' : f === '2' ? '🟡 Moderate' : '🟢 Low'}
              </button>
            ))}
          </div>

          {/* List view fallback */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map((need, idx) => (
              <div
                key={need.id}
                className="glass-card glass-card-hover animate-fade-in-up"
                style={{
                  padding: 22, cursor: 'pointer',
                  animationDelay: `${idx * 0.07}s`, opacity: 0, animationFillMode: 'forwards',
                }}
                onClick={() => navigate(`/needs/${need.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{need.need_type}</h3>
                  <UrgencyBadge urgency={need.urgency} />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>{need.description}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  📍 {need.location_name}
                  {need.latitude && (
                    <a
                      href={`https://maps.google.com/?q=${need.latitude},${need.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ color: 'var(--color-primary-light)', marginLeft: 8, textDecoration: 'underline' }}
                    >
                      Open in Maps ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap mapContainerStyle={MAP_CONTAINER} center={mapCenter} zoom={12}
        options={{
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#1a1d2e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1117' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252940' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0e18' }] },
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {filtered.map(need => need.latitude && (
          <MarkerF
            key={need.id}
            position={{ lat: need.latitude, lng: need.longitude }}
            icon={createMarkerIcon(need.urgency)}
            onClick={() => setSelected(need)}
          />
        ))}

        {selected && (
          <InfoWindowF
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ padding: 8, maxWidth: 260, color: '#1a1d2e' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{selected.need_type}</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 8 }}>{selected.description}</p>
              <p style={{ fontSize: '0.8rem', marginBottom: 4 }}>📍 {selected.location_name}</p>
              {selected.families_affected > 0 && (
                <p style={{ fontSize: '0.8rem', marginBottom: 10 }}>👨‍👩‍👧 {selected.families_affected} families</p>
              )}
              <button
                onClick={() => navigate(`/needs/${selected.id}`)}
                style={{
                  width: '100%', padding: '8px 0',
                  background: '#6366f1', color: '#fff', border: 'none',
                  borderRadius: 6, fontWeight: 600, cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {selected.status === 'open' ? 'View & Match Volunteer' : 'View Details'}
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Floating Controls */}
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button className="glass-card btn-secondary" onClick={() => setShowFilter(!showFilter)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px' }}>
          <FiFilter size={15} /> Filter
        </button>

        {showFilter && (
          <div className="glass-card animate-fade-in" style={{ padding: 14 }}>
            {['all', '1', '2', '3'].map(f => (
              <button
                key={f}
                className={filterUrgency === f ? 'btn-primary' : 'btn-secondary'}
                onClick={() => { setFilterUrgency(f); setShowFilter(false); }}
                style={{ display: 'block', width: '100%', marginBottom: 6, padding: '7px 14px', fontSize: '0.8rem' }}
              >
                {f === 'all' ? 'All Urgencies' : f === '1' ? '🔴 Critical' : f === '2' ? '🟡 Moderate' : '🟢 Low'}
              </button>
            ))}
          </div>
        )}

        <button className="glass-card btn-secondary" onClick={handleMyLocation}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px' }}>
          <FiNavigation size={15} /> My Location
        </button>
      </div>

      {/* Legend */}
      <div className="glass-card" style={{
        position: 'absolute', bottom: 20, right: 16, zIndex: 10,
        padding: '12px 16px', fontSize: '0.78rem',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <span style={{ fontWeight: 600, marginBottom: 2, fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend</span>
        {[{ c: '#ef4444', l: 'Critical' }, { c: '#f59e0b', l: 'Moderate' }, { c: '#22c55e', l: 'Low' }].map(x => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: x.c }} />
            <span>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
