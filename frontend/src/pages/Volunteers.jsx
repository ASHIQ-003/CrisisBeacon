import { useState, useEffect } from 'react';
import { FiUsers, FiMapPin, FiPhone, FiStar, FiSearch } from 'react-icons/fi';
import { fetchVolunteers } from '../services/api';
import toast from 'react-hot-toast';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVolunteers()
      .then(data => setVolunteers(data.volunteers || []))
      .catch(() => toast.error('Failed to load volunteers'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = volunteers.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    (v.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="gradient-bg" style={{ flex: 1, position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Volunteers
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            {volunteers.length} registered volunteer{volunteers.length !== 1 ? 's' : ''} ready to help.
          </p>
        </div>

        {/* Search */}
        <div className="animate-fade-in-up" style={{
          position: 'relative', maxWidth: 420, marginBottom: 24,
          animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards',
        }}>
          <FiSearch size={16} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
          }} />
          <input
            className="form-input"
            placeholder="Search by name or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <FiUsers size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontWeight: 500 }}>No volunteers found</p>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((vol, idx) => (
              <div
                key={vol.id}
                className="glass-card glass-card-hover animate-fade-in-up"
                style={{
                  padding: 22, animationDelay: `${idx * 0.06}s`,
                  opacity: 0, animationFillMode: 'forwards',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 700, color: '#fff',
                    flexShrink: 0,
                  }}>
                    {vol.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{vol.name}</div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 3,
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiPhone size={12} /> {vol.phone}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${vol.availability === 'available' ? 'badge-low' : vol.availability === 'scheduled' ? 'badge-moderate' : 'badge-critical'}`}>
                      {vol.availability}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {(vol.skills || []).map(s => (
                    <span key={s} className="skill-chip active">{s}</span>
                  ))}
                </div>

                {/* Stats */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.78rem', color: 'var(--color-text-muted)',
                  paddingTop: 12, borderTop: '1px solid var(--glass-border)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiStar size={12} /> {vol.tasks_completed || 0} tasks completed
                  </span>
                  {vol.latitude && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiMapPin size={12} /> {vol.latitude.toFixed(2)}, {vol.longitude.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
