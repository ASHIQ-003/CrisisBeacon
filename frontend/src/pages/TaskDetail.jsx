import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiUsers, FiCalendar, FiExternalLink } from 'react-icons/fi';
import UrgencyBadge from '../components/UrgencyBadge';
import MatchList from '../components/MatchList';
import { fetchNeedById, assignVolunteer } from '../services/api';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [need, setNeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchNeedById(id)
      .then(data => {
        setNeed(data.need);
        setMatches(data.matches || []);
      })
      .catch(() => toast.error('Need not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAssign(volunteerId) {
    setAssigning(true);
    try {
      const result = await assignVolunteer(id, volunteerId);
      toast.success(result.volunteer_notified
        ? 'Volunteer assigned & notified via WhatsApp!'
        : 'Volunteer assigned! (WhatsApp not configured)'
      );
      // Refresh data
      const data = await fetchNeedById(id);
      setNeed(data.need);
      setMatches(data.matches || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!need) {
    return (
      <div className="gradient-bg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Need not found</p>
          <button className="btn-secondary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const mapsUrl = need.latitude
    ? `https://maps.google.com/?q=${need.latitude},${need.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(need.location_name)}`;

  return (
    <div className="gradient-bg" style={{ flex: 1, position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        {/* Back */}
        <button
          className="btn-secondary animate-fade-in"
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 24, padding: '8px 16px' }}
        >
          <FiArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left — Need Details */}
          <div>
            <div className="glass-card animate-fade-in-up" style={{ padding: 28, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', maxWidth: '70%' }}>
                  {need.need_type}
                </h1>
                <UrgencyBadge urgency={need.urgency} />
              </div>

              {need.description && (
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                  {need.description}
                </p>
              )}

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
                fontSize: '0.85rem', color: 'var(--color-text-muted)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiMapPin size={15} color="var(--color-primary-light)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{need.location_name}</div>
                  </div>
                </div>
                {need.families_affected > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiUsers size={15} color="var(--color-accent)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Families</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{need.families_affected}</div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCalendar size={15} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reported</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{need.reported_date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 15, height: 15, borderRadius: '50%',
                    background: need.status === 'assigned' ? 'var(--color-accent)' : 'var(--color-primary)',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>{need.status}</div>
                  </div>
                </div>
              </div>

              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="btn-secondary"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  marginTop: 20, padding: '10px 0', width: '100%', textDecoration: 'none',
                }}>
                <FiExternalLink size={15} /> Open in Google Maps
              </a>
            </div>
          </div>

          {/* Right — Volunteer Matches */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>
              🤝 Top Volunteer Matches
            </h2>
            {need.status === 'assigned' ? (
              <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'rgba(6, 214, 160, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  ✅
                </div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Volunteer Assigned</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  This task has already been assigned.
                </p>
              </div>
            ) : (
              <MatchList
                matches={matches}
                onAssign={handleAssign}
                assigning={assigning}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1.2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
