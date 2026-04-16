import { useState, useEffect } from 'react';
import { FiWifi, FiSmartphone, FiMonitor, FiPrinter, FiCopy, FiCheck } from 'react-icons/fi';

/**
 * DemoQR — Hackathon demo page that generates printable QR codes.
 * Each QR encodes a URL like: http://<your-ip>:5173/sos?floor=Floor+3&room=302
 * Guests scan with their phone camera → SOS page opens with location pre-filled.
 */

const DEMO_ROOMS = [
  { floor: 'Lobby', room: 'Reception', label: '🏨 Lobby — Reception' },
  { floor: 'Lobby', room: 'Pool Area', label: '🏊 Lobby — Pool Area' },
  { floor: 'Floor 1', room: '101', label: '🚪 Room 101' },
  { floor: 'Floor 2', room: '205', label: '🚪 Room 205' },
  { floor: 'Floor 3', room: '302', label: '🚪 Room 302' },
  { floor: 'Floor 3', room: 'Banquet Hall', label: '🎉 Floor 3 — Banquet Hall' },
  { floor: 'Floor 4', room: 'Presidential Suite', label: '👑 Presidential Suite' },
  { floor: 'Rooftop', room: 'Sky Bar', label: '🍸 Rooftop — Sky Bar' },
];

// Free QR code API — no dependencies needed
function qrUrl(text, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=f1f5f9&bgcolor=111827&margin=8`;
}

export default function DemoQR() {
  const [baseUrl, setBaseUrl] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setBaseUrl(window.location.origin);
      return;
    }

    const initializeNetworkUrl = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/network-ip`);
        const data = await res.json();
        const port = window.location.port || '5173';
        const protocol = window.location.protocol;
        setBaseUrl(`${protocol}//${data.ip}:${port}`);
      } catch (err) {
        setBaseUrl(window.location.origin);
      }
    };
    initializeNetworkUrl();
  }, []);

  const getSosUrl = (floor, room) => {
    return `${baseUrl}/sos?floor=${encodeURIComponent(floor)}&room=${encodeURIComponent(room)}`;
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          📱 Demo QR Codes
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 4 }}>
          Print these or show on screen. Scan with any phone camera to open the SOS page.
        </p>
      </div>

      {/* Setup Instructions */}
      <div className="glass anim-up" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 14 }}>🎯 Hackathon Demo Setup</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FiWifi size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Step 1: Same WiFi</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Connect your phone and laptop to the same WiFi network
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(34,197,94,0.12)', color: '#4ade80',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FiMonitor size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Step 2: Dashboard on Laptop</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Open Command Center on your laptop's large screen
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(245,158,11,0.12)', color: '#fbbf24',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FiSmartphone size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Step 3: Scan QR → One Tap</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Scan any QR below with your phone. Tap 🔥 Fire → watch it appear live!
              </div>
            </div>
          </div>
        </div>

        {baseUrl && (
          <div style={{
            marginTop: 14, padding: '8px 14px', borderRadius: 8,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace',
          }}>
            📡 Your network URL: <strong>{baseUrl}</strong>
          </div>
        )}
      </div>

      {/* Print button */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={handlePrint}>
          <FiPrinter size={14} /> Print QR Codes
        </button>
      </div>

      {/* QR Code Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {DEMO_ROOMS.map(({ floor, room, label }) => {
          const url = getSosUrl(floor, room);
          const id = `${floor}-${room}`;
          return (
            <div key={id} className="glass anim-up" style={{
              padding: 20, textAlign: 'center',
              pageBreakInside: 'avoid',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 12 }}>
                {label}
              </div>

              {baseUrl ? (
                <img
                  src={qrUrl(url)}
                  alt={`QR code for ${label}`}
                  style={{
                    width: 180, height: 180,
                    borderRadius: 8,
                    background: '#111827',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              ) : (
                <div style={{
                  width: 180, height: 180,
                  borderRadius: 8, background: 'rgba(75,85,99,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', fontSize: '0.78rem', color: 'var(--text-dim)',
                }}>
                  Loading…
                </div>
              )}

              <div style={{
                marginTop: 10, fontSize: '0.68rem', color: 'var(--text-dim)',
                fontFamily: 'JetBrains Mono, monospace',
                wordBreak: 'break-all',
              }}>
                {floor} · {room}
              </div>

              <button
                onClick={() => handleCopy(url, id)}
                style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                  background: 'rgba(75,85,99,0.15)', border: '1px solid rgba(75,85,99,0.25)',
                  color: copied === id ? '#4ade80' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {copied === id ? <><FiCheck size={11} /> Copied!</> : <><FiCopy size={11} /> Copy URL</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, .btn, button, [style*="grid-bg"] > main > div:first-child,
          [style*="grid-bg"] > nav { display: none !important; }
          .glass { background: white !important; color: black !important; border: 1px solid #ddd !important; }
          body { background: white !important; color: black !important; }
          * { color: black !important; }
          img { filter: invert(1) !important; }
        }
      `}</style>
    </div>
  );
}
