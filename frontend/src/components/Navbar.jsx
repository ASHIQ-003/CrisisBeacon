import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShield, FiMonitor, FiAlertTriangle, FiUsers, FiBarChart2, FiSmartphone, FiMenu, FiX } from 'react-icons/fi';

const NAV = [
  { path: '/', label: 'Command Center', icon: FiMonitor },
  { path: '/sos', label: 'Guest SOS', icon: FiAlertTriangle },
  { path: '/staff', label: 'Staff', icon: FiUsers },
  { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { path: '/demo', label: 'Demo QR', icon: FiSmartphone },
];

export default function Navbar({ connected }) {
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="glass" role="navigation" aria-label="Main navigation" style={{ position: 'sticky', top: 0, zIndex: 50, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56 }}>
        <Link to="/" aria-label="CrisisBeacon - go to Command Center" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiShield size={16} color="#fff" />
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Crisis<span style={{ color: 'var(--accent-red)' }}>Beacon</span>
          </span>
        </Link>

        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = loc.pathname === path;
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7,
                fontSize: '0.82rem', fontWeight: active ? 600 : 500, textDecoration: 'none',
                color: active ? 'var(--accent-red)' : 'var(--text-muted)',
                background: active ? 'rgba(239,68,68,0.08)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <Icon size={14} aria-hidden="true" /> {label}
              </Link>
            );
          })}
          <div style={{
            marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
            background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: connected ? '#4ade80' : '#f87171',
            border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }} role="status" aria-live="polite" aria-label={connected ? 'Connected to live server' : 'Disconnected from server'}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} aria-hidden="true" />
            {connected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>

        <button onClick={() => setOpen(!open)} className="mobile-toggle" aria-label="Toggle navigation menu" aria-expanded={open} style={{
          display: 'none', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.3rem',
        }}>
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {open && (
        <div style={{ padding: '8px 20px 14px', display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--glass-border)' }}>
          {NAV.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 7,
              fontSize: '0.88rem', fontWeight: loc.pathname === path ? 600 : 500, textDecoration: 'none',
              color: loc.pathname === path ? 'var(--accent-red)' : 'var(--text-muted)',
              background: loc.pathname === path ? 'rgba(239,68,68,0.08)' : 'transparent',
            }}>
              <Icon size={15} /> {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`@media(max-width:768px){.mobile-toggle{display:block!important;}}`}</style>
    </nav>
  );
}
