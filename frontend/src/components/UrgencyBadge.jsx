export default function UrgencyBadge({ urgency }) {
  const config = {
    1: { label: 'Critical', cls: 'badge-critical', emoji: '🔴' },
    2: { label: 'Moderate', cls: 'badge-moderate', emoji: '🟡' },
    3: { label: 'Low', cls: 'badge-low', emoji: '🟢' },
  };
  const { label, cls, emoji } = config[urgency] || config[2];
  return <span className={`badge ${cls}`}>{emoji} {label}</span>;
}
