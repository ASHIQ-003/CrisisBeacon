import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div className="glass anim-up" style={{ padding: 48, textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>🚫</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, color: 'var(--accent-red)' }}>
          404
        </h1>
        <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 4 }}>
          Page Not Found
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 24, lineHeight: 1.5 }}>
          This sector doesn't exist in our command grid. Return to the Command Center.
        </p>
        <Link to="/" className="btn btn-danger" style={{ textDecoration: 'none' }}>
          <FiHome size={14} /> Command Center
        </Link>
      </div>
    </div>
  );
}
