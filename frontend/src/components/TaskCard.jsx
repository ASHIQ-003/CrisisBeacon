import UrgencyBadge from './UrgencyBadge';
import { FiMapPin, FiUsers, FiCalendar } from 'react-icons/fi';

export default function TaskCard({ need, onClick, delay = 0 }) {
  return (
    <div
      className="glass-card glass-card-hover animate-fade-in-up"
      onClick={onClick}
      style={{
        padding: '22px 24px', cursor: 'pointer',
        animationDelay: `${delay * 0.07}s`, opacity: 0,
        animationFillMode: 'forwards',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', maxWidth: '70%' }}>
          {need.need_type}
        </h3>
        <UrgencyBadge urgency={need.urgency} />
      </div>

      {need.description && (
        <p style={{
          fontSize: '0.85rem', color: 'var(--color-text-muted)',
          lineHeight: 1.5, marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {need.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FiMapPin size={13} color="var(--color-primary-light)" />
          {need.location_name}
        </span>
        {need.families_affected > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <FiUsers size={13} color="var(--color-accent)" />
            {need.families_affected} families
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FiCalendar size={13} />
          {need.reported_date}
        </span>
      </div>

      <div style={{
        marginTop: 12, display: 'flex', justifyContent: 'flex-end',
      }}>
        <span className={`badge ${need.status === 'assigned' ? 'badge-assigned' : 'badge-open'}`}>
          {need.status}
        </span>
      </div>
    </div>
  );
}
