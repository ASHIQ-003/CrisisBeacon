import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineMenu, HiX } from 'react-icons/hi';
import { FiMapPin, FiUsers, FiGrid, FiUserPlus } from 'react-icons/fi';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: FiGrid },
  { path: '/map', label: 'Live Map', icon: FiMapPin },
  { path: '/volunteers', label: 'Volunteers', icon: FiUsers },
  { path: '/register', label: 'Register', icon: FiUserPlus },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="glass-card" style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      borderBottom: '1px solid var(--glass-border)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 800, color: '#fff',
          }}>V</div>
          <span style={{
            fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)',
            letterSpacing: '-0.02em',
          }}>
            Volunteer<span style={{ color: 'var(--color-primary-light)' }}>Bridge</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8,
                fontSize: '0.87rem', fontWeight: active ? 600 : 500,
                color: active ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none', background: 'none', border: 'none',
            color: 'var(--color-text)', cursor: 'pointer', fontSize: '1.5rem',
          }}
          className="mobile-menu-btn"
        >
          {mobileOpen ? <HiX /> : <HiOutlineMenu />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div style={{
          padding: '8px 24px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
          borderTop: '1px solid var(--glass-border)',
        }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                fontSize: '0.9rem', fontWeight: active ? 600 : 500,
                color: active ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                textDecoration: 'none',
              }}>
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
