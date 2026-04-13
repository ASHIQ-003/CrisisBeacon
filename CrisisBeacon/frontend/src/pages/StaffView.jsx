import { useState, useEffect } from 'react';
import { fetchStaff, fetchCrises, acknowledgeCrisis, respondCrisis, resolveCrisis } from '../services/api';
import StaffBadge from '../components/StaffBadge';
import toast from 'react-hot-toast';
import { FiFilter, FiCheckCircle, FiPlay, FiCheck } from 'react-icons/fi';

export default function StaffView({ refreshKey }) {
  const [staff, setStaff] = useState([]);
  const [crises, setCrises] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [staffData, crisesData] = await Promise.all([fetchStaff(), fetchCrises()]);
        setStaff(staffData.staff || []);
        setCrises(crisesData.crises || []);
      } catch (err) {
        console.error('Failed to load staff:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const filtered = roleFilter === 'all' ? staff : staff.filter(s => s.role === roleFilter);
  const roles = [...new Set(staff.map(s => s.role))];

  // Active crises assigned to each staff
  const getStaffCrisis = (staffId) =>
    crises.find(c => c.assigned_to === staffId && ['assigned', 'acknowledged', 'responding'].includes(c.status));

  const handleAcknowledge = async (crisisId, staffId) => {
    try {
      await acknowledgeCrisis(crisisId, staffId);
      toast.success('Crisis acknowledged');
    } catch { toast.error('Failed to acknowledge'); }
  };

  const handleRespond = async (crisisId) => {
    try {
      await respondCrisis(crisisId);
      toast.success('Responding on-site');
    } catch { toast.error('Failed to update'); }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    try {
      await resolveCrisis(resolveModal, resolveNotes);
      toast.success('Crisis resolved! ✅');
      setResolveModal(null);
      setResolveNotes('');
    } catch { toast.error('Failed to resolve'); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>👷 Staff Board</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 4 }}>
            {staff.filter(s => s.status === 'available').length} available · {staff.filter(s => s.status === 'responding').length} responding
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <FiFilter size={13} color="var(--text-dim)" />
          {['all', ...roles].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-ghost'}`}>
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {filtered.map(member => {
          const activeCrisis = getStaffCrisis(member.id);
          return (
            <div key={member.id}>
              <StaffBadge member={member} />
              {activeCrisis && (
                <div className="glass" style={{
                  padding: '12px 16px', marginTop: -1,
                  borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0,
                  borderLeft: `3px solid ${activeCrisis.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>
                    🚨 Assigned: {activeCrisis.type?.replace(/_/g, ' ')} — {activeCrisis.floor}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {activeCrisis.status === 'assigned' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleAcknowledge(activeCrisis.id, member.id)}>
                        <FiCheckCircle size={12} /> Acknowledge
                      </button>
                    )}
                    {['assigned', 'acknowledged'].includes(activeCrisis.status) && (
                      <button className="btn btn-sm btn-success" onClick={() => handleRespond(activeCrisis.id)}>
                        <FiPlay size={12} /> Responding
                      </button>
                    )}
                    <button className="btn btn-sm btn-ghost" onClick={() => setResolveModal(activeCrisis.id)}>
                      <FiCheck size={12} /> Resolve
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setResolveModal(null)}>
          <div className="glass anim-up" style={{ padding: 28, width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14 }}>✅ Resolve Crisis</h3>
            <label className="label">Resolution Notes</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What was done to resolve this?"
              value={resolveNotes}
              onChange={e => setResolveNotes(e.target.value)}
              style={{ resize: 'vertical', marginTop: 4 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-success" onClick={handleResolve} style={{ flex: 1, justifyContent: 'center' }}>
                <FiCheck size={14} /> Mark Resolved
              </button>
              <button className="btn btn-ghost" onClick={() => setResolveModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
