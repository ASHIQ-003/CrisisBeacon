import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Needs ──────────────────────────────────────────────────────────
export const fetchNeeds = (params = {}) =>
  api.get('/needs', { params }).then(r => r.data);

export const fetchNeedById = (id) =>
  api.get(`/needs/${id}`).then(r => r.data);

export const createNeed = (data) =>
  api.post('/needs', data).then(r => r.data);

export const importFromSheets = (sheetUrl, range) =>
  api.post('/needs/import', { sheet_url: sheetUrl, range }).then(r => r.data);

// ── Volunteers ─────────────────────────────────────────────────────
export const fetchVolunteers = () =>
  api.get('/volunteers').then(r => r.data);

export const registerVolunteer = (data) =>
  api.post('/volunteers/register', data).then(r => r.data);

export const fetchVolunteerMatches = (needId) =>
  api.get(`/volunteers/matches/${needId}`).then(r => r.data);

export const fetchAllMatches = () =>
  api.get('/volunteers/matches/all').then(r => r.data);

// ── Assignments ────────────────────────────────────────────────────
export const assignVolunteer = (needId, volunteerId, ngo = null) =>
  api.post('/assign', { need_id: needId, volunteer_id: volunteerId, ngo }).then(r => r.data);

export const fetchAssignments = () =>
  api.get('/assign').then(r => r.data);

export default api;
