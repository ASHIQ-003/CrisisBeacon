import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportCrisis } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';
import { FiChevronDown, FiChevronUp, FiMapPin, FiMic, FiMicOff, FiX, FiWifiOff } from 'react-icons/fi';

/**
 * Ultra-minimal Guest SOS — accessible to all users.
 *
 * Access modes:
 * 1. QR scan → one-tap emergency type
 * 2. Voice command → "fire", "medical", "help"
 * 3. Shake phone → 5-second countdown auto-SOS
 * 4. Keyboard → Tab + Enter for screen readers
 */

const PRIMARY_TYPES = [
  { type: 'fire', icon: '🔥', label: 'Fire', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { type: 'medical', icon: '🏥', label: 'Medical', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { type: 'security', icon: '🔒', label: 'Security', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { type: 'active_threat', icon: '⚠️', label: 'Threat', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
];

const MORE_TYPES = [
  { type: 'gas_leak', icon: '⛽', label: 'Gas Leak', color: '#f97316' },
  { type: 'flood', icon: '🌊', label: 'Flood', color: '#06b6d4' },
  { type: 'power_outage', icon: '⚡', label: 'Power Out', color: '#8b5cf6' },
  { type: 'elevator', icon: '🛗', label: 'Elevator', color: '#6366f1' },
  { type: 'structural', icon: '🏗️', label: 'Structural', color: '#b91c1c' },
  { type: 'noise', icon: '🔊', label: 'Noise', color: '#22c55e' },
  { type: 'suspicious', icon: '👁️', label: 'Suspicious', color: '#eab308' },
  { type: 'other', icon: '📋', label: 'Other', color: '#64748b' },
];

// Voice keywords → crisis type mapping
const VOICE_MAP = {
  fire: 'fire', flame: 'fire', smoke: 'fire', burning: 'fire',
  medical: 'medical', doctor: 'medical', ambulance: 'medical', injury: 'medical', hurt: 'medical', pain: 'medical', heart: 'medical', bleeding: 'medical',
  security: 'security', theft: 'security', stolen: 'security', robbery: 'security', intruder: 'security',
  threat: 'active_threat', weapon: 'active_threat', gun: 'active_threat', attack: 'active_threat', danger: 'active_threat',
  help: 'other', emergency: 'other', sos: 'other',
};

const FLOORS = ['Lobby', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Rooftop'];

export default function GuestSOS() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Pre-fill from QR code URL parameters
  const qrFloor = params.get('floor') || '';
  const qrRoom = params.get('room') || '';
  const hasLocation = !!qrFloor;

  const [phase, setPhase] = useState(hasLocation ? 'report' : 'location');
  const [floor, setFloor] = useState(qrFloor);
  const [room, setRoom] = useState(qrRoom);
  const [sending, setSending] = useState(false);
  const [sentCrisis, setSentCrisis] = useState(null);
  const [showMore, setShowMore] = useState(false);

  // Accessibility state
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [shakeCountdown, setShakeCountdown] = useState(null); // null = inactive, 5..1 = counting
  const shakeTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const sentRef = useRef(false); // prevent double-send

  // Post-report optional details
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');

  useSocket({
    'crisis:updated': (u) => {
      if (sentCrisis && u.id === sentCrisis.id) {
        setSentCrisis(u);
        if (u.status === 'resolved') {
          toast.success('Crisis has been marked resolved.', { icon: '✅' });
        } else if (u.status === 'responding') {
          toast('Responder is actively on site', { icon: '🏃' });
        }
      }
    }
  });

  useEffect(() => {
    const handleOnline = async () => {
      const offlinePayload = localStorage.getItem('offline_crisis');
      if (offlinePayload && phase === 'offline') {
        try {
          const result = await reportCrisis(JSON.parse(offlinePayload));
          setSentCrisis(result.crisis);
          setPhase('sent');
          localStorage.removeItem('offline_crisis');
          toast.success('Connection restored. SOS sent!');
        } catch (e) {}
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [phase]);

  // ── ONE TAP SUBMIT ─────────────────────────────────────────────
  const handleTypeTap = useCallback(async (type) => {
    if (sending || sentRef.current) return;
    sentRef.current = true;
    setSending(true);

    // Haptic feedback for deaf/hearing-impaired users
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]); // SOS pattern
    }

    // Geofencing Check (Anti-Prankster outside venue)
    const checkGeofence = () => new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ allow: true, confidence: 40 });

      const timeoutId = setTimeout(() => resolve({ allow: true, confidence: 40 }), 2500); // Fail open after 2.5s

      navigator.geolocation.getCurrentPosition((pos) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = pos.coords;
        // Mock Hotel Coordinates (New York City)
        const lat1 = 40.7128, lon1 = -74.0060; 
        const R = 6371e3; // Earth radius in meters
        const dLat = (latitude - lat1) * Math.PI / 180;
        const dLon = (longitude - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

        if (distance > 500) resolve({ allow: false, confidence: 0 }); // $>500 meters from venue$
        else resolve({ allow: true, confidence: 100 }); // Inside
      }, () => {
        clearTimeout(timeoutId);
        resolve({ allow: true, confidence: 40 }); // Erring on the side of safety if blocked/denied
      }, { enableHighAccuracy: false, timeout: 2000, maximumAge: 0 });
    });

    const geoResult = await checkGeofence();
    if (!geoResult.allow) {
      toast.error('🚨 Geo-Fence Violation: Device detected outside venue boundaries.', { duration: 6000 });
      setSending(false);
      sentRef.current = false;
      return;
    }

    try {
      const payload = {
        type,
        floor: floor || 'Unknown',
        room: room || '',
        description: '',
        reporter_name: '',
        reporter_phone: '',
        geo_confidence: geoResult.confidence,
      };

      if (!navigator.onLine) {
        localStorage.setItem('offline_crisis', JSON.stringify(payload));
        setSentCrisis({ id: 'offline', ...payload });
        setPhase('offline');
        toast.error('You are offline. Saving payload.');
        setSending(false);
        sentRef.current = false;
        return;
      }

      const result = await reportCrisis(payload);
      setSentCrisis(result.crisis);
      setPhase('sent');
      toast.success('🚨 Help is on the way!');
      // Long vibration on success
      if ('vibrate' in navigator) navigator.vibrate(500);
    } catch (err) {
      toast.error('Failed to send — try again');
      setSending(false);
      sentRef.current = false;
    }
  }, [sending, floor, room]);

  // ── VOICE SOS (Web Speech API) ─────────────────────────────────
  const startVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceText(transcript.toLowerCase());

      // Check for matching keywords
      const words = transcript.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (VOICE_MAP[word] && phase === 'report') {
          recognition.stop();
          setVoiceActive(false);
          toast.success(`🎤 Voice detected: "${word}"`);
          handleTypeTap(VOICE_MAP[word]);
          return;
        }
      }
    };

    recognition.onerror = () => {
      setVoiceActive(false);
      toast.error('Voice recognition failed — try again');
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceActive(true);
    toast('🎤 Listening... say "fire", "medical", "security", or "help"', { duration: 4000 });
  }, [phase, handleTypeTap]);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceActive(false);
    setVoiceText('');
  }, []);

  // ── SHAKE TO SOS (DeviceMotion API) ────────────────────────────
  useEffect(() => {
    if (phase !== 'report') return;

    let lastShake = 0;
    const SHAKE_THRESHOLD = 15; // acceleration threshold (lowered for easier detection)
    const SHAKE_COOLDOWN = 10000; // 10s cooldown between shakes

    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || {};
      if (x == null) return;

      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (acceleration > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN && !sentRef.current) {
        lastShake = now;
        startShakeCountdown();
      }
    };

    // Auto-listen if Android/Desktop. (iOS requires button tap, handled in handleShakeSOSButton)
    if (typeof DeviceMotionEvent === 'undefined' || typeof DeviceMotionEvent.requestPermission !== 'function') {
      window.addEventListener('devicemotion', handleMotion);
    }

    // Attach to window so button can access it
    window._startCrisisMotion = () => {
      window.addEventListener('devicemotion', handleMotion);
    };

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      delete window._startCrisisMotion;
    };
  }, [phase, startShakeCountdown]);

  const startShakeCountdown = useCallback(() => {
    if (shakeTimerRef.current || sentRef.current) return;

    // Haptic burst to confirm shake detected
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);

    let count = 5;
    setShakeCountdown(count);

    shakeTimerRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(shakeTimerRef.current);
        shakeTimerRef.current = null;
        setShakeCountdown(null);
        // Auto-send as "other" emergency
        handleTypeTap('other');
      } else {
        setShakeCountdown(count);
        if ('vibrate' in navigator) navigator.vibrate(100);
      }
    }, 1000);
  }, [handleTypeTap]);

  const cancelShake = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (shakeTimerRef.current) {
      clearInterval(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
    setShakeCountdown(null);
    toast('Cancelled — shake again if you need help', { icon: '✋' });
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearInterval(shakeTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // ── SHAKE COUNTDOWN OVERLAY ────────────────────────────────────
  if (shakeCountdown !== null) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(220,38,38,0.95)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20,
      }} role="alert" aria-live="assertive" aria-label={`Emergency SOS in ${shakeCountdown} seconds. Tap cancel to stop.`}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          📳 Shake Detected
        </div>
        <div style={{
          fontSize: '6rem', fontWeight: 900, color: '#fff',
          fontFamily: 'JetBrains Mono, monospace',
          textShadow: '0 0 40px rgba(255,255,255,0.5)',
        }}>
          {shakeCountdown}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
          Sending SOS in {shakeCountdown}s…
        </div>

        {/* Progress bar */}
        <div style={{
          width: 240, height: 6, borderRadius: 3,
          background: 'rgba(255,255,255,0.2)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: '#fff',
            width: `${((5 - shakeCountdown) / 5) * 100}%`,
            transition: 'width 0.9s linear',
          }} />
        </div>

        <button
          onClick={cancelShake}
          autoFocus
          aria-label="Cancel emergency SOS"
          style={{
            marginTop: 16, padding: '14px 40px', borderRadius: 12,
            background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.5)',
            color: '#fff', fontSize: '1.1rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
        >
          ✋ Cancel
        </button>

        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          Don't cancel if you need help — it will send automatically
        </p>
      </div>
    );
  }

  // ── LOCATION PHASE (no QR code) ────────────────────────────────
  if (phase === 'location') {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 20 }} role="form" aria-label="Select your floor location">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>📍</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Where are you?</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 6 }}>
            Tap your floor so we can send help to the right place.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="group" aria-label="Floor selection">
          {FLOORS.map(f => (
            <button
              key={f}
              onClick={() => { setFloor(f); setPhase('report'); }}
              className="glass glass-hover"
              aria-label={`Select ${f} as your location`}
              style={{
                padding: '16px 20px', cursor: 'pointer',
                border: 'none', color: 'var(--text)', fontFamily: 'inherit',
                fontSize: '1rem', fontWeight: 600, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <FiMapPin size={16} color="var(--accent-blue)" />
              {f}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: 18 }}>
          💡 Tip: Scan the QR code in your room to skip this step
        </p>
      </div>
    );
  }

  // ── OFFLINE PENDING SCREEN ────────────────────────────────
  if (phase === 'offline' && sentCrisis) {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 20 }}>
        <div className="glass anim-up" style={{ padding: '40px 28px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.3)' }} role="status" aria-live="polite">
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: '#fff'
          }}>
            <FiWifiOff size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Network Unavailable</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 6 }}>
            Your SOS response has been cached. It will automatically flush to the Command Center the moment you regain service.
          </p>
          <div className="spinner" style={{ borderTopColor: '#f59e0b', width: 24, height: 24, margin: '16px auto' }} />
        </div>
      </div>
    );
  }

  // ── SENT — HELP IS ON THE WAY ──────────────────────────────────
  if (phase === 'sent' && sentCrisis) {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 20 }}>
        <div className="glass anim-up" style={{ padding: '40px 28px', textAlign: 'center' }} role="status" aria-live="polite">
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '2.2rem',
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Help Is On The Way</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 6 }}>
            Status: <strong>{sentCrisis.status.toUpperCase()}</strong> at <strong>{floor}{room ? ` / ${room}` : ''}</strong>.
          </p>
          {sentCrisis.assigned_staff_name && (
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
              fontSize: '0.82rem', fontWeight: 600, marginTop: 4,
              animation: sentCrisis.status === 'responding' ? 'pulse 2s infinite' : 'none'
            }}>
              🛡️ {sentCrisis.assigned_staff_name} is {sentCrisis.status === 'responding' ? 'actively on-site 🏃' : 'assigned to this case'}
            </p>
          )}
          {sentCrisis.escalated && (
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              fontSize: '0.82rem', fontWeight: 600, marginTop: 4,
            }}>
              🚨 911 / EMS HAS BEEN DISPATCHED
            </p>
          )}
        </div>

        {/* Optional: Add details AFTER report */}
        <div className="glass anim-up" style={{ padding: 20, marginTop: 14, animationDelay: '0.1s' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 10, fontWeight: 600 }}>
            While you wait, you can add details to help the responder:
          </p>
          <textarea
            className="input"
            placeholder="What's happening? Any injuries? How many people?"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ resize: 'none', marginBottom: 8 }}
            aria-label="Describe what is happening"
          />
          <input
            className="input"
            placeholder="Your name (optional)"
            value={reporterName}
            onChange={e => setReporterName(e.target.value)}
            style={{ marginBottom: 10 }}
            aria-label="Your name, optional"
          />
          <button
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate(`/crisis/${sentCrisis.id}`)}
          >
            View Status →
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Stay calm · Stay where you are · Help is coming
          </p>
        </div>
      </div>
    );
  }

  // ── REPORT PHASE — BIG EMERGENCY BUTTONS ───────────────────────
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', paddingTop: 10 }}>
      {/* Location indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        marginBottom: 14, fontSize: '0.78rem', color: 'var(--text-muted)',
      }}>
        <FiMapPin size={12} aria-hidden="true" />
        <span>{floor}{room ? ` · ${room}` : ''}</span>
        {!hasLocation && (
          <button
            onClick={() => setPhase('location')}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-blue)',
              cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Change
          </button>
        )}
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          What's the emergency?
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: 4 }}>
          Tap, speak, or shake to get help instantly
        </p>
      </div>

      {/* ── Accessibility toolbar ── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 18, justifyContent: 'center',
      }}>
        {/* Voice SOS button */}
        <button
          onClick={voiceActive ? stopVoice : startVoice}
          aria-label={voiceActive ? 'Stop voice recognition' : 'Start voice SOS — speak your emergency'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: voiceActive ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${voiceActive ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.3)'}`,
            color: voiceActive ? '#f87171' : '#60a5fa',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
            animation: voiceActive ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {voiceActive ? <><FiMicOff size={14} /> Stop Listening</> : <><FiMic size={14} /> Voice SOS</>}
        </button>

        {/* Shake SOS button (manual trigger for demo / desktop) */}
        <button
          onClick={async () => {
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
              try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                  if (window._startCrisisMotion) window._startCrisisMotion();
                  toast.success('Motion sensors active!');
                } else {
                  toast.error('Permission denied. Use Tap or Voice.');
                }
              } catch (e) {
                // Ignore
              }
            }
            startShakeCountdown(); // Always start manually if clicked
          }}
          aria-label="Trigger shake SOS — 5 second countdown before sending"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            color: '#fbbf24',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          📳 Shake SOS
        </button>
      </div>

      {/* Voice feedback */}
      {voiceActive && (
        <div className="glass" style={{
          padding: '10px 16px', marginBottom: 14, textAlign: 'center',
          fontSize: '0.78rem', borderColor: 'rgba(239,68,68,0.3)',
          animation: 'pulse 2s ease-in-out infinite',
        }} role="status" aria-live="polite">
          <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 4 }}>🎤 Listening…</div>
          <div style={{ color: 'var(--text-dim)' }}>
            {voiceText || 'Say "fire", "medical", "security", "help"…'}
          </div>
        </div>
      )}

      {/* Primary 4 — BIG buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }} role="group" aria-label="Emergency type — tap to report immediately">
        {PRIMARY_TYPES.map(({ type, icon, label, color, bg }) => (
          <button
            key={type}
            onClick={() => handleTypeTap(type)}
            disabled={sending}
            aria-label={`Report ${label} emergency at ${floor}${room ? ', ' + room : ''}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '28px 10px', borderRadius: 16, cursor: 'pointer',
              border: `2px solid ${color}40`,
              background: bg,
              color: color,
              transition: 'all 0.15s',
              fontFamily: 'inherit',
              opacity: sending ? 0.5 : 1,
            }}
            onMouseOver={e => { if (!sending) { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 24px ${color}30`; } }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span style={{ fontSize: '2.5rem' }} aria-hidden="true">{icon}</span>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* More types — expandable */}
      <button
        onClick={() => setShowMore(!showMore)}
        aria-expanded={showMore}
        aria-label={showMore ? 'Hide additional emergency types' : 'Show more emergency types'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '10px', borderRadius: 10,
          background: 'rgba(75,85,99,0.1)', border: '1px solid rgba(75,85,99,0.2)',
          color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}
      >
        {showMore ? 'Less options' : 'More emergency types'}
        {showMore ? <FiChevronUp size={14} aria-hidden="true" /> : <FiChevronDown size={14} aria-hidden="true" />}
      </button>

      {showMore && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          marginTop: 12, animation: 'fadeInUp 0.3s ease-out',
        }} role="group" aria-label="Additional emergency types">
          {MORE_TYPES.map(({ type, icon, label, color }) => (
            <button
              key={type}
              onClick={() => handleTypeTap(type)}
              disabled={sending}
              aria-label={`Report ${label} emergency`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '14px 4px', borderRadius: 10, cursor: 'pointer',
                border: '1px solid rgba(75,85,99,0.2)',
                background: 'rgba(75,85,99,0.08)',
                color: 'var(--text-muted)',
                fontSize: '0.68rem', fontWeight: 600, fontFamily: 'inherit',
                transition: 'all 0.15s',
                opacity: sending ? 0.5 : 1,
              }}
              onMouseOver={e => { if (!sending) { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; } }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(75,85,99,0.2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Sending overlay */}
      {sending && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16,
        }} role="alert" aria-live="assertive" aria-label="Sending emergency alert">
          <div className="sos-btn" style={{ width: 120, height: 120, fontSize: '1.2rem', pointerEvents: 'none' }}>
            <div className="spinner" style={{ borderTopColor: '#fff', width: 36, height: 36 }} />
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Sending alert…</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.68rem', lineHeight: 1.6 }}>
          Your location: <strong>{floor}{room ? ` / ${room}` : ''}</strong><br />
          🎤 Voice · 📳 Shake · 👆 Tap — all ways to get help
        </p>
      </div>
    </div>
  );
}
