import { useNavigate } from 'react-router-dom';
import SeverityBadge, { StatusBadge } from './SeverityBadge';
import { FiMapPin, FiClock, FiUser } from 'react-icons/fi';

const TYPE_ICONS = { fire: '🔥', medical: '🏥', security: '🔒', gas_leak: '⛽', flood: '🌊', power_outage: '⚡', elevator: '🛗', structural: '🏗️', explosion: '💥', active_threat: '⚠️', noise: '🔊', suspicious: '👁️', other: '📋' };

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function CrisisCard({ crisis, delay = 0 }) {
  const navigate = useNavigate();
  const isActive = ['reported', 'assigned', 'acknowledged', 'responding'].includes(crisis.status);

  return (
    <div
      className={`glass glass-hover anim-up ${isActive && crisis.severity === 'critical' ? 'crisis-pulse' : ''}`}
      onClick={() => navigate(`/crisis/${crisis.id}`)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/crisis/${crisis.id}`); } }}
      role="article"
      tabIndex={0}
      aria-label={`${crisis.severity} ${crisis.type.replace(/_/g, ' ')} crisis at ${crisis.floor}${crisis.room ? ', ' + crisis.room : ''}, status: ${crisis.status}`}
      style={{
        padding: '16px 18px', cursor: 'pointer',
        animationDelay: `${delay * 0.06}s`,
        borderLeft: `3px solid ${crisis.severity === 'critical' ? '#ef4444' : crisis.severity === 'high' ? '#f59e0b' : crisis.severity === 'medium' ? '#3b82f6' : '#22c55e'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.3rem' }} aria-hidden="true">{TYPE_ICONS[crisis.type] || '📋'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', textTransform: 'capitalize' }}>{crisis.type.replace(/_/g, ' ')}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <FiClock size={10} /> {timeAgo(crisis.created_at)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <SeverityBadge severity={crisis.severity} />
          {crisis.geo_confidence === 100 && (
             <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4 }}>🌍 GPS Verified</span>
          )}
          {crisis.geo_confidence === 40 && (
             <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4, animation: 'pulse 2s infinite' }}>⚠️ Unverified</span>
          )}
        </div>
      </div>

      {crisis.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {crisis.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiMapPin size={11} /> {crisis.floor}{crisis.room ? ` / ${crisis.room}` : ''}
          </span>
          {crisis.assigned_staff_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiUser size={11} /> {crisis.assigned_staff_name}
            </span>
          )}
        </div>
        <StatusBadge status={crisis.status} />
      </div>
    </div>
  );
}
