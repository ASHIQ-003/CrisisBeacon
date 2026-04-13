import { useState, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import toast from 'react-hot-toast';

import Navbar from './components/Navbar';
import CommandCenter from './pages/CommandCenter';
import GuestSOS from './pages/GuestSOS';
import StaffView from './pages/StaffView';
import CrisisDetail from './pages/CrisisDetail';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import DemoQR from './pages/DemoQR';

// ── Alert sound helper ──────────────────────────────────────────
function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

// ── Browser Push Notification ───────────────────────────────────
function sendBrowserNotification(title, body, tag) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      tag, // prevents duplicate notifications
      icon: '🚨',
      badge: '🚨',
      vibrate: [200, 100, 200], // mobile vibration pattern
      requireInteraction: true, // stays until dismissed
    });
  } catch {}
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Request browser notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const { connected } = useSocket({
    'crisis:new': (crisis) => {
      triggerRefresh();
      const label = crisis.type?.replace(/_/g, ' ') || 'Unknown';
      const sev = crisis.severity?.toUpperCase() || '';

      // In-app toast
      toast(`🚨 New ${sev} crisis: ${label}`, {
        duration: 5000,
        icon: crisis.severity === 'critical' ? '🔴' : '🟡',
      });

      // Browser push notification (shows even when tab is in background)
      sendBrowserNotification(
        `🚨 ${sev} Crisis: ${label}`,
        `📍 ${crisis.floor}${crisis.room ? ' / ' + crisis.room : ''}\n${crisis.description || 'Immediate response required'}`,
        `crisis-${crisis.id}`,
      );

      // Alert sound for critical
      if (crisis.severity === 'critical') playAlert();
    },
    'crisis:updated': () => triggerRefresh(),
    'crisis:resolved': (crisis) => {
      triggerRefresh();
      const label = crisis.type?.replace(/_/g, ' ');
      toast.success(`✅ Crisis resolved: ${label}`);

      sendBrowserNotification(
        `✅ Crisis Resolved`,
        `${label} at ${crisis.floor} has been resolved.`,
        `resolved-${crisis.id}`,
      );
    },
    'staff:updated': () => triggerRefresh(),
  });

  return (
    <div className="grid-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Skip-to-content link for keyboard/screen reader users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Navbar connected={connected} />

      {/* Live region for screen reader announcements */}
      <div id="live-announcements" aria-live="assertive" aria-atomic="true" className="sr-only" />

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        style={{ flex: 1, padding: '24px 20px', maxWidth: 1400, width: '100%', margin: '0 auto' }}
      >
        <Routes>
          <Route path="/" element={<CommandCenter refreshKey={refreshKey} />} />
          <Route path="/sos" element={<GuestSOS />} />
          <Route path="/staff" element={<StaffView refreshKey={refreshKey} />} />
          <Route path="/crisis/:id" element={<CrisisDetail refreshKey={refreshKey} />} />
          <Route path="/analytics" element={<Analytics refreshKey={refreshKey} />} />
          <Route path="/demo" element={<DemoQR />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
