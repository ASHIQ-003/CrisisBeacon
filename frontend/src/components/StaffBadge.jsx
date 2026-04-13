export default function StaffBadge({ member }) {
  const statusColors = {
    available: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#4ade80', dot: '#22c55e' },
    responding: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', dot: '#f59e0b' },
    busy: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171', dot: '#ef4444' },
    off_duty: { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8', dot: '#64748b' },
  };

  const roleIcons = {
    security: '🛡️',
    medical: '🏥',
    maintenance: '🔧',
    management: '👔',
  };

  const s = statusColors[member.status] || statusColors.available;

  return (
    <div className="glass glass-hover anim-up" style={{
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem',
      }}>
        {roleIcons[member.role] || '👤'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{member.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'capitalize', marginTop: 1 }}>
          {member.role} · {member.floor}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
          background: s.bg, color: s.text, border: `1px solid ${s.border}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
          {member.status?.replace(/_/g, ' ')}
        </span>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 4 }}>
          {member.crises_handled || 0} handled
        </div>
      </div>
    </div>
  );
}
