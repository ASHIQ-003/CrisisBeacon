/**
 * store.js — lightweight in-memory data store for the hackathon.
 * All data resets on server restart. Swap this module for MongoDB/Supabase in production.
 */

const store = {
  needs: [],       // imported from Google Sheets
  volunteers: [],  // registered volunteers
  assignments: [], // task assignments
};

// ── Needs ──────────────────────────────────────────────────────────────────

function setNeeds(needs) {
  store.needs = needs;
}

function getNeeds(filter = {}) {
  let results = [...store.needs];
  if (filter.status) results = results.filter((n) => n.status === filter.status);
  if (filter.urgency) results = results.filter((n) => n.urgency === Number(filter.urgency));
  return results;
}

function getNeedById(id) {
  return store.needs.find((n) => n.id === id) || null;
}

function updateNeedStatus(id, status) {
  const need = store.needs.find((n) => n.id === id);
  if (need) need.status = status;
  return need;
}

function addNeed(need) {
  const entry = {
    ...need,
    id: `need_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: need.status || "open",
    urgency_label: need.urgency === 1 ? "Critical" : need.urgency === 2 ? "Moderate" : "Low",
    reported_date: need.reported_date || new Date().toISOString().split("T")[0],
  };
  store.needs.push(entry);
  return entry;
}

// ── Volunteers ─────────────────────────────────────────────────────────────

function addVolunteer(volunteer) {
  // Prevent duplicate phone numbers
  const existing = store.volunteers.find((v) => v.phone === volunteer.phone);
  if (existing) {
    Object.assign(existing, volunteer);
    return existing;
  }
  const entry = { ...volunteer, id: `vol_${Date.now()}`, tasks_completed: 0, registered_at: new Date().toISOString() };
  store.volunteers.push(entry);
  return entry;
}

function getVolunteers() {
  return [...store.volunteers];
}

function getVolunteerById(id) {
  return store.volunteers.find((v) => v.id === id) || null;
}

function incrementVolunteerTasks(id) {
  const v = store.volunteers.find((v) => v.id === id);
  if (v) v.tasks_completed = (v.tasks_completed || 0) + 1;
}

// ── Assignments ────────────────────────────────────────────────────────────

function addAssignment(needId, volunteerId, notificationSid) {
  const assignment = {
    id: `asgn_${Date.now()}`,
    need_id: needId,
    volunteer_id: volunteerId,
    notification_sid: notificationSid,
    assigned_at: new Date().toISOString(),
    status: "notified",
  };
  store.assignments.push(assignment);
  return assignment;
}

function getAssignments() {
  return [...store.assignments];
}

module.exports = {
  setNeeds, getNeeds, getNeedById, updateNeedStatus, addNeed,
  addVolunteer, getVolunteers, getVolunteerById, incrementVolunteerTasks,
  addAssignment, getAssignments,
};
