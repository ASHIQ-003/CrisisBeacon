/**
 * store.js — Persistent data store for CrisisBeacon.
 * Uses @upstash/redis for serverless persistence on Vercel, 
 * with a fallback to in-memory for local zero-setup development.
 */
const { Redis } = require('@upstash/redis');

let kv;
if (process.env.UPSTASH_REDIS_REST_URL) {
  kv = Redis.fromEnv(); // Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
} else if (process.env.KV_REST_API_URL) {
  // Backwards compatibility if they used the standard Vercel Redis preset
  kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

const useKV = !!kv;

const localStore = {
  crises: [],
  staff: [],
  venue: null,
};

// --- Initialization ---
async function bootstrapKV() {
  if (!useKV) return;
  const existingCrises = await kv.get('crises');
  if (!existingCrises) {
    await kv.set('crises', []);
    await kv.set('staff', []);
    await kv.set('venue', null);
  }
}
// Run once on load to ensure arrays exist in KV
bootstrapKV().catch(console.error);

// ── Crises ─────────────────────────────────────────────────────────

async function addCrisis(crisis) {
  if (useKV) {
    const crises = (await kv.get('crises')) || [];
    crises.push(crisis);
    await kv.set('crises', crises);
    return crisis;
  } else {
    localStore.crises.push(crisis);
    return crisis;
  }
}

async function getCrises(filter = {}) {
  let allCrises = [];
  if (useKV) {
    allCrises = (await kv.get('crises')) || [];
  } else {
    allCrises = [...localStore.crises];
  }

  let results = allCrises;
  if (filter.status) results = results.filter(c => c.status === filter.status);
  if (filter.severity) results = results.filter(c => c.severity === filter.severity);
  if (filter.type) results = results.filter(c => c.type === filter.type);
  
  return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function getCrisisById(id) {
  const crises = useKV ? ((await kv.get('crises')) || []) : localStore.crises;
  return crises.find(c => c.id === id) || null;
}

async function updateCrisis(id, updates) {
  if (useKV) {
    const crises = (await kv.get('crises')) || [];
    const index = crises.findIndex(c => c.id === id);
    if (index === -1) return null;
    crises[index] = { ...crises[index], ...updates };
    await kv.set('crises', crises);
    return crises[index];
  } else {
    const crisis = localStore.crises.find(c => c.id === id);
    if (!crisis) return null;
    Object.assign(crisis, updates);
    return crisis;
  }
}

async function addCrisisEvent(crisisId, event) {
  if (useKV) {
    const crises = (await kv.get('crises')) || [];
    const index = crises.findIndex(c => c.id === crisisId);
    if (index === -1) return null;
    if (!crises[index].timeline) crises[index].timeline = [];
    crises[index].timeline.push(event);
    await kv.set('crises', crises);
    return crises[index];
  } else {
    const crisis = localStore.crises.find(c => c.id === crisisId);
    if (!crisis) return null;
    if (!crisis.timeline) crisis.timeline = [];
    crisis.timeline.push(event);
    return crisis;
  }
}

// ── Staff ──────────────────────────────────────────────────────────

async function setStaff(staffList) {
  if (useKV) {
    await kv.set('staff', staffList);
  } else {
    localStore.staff = staffList;
  }
}

async function getStaff(filter = {}) {
  let allStaff = [];
  if (useKV) {
    allStaff = (await kv.get('staff')) || [];
  } else {
    allStaff = [...localStore.staff];
  }

  let results = allStaff;
  if (filter.status) results = results.filter(s => s.status === filter.status);
  if (filter.role) results = results.filter(s => s.role === filter.role);
  return results;
}

async function getStaffById(id) {
  const staffArray = useKV ? ((await kv.get('staff')) || []) : localStore.staff;
  return staffArray.find(s => s.id === id) || null;
}

async function updateStaff(id, updates) {
  if (useKV) {
    const staffArray = (await kv.get('staff')) || [];
    const index = staffArray.findIndex(s => s.id === id);
    if (index === -1) return null;
    staffArray[index] = { ...staffArray[index], ...updates };
    await kv.set('staff', staffArray);
    return staffArray[index];
  } else {
    const member = localStore.staff.find(s => s.id === id);
    if (!member) return null;
    Object.assign(member, updates);
    return member;
  }
}

// ── Venue ──────────────────────────────────────────────────────────

async function setVenue(venue) {
  if (useKV) {
    await kv.set('venue', venue);
  } else {
    localStore.venue = venue;
  }
}

async function getVenue() {
  if (useKV) {
    return await kv.get('venue');
  } else {
    return localStore.venue;
  }
}

// ── Analytics helpers ──────────────────────────────────────────────

async function getStats() {
  const allCrises = useKV ? ((await kv.get('crises')) || []) : localStore.crises;
  const allStaff = useKV ? ((await kv.get('staff')) || []) : localStore.staff;

  const active = allCrises.filter(c => ['reported', 'acknowledged', 'responding'].includes(c.status));
  const resolved = allCrises.filter(c => c.status === 'resolved');
  const critical = allCrises.filter(c => c.severity === 'critical');

  const responseTimes = allCrises
    .filter(c => c.acknowledged_at && c.created_at)
    .map(c => new Date(c.acknowledged_at) - new Date(c.created_at));
  const avgResponseTime = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000)
    : 0;

  const resolutionTimes = resolved
    .filter(c => c.resolved_at && c.created_at)
    .map(c => new Date(c.resolved_at) - new Date(c.created_at));
  const avgResolutionTime = resolutionTimes.length
    ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / 1000)
    : 0;

  const byType = {};
  allCrises.forEach(c => { byType[c.type] = (byType[c.type] || 0) + 1; });

  const bySeverity = {};
  allCrises.forEach(c => { bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1; });

  const byFloor = {};
  allCrises.forEach(c => { byFloor[c.floor || 'unknown'] = (byFloor[c.floor || 'unknown'] || 0) + 1; });

  const staffPerformance = allStaff.map(s => ({
    id: s.id, name: s.name, role: s.role,
    crises_handled: allCrises.filter(c => c.assigned_to === s.id).length,
    avg_response: (() => {
      const times = allCrises
        .filter(c => c.assigned_to === s.id && c.acknowledged_at && c.assigned_at)
        .map(c => new Date(c.acknowledged_at) - new Date(c.assigned_at));
      return times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000) : null;
    })(),
  })).sort((a, b) => b.crises_handled - a.crises_handled);

  return {
    total: allCrises.length,
    active: active.length,
    resolved: resolved.length,
    critical: critical.length,
    staff_available: allStaff.filter(s => s.status === 'available').length,
    staff_total: allStaff.length,
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
  useKV, // export flag for debugging capability
  addCrisis, getCrises, getCrisisById, updateCrisis, addCrisisEvent,
  setStaff, getStaff, getStaffById, updateStaff,
  setVenue, getVenue,
  getStats,
};
