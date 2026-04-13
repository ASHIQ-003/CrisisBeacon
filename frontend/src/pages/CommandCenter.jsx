import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCrises, fetchStaff, fetchAnalytics } from '../services/api';
import CrisisCard from '../components/CrisisCard';
import StatCard from '../components/StatCard';
import VenueMap from '../components/VenueMap';
import { FiAlertTriangle, FiActivity, FiCheckCircle, FiUsers, FiClock, FiShield, FiLink } from 'react-icons/fi';

export default function CommandCenter({ refreshKey }) {
  const navigate = useNavigate();
  const [crises, setCrises] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    try {
      const [crisesData, staffData, statsData] = await Promise.all([
        fetchCrises(), fetchStaff(), fetchAnalytics(),
      ]);
      setCrises(crisesData.crises || []);
      setStaff(staffData.staff || []);
      setStats(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Poll every 3 seconds — needed on Vercel serverless where Socket.io doesn't persist
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const filtered = filter === 'all' ? crises
    : filter === 'active' ? crises.filter(c => ['reported', 'assigned', 'acknowledged', 'responding'].includes(c.status))
    : filter === 'resolved' ? crises.filter(c => c.status === 'resolved')
    : crises.filter(c => c.severity === filter);

  const activeCrises = crises.filter(c => ['reported', 'assigned', 'acknowledged', 'responding'].includes(c.status));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            🖥️ Command Center
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s ease-in-out infinite' }} />
            Live · refreshes every 3s
            {lastUpdated && <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>· last updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowIntegrations(true)}>🔌 Integrations</button>
          <button className="btn btn-ghost btn-sm" onClick={load}>⟳ Refresh</button>
          <button className="btn btn-danger" onClick={() => navigate('/sos')} style={{ fontSize: '0.82rem' }}>
            <FiAlertTriangle size={14} /> Report Crisis
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon={<FiAlertTriangle />} value={stats.active || 0} label="Active Crises" color="var(--accent-red)" />
        <StatCard icon={<FiActivity />} value={stats.critical || 0} label="Critical" color="var(--accent-amber)" />
        <StatCard icon={<FiCheckCircle />} value={stats.resolved || 0} label="Resolved" color="var(--accent-green)" />
        <StatCard icon={<FiUsers />} value={`${stats.staff_available || 0}/${stats.staff_total || 0}`} label="Staff Available" color="var(--accent-blue)" />
        <StatCard icon={<FiClock />} value={stats.avg_response_time_sec ? `${stats.avg_response_time_sec}s` : '—'} label="Avg Response" color="var(--accent-purple)" />
        <StatCard icon={<FiShield />} value={stats.total || 0} label="Total Incidents" color="var(--accent-cyan)" />
      </div>

      {/* Main Content: Crisis Feed + Venue Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Crisis Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {['all', 'active', 'critical', 'high', 'medium', 'low', 'resolved'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-danger' : 'btn-ghost'}`}>
                {f === 'all' ? `All (${crises.length})` : f === 'active' ? `Active (${activeCrises.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛡️</div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>All clear</div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 4 }}>No crises match this filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((crisis, i) => (
                <CrisisCard key={crisis.id} crisis={crisis} delay={i} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Venue Map */}
        <div>
          <VenueMap crises={activeCrises} staff={staff} onCrisisClick={(c) => navigate(`/crisis/${c.id}`)} />

          {/* Recent Timeline */}
          <div className="glass anim-up" style={{ padding: 18, marginTop: 14 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 12 }}>⏱️ Recent Activity</h3>
            {crises.slice(0, 5).map(crisis => (
              <div key={crisis.id} style={{
                display: 'flex', gap: 10, padding: '8px 0',
                borderBottom: '1px solid rgba(75,85,99,0.15)',
                cursor: 'pointer',
              }} onClick={() => navigate(`/crisis/${crisis.id}`)}>
                <div className={`timeline-dot ${crisis.severity === 'critical' ? 'timeline-dot-critical' : crisis.status === 'resolved' ? 'timeline-dot-success' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    {crisis.type?.replace(/_/g, ' ')} — {crisis.floor}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 1 }}>
                    {crisis.status} · {new Date(crisis.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {crises.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: 16 }}>
                No activity yet. Report a crisis to get started.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Integrations Modal */}
      {showIntegrations && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass anim-up" style={{ padding: 28, width: '100%', maxWidth: 450, position: 'relative', textAlign: 'left' }}>
            <button onClick={() => setShowIntegrations(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔌 PMS Integrations
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 20 }}>
              Webhook connections to external Property Management Systems.
            </p>
            
            <div style={{ border: '1px solid rgba(75,85,99,0.3)', borderRadius: 10, padding: 14, marginBottom: 12, background: 'rgba(34,197,94,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: '0.9rem' }}>Alice (Hotel Operations)</strong>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: 12, fontWeight: 700 }}>ACTIVE</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-creates support tickets on severity: Medium+</div>
            </div>

            <div style={{ border: '1px solid rgba(75,85,99,0.3)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: '0.9rem' }}>Amadeus HotSOS</strong>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(75,85,99,0.3)', color: 'var(--text-dim)', borderRadius: 12, fontWeight: 700 }}>PAUSED</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Syncs maintenance requests</div>
            </div>

            <div style={{ border: '1px solid rgba(75,85,99,0.3)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: '0.9rem' }}>Oracle OPERA PMS</strong>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(75,85,99,0.3)', color: 'var(--text-dim)', borderRadius: 12, fontWeight: 700 }}>DISCONNECTED</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Syncs guest room assignments</div>
            </div>
            
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 20, fontSize: '0.8rem', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>+ Add Webhook Endpoint</button>
          </div>
        </div>
      )}

      {/* Responsive override */}
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
