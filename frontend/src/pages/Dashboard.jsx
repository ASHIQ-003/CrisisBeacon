import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiUsers, FiActivity, FiUploadCloud, FiPlus, FiSearch } from 'react-icons/fi';
import TaskCard from '../components/TaskCard';
import { fetchNeeds, importFromSheets, fetchVolunteers, fetchAssignments, createNeed } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Create task form
  const [taskForm, setTaskForm] = useState({
    need_type: '', location_name: '', description: '',
    urgency: '1', families_affected: '', latitude: '', longitude: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [needsData, volData, assignData] = await Promise.all([
        fetchNeeds(), fetchVolunteers(), fetchAssignments(),
      ]);
      setNeeds(needsData.needs || []);
      setVolunteers(volData.volunteers || []);
      setAssignments(assignData.assignments || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to connect to backend. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!sheetUrl.trim()) return;
    setImporting(true);
    try {
      const result = await importFromSheets(sheetUrl);
      toast.success(`Imported ${result.count} needs from Google Sheets!`);
      setShowImport(false);
      setSheetUrl('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import from Google Sheets');
    } finally {
      setImporting(false);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!taskForm.need_type.trim() || !taskForm.location_name.trim()) {
      return toast.error('Task type and location are required');
    }
    setCreating(true);
    try {
      await createNeed({
        need_type: taskForm.need_type,
        location_name: taskForm.location_name,
        description: taskForm.description,
        urgency: Number(taskForm.urgency),
        families_affected: taskForm.families_affected ? Number(taskForm.families_affected) : 0,
        latitude: taskForm.latitude ? parseFloat(taskForm.latitude) : null,
        longitude: taskForm.longitude ? parseFloat(taskForm.longitude) : null,
      });
      toast.success('Task created successfully!');
      setShowCreate(false);
      setTaskForm({ need_type: '', location_name: '', description: '', urgency: '1', families_affected: '', latitude: '', longitude: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  }

  const openNeeds = needs.filter(n => n.status === 'open');
  const assignedNeeds = needs.filter(n => n.status === 'assigned');
  const criticalNeeds = needs.filter(n => n.urgency === 1);

  // Filter by urgency/status
  let filtered = filter === 'all' ? needs
    : filter === 'critical' ? needs.filter(n => n.urgency === 1)
    : filter === 'moderate' ? needs.filter(n => n.urgency === 2)
    : filter === 'low' ? needs.filter(n => n.urgency === 3)
    : filter === 'open' ? openNeeds
    : assignedNeeds;

  // Filter by search text
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(n =>
      n.need_type?.toLowerCase().includes(q) ||
      n.location_name?.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q)
    );
  }

  const stats = [
    { label: 'Total Needs', value: needs.length, icon: FiActivity, gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))' },
    { label: 'Critical', value: criticalNeeds.length, icon: FiAlertCircle, gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))' },
    { label: 'Assigned', value: assignedNeeds.length, icon: FiCheckCircle, gradient: 'linear-gradient(135deg, rgba(6,214,160,0.15), rgba(6,214,160,0.05))' },
    { label: 'Volunteers', value: volunteers.length, icon: FiUsers, gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="gradient-bg" style={{ flex: 1, position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            NGO Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Manage community needs, match volunteers, and track assignments.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 28,
        }}>
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="glass-card stat-card animate-fade-in-up"
              style={{ background: s.gradient, animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <s.icon size={20} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Actions */}
        <div className="animate-fade-in-up" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, flexWrap: 'wrap', gap: 12,
          animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards',
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['all', 'critical', 'moderate', 'low', 'open', 'assigned'].map(f => (
              <button
                key={f}
                className={filter === f ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setFilter(f)}
                style={{ padding: '7px 16px', fontSize: '0.8rem', textTransform: 'capitalize' }}
              >
                {f}
              </button>
            ))}
            {/* Search input */}
            <div style={{ position: 'relative', minWidth: 200 }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search tasks…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32, padding: '7px 12px 7px 32px', fontSize: '0.8rem' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FiPlus size={16} /> Create Task
            </button>
            <button className="btn-accent" onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FiUploadCloud size={16} /> Import from Sheets
            </button>
          </div>
        </div>

        {/* Needs Grid */}
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <FiActivity size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>No needs found</p>
            <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
              {search ? 'Try a different search term.' : 'Create a task or import data from Google Sheets.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((need, idx) => (
              <TaskCard
                key={need.id}
                need={need}
                delay={idx}
                onClick={() => navigate(`/needs/${need.id}`)}
              />
            ))}
          </div>
        )}

        {/* Import Modal */}
        {showImport && (
          <div className="modal-overlay" onClick={() => setShowImport(false)}>
            <div
              className="glass-card animate-fade-in-up"
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 500, padding: 32 }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
                Import from Google Sheets
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                Paste the full Google Sheets URL. Make sure the sheet is shared with the service account.
              </p>
              <label className="form-label">Sheet URL</label>
              <input
                className="form-input"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                style={{ marginBottom: 18 }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleImport} disabled={importing}>
                  {importing ? 'Importing…' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div
              className="glass-card animate-fade-in-up"
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 560, padding: 32, maxHeight: '85vh', overflowY: 'auto' }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
                Create New Task
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                Manually add a community need to the system.
              </p>
              <form onSubmit={handleCreateTask}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="form-label">Task Type *</label>
                    <input className="form-input" placeholder="e.g. Food distribution"
                      value={taskForm.need_type} onChange={e => setTaskForm(p => ({ ...p, need_type: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Urgency *</label>
                    <select className="form-input" value={taskForm.urgency}
                      onChange={e => setTaskForm(p => ({ ...p, urgency: e.target.value }))}>
                      <option value="1">🔴 Critical</option>
                      <option value="2">🟡 Moderate</option>
                      <option value="3">🟢 Low</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Location Name *</label>
                  <input className="form-input" placeholder="e.g. Anna Nagar, Chennai"
                    value={taskForm.location_name} onChange={e => setTaskForm(p => ({ ...p, location_name: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" placeholder="Describe the need…" rows={3}
                    value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label className="form-label">Families Affected</label>
                    <input className="form-input" type="number" placeholder="0"
                      value={taskForm.families_affected} onChange={e => setTaskForm(p => ({ ...p, families_affected: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Latitude</label>
                    <input className="form-input" type="number" step="any" placeholder="13.08"
                      value={taskForm.latitude} onChange={e => setTaskForm(p => ({ ...p, latitude: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Longitude</label>
                    <input className="form-input" type="number" step="any" placeholder="80.21"
                      value={taskForm.longitude} onChange={e => setTaskForm(p => ({ ...p, longitude: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? 'Creating…' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
