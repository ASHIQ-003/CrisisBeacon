import { FiUser, FiMapPin, FiStar } from 'react-icons/fi';

export default function MatchList({ matches, onAssign, assigning }) {
  if (!matches || matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-muted)' }}>
        No volunteers matched yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {matches.map((match, idx) => {
        const vol = match.volunteer;
        const quality = match.match_quality;
        const scoreColor = quality === 'Excellent' ? 'score-excellent'
          : quality === 'Good' ? 'score-good' : 'score-possible';

        return (
          <div
            key={vol.id || idx}
            className="glass-card animate-slide-in"
            style={{
              padding: '18px 20px',
              animationDelay: `${idx * 0.1}s`,
              opacity: 0, animationFillMode: 'forwards',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                }}>
                  {vol.name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{vol.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiMapPin size={11} /> {match.distance_km != null ? `${match.distance_km} km away` : 'Location unknown'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text)' }}>{match.score}</div>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  color: quality === 'Excellent' ? 'var(--color-accent)' : quality === 'Good' ? '#fbbf24' : 'var(--color-text-muted)',
                }}>
                  {quality}
                </div>
              </div>
            </div>

            {/* Score Bar */}
            <div className="score-bar" style={{ marginBottom: 10 }}>
              <div className={`score-bar-fill ${scoreColor}`} style={{ width: `${match.score}%` }} />
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {Object.entries(match.breakdown).map(([key, val]) => (
                <span key={key} style={{
                  fontSize: '0.72rem', color: 'var(--color-text-muted)',
                  background: 'var(--color-surface-3)', padding: '3px 10px', borderRadius: 12,
                }}>
                  {key}: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{val}</span>
                </span>
              ))}
            </div>

            {/* Skills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {(vol.skills || []).map(s => (
                <span key={s} className="skill-chip active" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Assign Button */}
            {onAssign && (
              <button
                className="btn-accent"
                onClick={() => onAssign(vol.id)}
                disabled={assigning}
                style={{
                  width: '100%', padding: '10px 0',
                  opacity: assigning ? 0.6 : 1,
                }}
              >
                {assigning ? 'Assigning…' : `Assign ${vol.name?.split(' ')[0]}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
