import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="gradient-bg" style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }} className="animate-fade-in-up">
        <div style={{
          fontSize: '6rem', fontWeight: 900, letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>
          404
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 8, marginBottom: 8 }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: 24, maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-accent" style={{ textDecoration: 'none', padding: '12px 32px' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
