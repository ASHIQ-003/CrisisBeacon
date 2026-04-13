import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000, headers: { 'Content-Type': 'application/json' } });

// Crises
export const fetchCrises = (params = {}) => api.get('/crises', { params }).then(r => r.data);
export const fetchCrisis = (id) => api.get(`/crises/${id}`).then(r => r.data);
export const reportCrisis = (data) => api.post('/crises', data).then(r => r.data);
export const acknowledgeCrisis = (id, staffId) => api.post(`/crises/${id}/acknowledge`, { staff_id: staffId }).then(r => r.data);
export const respondCrisis = (id) => api.post(`/crises/${id}/respond`).then(r => r.data);
export const resolveCrisis = (id, notes) => api.post(`/crises/${id}/resolve`, { notes }).then(r => r.data);
export const escalateCrisis = (id) => api.post(`/crises/${id}/escalate`).then(r => r.data);
export const generateDebrief = (id) => api.post(`/crises/${id}/debrief`).then(r => r.data);

// Staff
export const fetchStaff = (params = {}) => api.get('/staff', { params }).then(r => r.data);
export const fetchVenue = () => api.get('/staff/venue/info').then(r => r.data);

// Analytics
export const fetchAnalytics = () => api.get('/analytics').then(r => r.data);

export default api;
