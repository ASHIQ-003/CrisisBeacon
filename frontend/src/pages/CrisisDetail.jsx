import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCrisis, acknowledgeCrisis, respondCrisis, resolveCrisis, generateDebrief, escalateCrisis } from '../services/api';
import SeverityBadge, { StatusBadge } from '../components/SeverityBadge';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiUser, FiClock, FiPhone, FiCheckCircle, FiPlay, FiCheck, FiShield, FiFileText, FiZap, FiDownload, FiAlertTriangle } from 'react-icons/fi';

const TYPE_ICONS = { fire: '🔥', medical: '🏥', security: '🔒', gas_leak: '⛽', flood: '🌊', power_outage: '⚡', elevator: '🛗', structural: '🏗️', explosion: '💥', active_threat: '⚠️', noise: '🔊', suspicious: '👁️', other: '📋' };

export default function CrisisDetail({ refreshKey }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crisis, setCrisis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCrisis(id);
        setCrisis(data.crisis);
      } catch {
        toast.error('Crisis not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, refreshKey, navigate]);

  const handleAcknowledge = async () => {
    try {
      await acknowledgeCrisis(id, crisis.assigned_to);
      toast.success('Crisis acknowledged');
    } catch { toast.error('Failed'); }
  };

  const handleRespond = async () => {
    try {
      await respondCrisis(id);
      toast.success('Responding on-site');
    } catch { toast.error('Failed'); }
  };

  const handleResolve = async () => {
    try {
      await resolveCrisis(id, resolveNotes);
      toast.success('Crisis resolved! ✅');
      setShowResolve(false);
    } catch { toast.error('Failed'); }
  };

  const handleEscalate = async () => {
    if (!window.confirm("🚨 Are you sure you want to escalate to 911/External EMS? This will dispatch external authorities.")) return;
    try {
      await escalateCrisis(id);
      toast.success('Crisis escalated to 911');
    } catch { toast.error('Failed to escalate'); }
  };

  const handleGenerateDebrief = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Generating AI Incident Report...');
    try {
      const data = await generateDebrief(id);
      setCrisis(prev => ({ ...prev, ai_debrief: data.debrief }));
      toast.success('Report generated successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report. Check API Key.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || !crisis) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isActive = ['reported', 'assigned', 'acknowledged', 'responding'].includes(crisis.status);
  const responseSec = crisis.acknowledged_at && crisis.created_at
    ? Math.round((new Date(crisis.acknowledged_at) - new Date(crisis.created_at)) / 1000)
    : null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom: 18 }}>
        <FiArrowLeft size={14} /> Back
      </button>

      {/* Header Card */}
      <div className={`glass anim-up ${isActive && crisis.severity === 'critical' ? 'crisis-pulse' : ''}`}
        style={{
          padding: '24px 28px',
          borderLeft: `4px solid ${crisis.severity === 'critical' ? '#ef4444' : crisis.severity === 'high' ? '#f59e0b' : '#3b82f6'}`,
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2.2rem' }}>{TYPE_ICONS[crisis.type] || '📋'}</span>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'capitalize' }}>
                {crisis.type?.replace(/_/g, ' ')}
              </h1>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <SeverityBadge severity={crisis.severity} />
                <StatusBadge status={crisis.status} />
                {crisis.geo_confidence === 100 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: '0.72rem', fontWeight: 800 }}>
                    🌍 GPS Verified
                  </span>
                )}
                {crisis.geo_confidence === 40 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.72rem', fontWeight: 800, animation: 'pulse 2s infinite' }}>
                    ⚠️ Verify CCTV
                  </span>
                )}
              </div>
            </div>
          </div>
          {isActive && (
            <div style={{ display: 'flex', gap: 6 }}>
              {crisis.severity === 'critical' && !crisis.escalated && (
                <button 
                  className="btn btn-sm" 
                  onClick={handleEscalate}
                  style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', border: '1px solid currentColor' }}
                ><FiAlertTriangle size={12} /> Escalate 911</button>
              )}
              {crisis.status === 'assigned' && (
                <button className="btn btn-sm btn-primary" onClick={handleAcknowledge}><FiCheckCircle size={12} /> Acknowledge</button>
              )}
              {['assigned', 'acknowledged'].includes(crisis.status) && (
                <button className="btn btn-sm btn-success" onClick={handleRespond}><FiPlay size={12} /> Respond</button>
              )}
              <button className="btn btn-sm btn-ghost" onClick={() => setShowResolve(true)}><FiCheck size={12} /> Resolve</button>
            </div>
          )}
        </div>

        {crisis.description && (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {crisis.description}
          </p>
        )}

        {crisis.escalation_note && (
          <div style={{
            padding: '8px 14px', borderRadius: 8, marginBottom: 14,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: '0.78rem', color: '#f87171', fontWeight: 600,
          }}>
            {crisis.escalation_note}
          </div>
        )}

        {/* Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <FiMapPin size={13} color="var(--accent-blue)" />
            <span><strong>{crisis.floor}</strong>{crisis.room ? ` / ${crisis.room}` : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <FiUser size={13} color="var(--accent-green)" />
            <span>Reported by: <strong>{crisis.reporter_name || 'Guest'}</strong></span>
          </div>
          {crisis.reporter_phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
              <FiPhone size={13} color="var(--accent-purple)" />
              <span>{crisis.reporter_phone}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <FiClock size={13} color="var(--accent-amber)" />
            <span>{new Date(crisis.created_at).toLocaleString()}</span>
          </div>
          {crisis.assigned_staff_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
              <FiShield size={13} color="var(--accent-cyan)" />
              <span>Assigned: <strong>{crisis.assigned_staff_name}</strong></span>
            </div>
          )}
          {responseSec !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
              <FiClock size={13} color="var(--accent-green)" />
              <span>Response: <strong>{responseSec}s</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Two columns: Timeline + Protocols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
        {/* Timeline */}
        <div className="glass anim-up" style={{ padding: 20, animationDelay: '0.06s' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 14 }}>⏱️ Timeline</h3>
          {(crisis.timeline || []).map((evt, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < crisis.timeline.length - 1 ? 0 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className={`timeline-dot ${evt.actor === 'System' ? 'timeline-dot-critical' : ''}`} />
                {i < crisis.timeline.length - 1 && <div className="timeline-line" />}
              </div>
              <div style={{ paddingBottom: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{evt.event}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
                  {new Date(evt.time).toLocaleTimeString()} · {evt.actor}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Protocols */}
        <div className="glass anim-up" style={{ padding: 20, animationDelay: '0.1s' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 14 }}>📋 Response Protocols</h3>
          {(crisis.protocols || []).map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
              borderBottom: i < crisis.protocols.length - 1 ? '1px solid rgba(75,85,99,0.15)' : 'none',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.68rem', fontWeight: 800, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Notes (if resolved) */}
      {crisis.status === 'resolved' && crisis.resolution_notes && (
        <div className="glass anim-up" style={{ padding: 20, marginTop: 18, borderLeft: '3px solid var(--accent-green)' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiFileText size={14} /> Resolution Notes
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{crisis.resolution_notes}</p>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 8 }}>
            Resolved at: {new Date(crisis.resolved_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* AI Post-Incident Debrief */}
      {crisis.status === 'resolved' && (
        <div className="glass anim-up" style={{ padding: 20, marginTop: 18, borderLeft: '3px solid var(--accent-purple)' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiZap size={14} color="var(--accent-purple)" /> AI Post-Incident Debrief</span>
            {crisis.ai_debrief && (
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => {
                   const blob = new Blob([crisis.ai_debrief], { type: 'text/plain' });
                   const link = document.createElement('a');
                   link.href = URL.createObjectURL(blob);
                   link.download = `Incident_Report_${crisis.type}_${crisis.id.slice(0,6)}.txt`;
                   link.click();
                }}
              >
                <FiDownload size={12} /> Download
              </button>
            )}
          </h3>
          
          {crisis.ai_debrief ? (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: 16,
              borderRadius: 8,
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              maxHeight: 400,
              overflowY: 'auto'
            }}>
              {crisis.ai_debrief}
            </div>
          ) : (
            <div style={{
              padding: 24,
              textAlign: 'center',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px dashed rgba(59, 130, 246, 0.2)',
              borderRadius: 8
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Generate a formal incident report analyzing the timeline, response, and resolution for compliance and review.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateDebrief} 
                disabled={isGenerating}
                style={{ background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
              >
                {isGenerating ? <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <FiZap size={14} />} 
                {isGenerating ? 'Generating...' : 'Generate AI Debrief'}
              </button>
            </div>
          )}
        </div>
      )}


      {/* Resolve Modal */}
      {showResolve && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowResolve(false)}>
          <div className="glass anim-up" style={{ padding: 28, width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14 }}>✅ Resolve Crisis</h3>
            <label className="label">Resolution Notes</label>
            <textarea
              className="input"
              rows={3}
              placeholder="How was this resolved?"
              value={resolveNotes}
              onChange={e => setResolveNotes(e.target.value)}
              style={{ resize: 'vertical', marginTop: 4 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-success" onClick={handleResolve} style={{ flex: 1, justifyContent: 'center' }}>
                <FiCheck size={14} /> Mark Resolved
              </button>
              <button className="btn btn-ghost" onClick={() => setShowResolve(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
