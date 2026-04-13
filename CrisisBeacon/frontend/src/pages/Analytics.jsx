import { useState, useEffect } from 'react';
import { fetchAnalytics } from '../services/api';
import StatCard from '../components/StatCard';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiUsers, FiActivity, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
const SEV_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setStats(await fetchAnalytics());
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass" style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: '60px auto' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📊</div>
        <h2 style={{ fontWeight: 700, marginBottom: 6 }}>No Data Yet</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Report some crises to see analytics.</p>
      </div>
    );
  }

  // Prepare chart data
  const byTypeData = Object.entries(stats.by_type || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  const bySeverityData = Object.entries(stats.by_severity || {}).map(([name, value]) => ({ name, value, fill: SEV_COLORS[name] || '#3b82f6' }));
  const byFloorData = Object.entries(stats.by_floor || {}).map(([name, value]) => ({ name, value }));
  const responseTimesData = (stats.response_times || []).map((t, i) => ({ index: i + 1, time: t }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>📊 Analytics</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 4 }}>
          Crisis response performance metrics and trends
        </p>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon={<FiAlertTriangle />} value={stats.total || 0} label="Total Incidents" color="var(--accent-blue)" />
        <StatCard icon={<FiActivity />} value={stats.active || 0} label="Active" color="var(--accent-red)" />
        <StatCard icon={<FiCheckCircle />} value={stats.resolved || 0} label="Resolved" color="var(--accent-green)" />
        <StatCard icon={<FiClock />} value={stats.avg_response_time_sec ? `${stats.avg_response_time_sec}s` : '—'} label="Avg Response Time" color="var(--accent-amber)" />
        <StatCard icon={<FiClock />} value={stats.avg_resolution_time_sec ? `${stats.avg_resolution_time_sec}s` : '—'} label="Avg Resolution Time" color="var(--accent-purple)" />
        <StatCard icon={<FiUsers />} value={`${stats.staff_available || 0}/${stats.staff_total || 0}`} label="Staff Ready" color="var(--accent-cyan)" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Crises by Type */}
        <div className="glass anim-up" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 16 }}>🔥 Crises by Type</h3>
          {byTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byTypeData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: 30 }}>No data</p>
          )}
        </div>

        {/* Severity Breakdown */}
        <div className="glass anim-up" style={{ padding: 20, animationDelay: '0.06s' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 16 }}>🎯 Severity Breakdown</h3>
          {bySeverityData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={bySeverityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {bySeverityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {bySeverityData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.fill }} />
                      <span style={{ fontSize: '0.78rem', textTransform: 'capitalize', fontWeight: 600 }}>{entry.name}</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: 30 }}>No data</p>
          )}
        </div>

        {/* Hotspot Heatmap (by floor) */}
        <div className="glass anim-up" style={{ padding: 20, animationDelay: '0.1s' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 16 }}>🗺️ Incident Hotspots (by Floor)</h3>
          {byFloorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byFloorData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Incidents" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {byFloorData.map((_, i) => <Cell key={i} fill={`hsl(${20 + i * 35}, 75%, 55%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: 30 }}>No data</p>
          )}
        </div>

        {/* Response Time Trend */}
        <div className="glass anim-up" style={{ padding: 20, animationDelay: '0.14s' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 16 }}>⏱️ Response Times (seconds)</h3>
          {responseTimesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={responseTimesData}>
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="index" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="time" name="Response (s)" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTime)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: 30 }}>No data — acknowledge a crisis first</p>
          )}
        </div>
      </div>

      {/* Staff Leaderboard */}
      {stats.staff_performance?.length > 0 && (
        <div className="glass anim-up" style={{ padding: 20, marginTop: 18, animationDelay: '0.18s' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 14 }}>🏆 Staff Response Leaderboard</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Handled</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Avg Response</th>
                </tr>
              </thead>
              <tbody>
                {stats.staff_performance.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(75,85,99,0.1)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{s.role}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{s.crises_handled}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
                      {s.avg_response !== null ? `${s.avg_response}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
