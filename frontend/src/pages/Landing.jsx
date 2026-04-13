import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiZap, FiUsers, FiActivity, FiSmartphone, FiClock, FiRadio, FiBarChart2 } from 'react-icons/fi';

const FEATURES = [
  { icon: <FiZap />, title: 'Sub-Second Alerts', desc: 'WebSocket-powered real-time updates. Every crisis appears on dashboards in under 100ms.', color: '#f59e0b' },
  { icon: <FiUsers />, title: 'Auto-Assignment', desc: 'Automated Protocol Engine matches the best staff by role, floor proximity, and experience.', color: '#3b82f6' },
  { icon: <FiSmartphone />, title: 'Zero-Friction SOS', desc: 'Guests scan a QR code and tap. No download, no login, no training required.', color: '#ef4444' },
  { icon: <FiRadio />, title: 'Multi-Modal Input', desc: 'Tap, voice command, or shake-to-SOS. Accessible to deaf, blind, and mobility-impaired users.', color: '#8b5cf6' },
  { icon: <FiClock />, title: 'Full Lifecycle', desc: 'Report → Triage → Assign → Acknowledge → Respond → Resolve → AI Debrief.', color: '#22c55e' },
  { icon: <FiBarChart2 />, title: 'Live Analytics', desc: 'Response times, severity breakdowns, hotspot maps, and staff leaderboards — all real-time.', color: '#06b6d4' },
];

const STATS = [
  { value: '<100ms', label: 'Alert Latency' },
  { value: '3', label: 'Input Modes' },
  { value: '13', label: 'Crisis Types' },
  { value: '7', label: 'Floor Coverage' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 50 }}>
        {/* Floating badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px', borderRadius: 50,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: '0.78rem', fontWeight: 600, color: '#f87171', marginBottom: 20,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'blink 1.2s ease-in-out infinite' }} />
          Real-Time Crisis Response Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900,
            lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 18,
          }}
        >
          When Seconds Matter,{' '}
          <span style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Every Signal Counts
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.7 }}
        >
          CrisisBeacon transforms how hotels and venues detect, coordinate, and resolve emergencies — from guest report to staff response in under 10 seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <button
            className="btn btn-danger"
            onClick={() => navigate('/command')}
            style={{ fontSize: '1rem', padding: '14px 32px', borderRadius: 14 }}
          >
            <FiShield size={18} /> Open Command Center
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/sos')}
            style={{ fontSize: '1rem', padding: '14px 32px', borderRadius: 14 }}
          >
            <FiActivity size={18} /> Try Guest SOS
          </button>
        </motion.div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="glass"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          padding: '28px 20px', marginBottom: 60, textAlign: 'center',
        }}
      >
        {STATS.map(s => (
          <div key={s.label}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── FEATURES GRID ──────────────────────────────────── */}
      <section style={{ marginBottom: 60 }}>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}
        >
          Enterprise-Grade Features
        </motion.h2>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: 36 }}>
          Built for real emergencies, not just demos.
        </p>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}
        >
          {FEATURES.map(f => (
            <motion.div
              key={f.title}
              variants={item}
              className="glass glass-hover"
              style={{ padding: '26px 24px', cursor: 'default' }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${f.color}15`, border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color, fontSize: '1.2rem', marginBottom: 14,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section style={{ marginBottom: 60 }}>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: 36, letterSpacing: '-0.03em' }}
        >
          How It Works
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}
        >
          {[
            { step: '01', icon: '📱', title: 'Guest Scans QR', desc: 'A QR code in the hotel room pre-fills location — no app download needed.' },
            { step: '02', icon: '🚨', title: 'One-Tap SOS', desc: 'Guest taps emergency type. Report is submitted instantly with geo-confidence scoring.' },
            { step: '03', icon: '⚡', title: 'Auto-Triage & Assign', desc: 'Our Protocol Engine classifies severity and assigns the nearest qualified responder.' },
            { step: '04', icon: '🛡️', title: 'Resolve & Debrief', desc: 'Staff responds on-site, resolves the crisis, and Gemini AI generates an incident report.' },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              variants={item}
              style={{
                textAlign: 'center', padding: '30px 18px',
                borderRadius: 'var(--radius)', position: 'relative',
                background: 'rgba(17,24,39,0.5)', border: '1px solid var(--glass-border)',
              }}
            >
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 900, color: '#fff',
              }}>
                {s.step}
              </div>
              <div style={{ fontSize: '2.2rem', marginBottom: 12, marginTop: 6 }}>{s.icon}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── INTEGRATIONS ───────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass"
        style={{ padding: '36px 32px', marginBottom: 60, textAlign: 'center' }}
      >
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Built for Integration</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 24 }}>
          Webhooks, SMS, and real-time APIs — CrisisBeacon plugs into your existing stack.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
          {['Twilio SMS', 'Socket.io', 'REST API', 'QR Codes', 'Web Audio', 'Gemini AI', 'Service Workers'].map(t => (
            <span key={t} style={{
              padding: '8px 18px', borderRadius: 50,
              background: 'rgba(75,85,99,0.15)', border: '1px solid rgba(75,85,99,0.3)',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
            }}>
              {t}
            </span>
          ))}
        </div>
      </motion.section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', paddingBottom: 80 }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
          background: 'radial-gradient(circle, rgba(239,68,68,0.25), rgba(239,68,68,0.05))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          border: '2px solid rgba(239,68,68,0.2)',
          animation: 'sos-pulse 3s ease-in-out infinite',
          position: 'relative',
        }}>
          🚨
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>
          Ready to see it in action?
        </h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: '0.9rem' }}>
          Open the Command Center, then report an emergency from Guest SOS.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-danger" onClick={() => navigate('/command')} style={{ padding: '12px 28px', borderRadius: 12 }}>
            🖥️ Command Center
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/sos')} style={{ padding: '12px 28px', borderRadius: 12 }}>
            📱 Guest SOS
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/analytics')} style={{ padding: '12px 28px', borderRadius: 12 }}>
            📊 Analytics
          </button>
        </div>

        <p style={{ color: 'var(--text-dim)', fontSize: '0.68rem', marginTop: 36, lineHeight: 1.6 }}>
          CrisisBeacon · Built for HackHarvard 2026 · Real-time crisis coordination for hospitality venues.
        </p>
      </motion.section>
    </div>
  );
}
