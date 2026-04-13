/**
 * store.js — In-memory data store for CrisisBeacon.
 * Holds crises, staff, and event timelines.
 */

const store = {
  crises: [],
  staff: [],
  venue: null,
};

// ── Crises ─────────────────────────────────────────────────────────
function addCrisis(crisis) {
  store.crises.push(crisis);
  return crisis;
}

function getCrises(filter = {}) {
  let results = [...store.crises];
  if (filter.status) results = results.filter(c => c.status === filter.status);
  if (filter.severity) results = results.filter(c => c.severity === filter.severity);
  if (filter.type) results = results.filter(c => c.type === filter.type);
  // Sort: newest first
  return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getCrisisById(id) {
  return store.crises.find(c => c.id === id) || null;
}

function updateCrisis(id, updates) {
  const crisis = store.crises.find(c => c.id === id);
  if (!crisis) return null;
  Object.assign(crisis, updates);
  return crisis;
}

function addCrisisEvent(crisisId, event) {
  const crisis = store.crises.find(c => c.id === crisisId);
  if (!crisis) return null;
  if (!crisis.timeline) crisis.timeline = [];
  crisis.timeline.push(event);
  return crisis;
}

// ── Staff ──────────────────────────────────────────────────────────
function setStaff(staffList) {
  store.staff = staffList;
}

function getStaff(filter = {}) {
  let results = [...store.staff];
  if (filter.status) results = results.filter(s => s.status === filter.status);
  if (filter.role) results = results.filter(s => s.role === filter.role);
  return results;
}

function getStaffById(id) {
  return store.staff.find(s => s.id === id) || null;
}

function updateStaff(id, updates) {
  const member = store.staff.find(s => s.id === id);
  if (!member) return null;
  Object.assign(member, updates);
  return member;
}

// ── Venue ──────────────────────────────────────────────────────────
function setVenue(venue) {
  store.venue = venue;
}

function getVenue() {
  return store.venue;
}

// ── Analytics helpers ──────────────────────────────────────────────
function getStats() {
  const all = store.crises;
  const active = all.filter(c => ['reported', 'acknowledged', 'responding'].includes(c.status));
  const resolved = all.filter(c => c.status === 'resolved');
  const critical = all.filter(c => c.severity === 'critical');

  // Average response time (ms from reported → acknowledged)
  const responseTimes = all
    .filter(c => c.acknowledged_at && c.created_at)
    .map(c => new Date(c.acknowledged_at) - new Date(c.created_at));
  const avgResponseTime = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000)
    : 0;

  // Average resolution time
  const resolutionTimes = resolved
    .filter(c => c.resolved_at && c.created_at)
    .map(c => new Date(c.resolved_at) - new Date(c.created_at));
  const avgResolutionTime = resolutionTimes.length
    ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / 1000)
    : 0;

  // By type
  const byType = {};
  all.forEach(c => { byType[c.type] = (byType[c.type] || 0) + 1; });

  // By severity
  const bySeverity = {};
  all.forEach(c => { bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1; });

  // By floor
  const byFloor = {};
  all.forEach(c => { byFloor[c.floor || 'unknown'] = (byFloor[c.floor || 'unknown'] || 0) + 1; });

  // Staff performance
  const staffPerformance = store.staff.map(s => ({
    id: s.id, name: s.name, role: s.role,
    crises_handled: all.filter(c => c.assigned_to === s.id).length,
    avg_response: (() => {
      const times = all
        .filter(c => c.assigned_to === s.id && c.acknowledged_at && c.assigned_at)
        .map(c => new Date(c.acknowledged_at) - new Date(c.assigned_at));
      return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000) : null;
    })(),
  })).sort((a, b) => b.crises_handled - a.crises_handled);

  return {
    total: all.length,
    active: active.length,
    resolved: resolved.length,
    critical: critical.length,
    staff_available: store.staff.filter(s => s.status === 'available').length,
    staff_total: store.staff.length,
    avg_response_time_sec: avgResponseTime,
    avg_resolution_time_sec: avgResolutionTime,
    by_type: byType,
    by_severity: bySeverity,
    by_floor: byFloor,
    staff_performance: staffPerformance,
    response_times: responseTimes.map(t => Math.round(t / 1000)),
  };
}

module.exports = {
  addCrisis, getCrises, getCrisisById, updateCrisis, addCrisisEvent,
  setStaff, getStaff, getStaffById, updateStaff,
  setVenue, getVenue,
  getStats,
};
