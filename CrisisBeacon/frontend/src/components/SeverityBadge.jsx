const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL', cls: 'sev-critical', dot: '#ef4444' },
  high: { label: 'HIGH', cls: 'sev-high', dot: '#f59e0b' },
  medium: { label: 'MEDIUM', cls: 'sev-medium', dot: '#3b82f6' },
  low: { label: 'LOW', cls: 'sev-low', dot: '#22c55e' },
};

export default function SeverityBadge({ severity }) {
  const c = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  return (
    <span className={`sev ${c.cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{status}</span>;
}
