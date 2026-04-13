/**
 * assignment.js — Auto-assigns the best-matched staff member to a crisis.
 *
 * Matching criteria:
 * 1. Role match (security for security crises, medical for medical, etc.)
 * 2. Availability (only 'available' staff)
 * 3. Floor proximity (same floor preferred)
 */

const ROLE_MAP = {
  fire: ['maintenance', 'security', 'management'],
  medical: ['medical', 'security', 'management'],
  security: ['security', 'management'],
  active_threat: ['security', 'management'],
  gas_leak: ['maintenance', 'security', 'management'],
  flood: ['maintenance', 'security'],
  power_outage: ['maintenance', 'management'],
  elevator: ['maintenance', 'management'],
  structural: ['security', 'management', 'maintenance'],
  explosion: ['security', 'management', 'medical'],
  noise: ['security'],
  suspicious: ['security'],
  other: ['security', 'management', 'maintenance'],
};

/**
 * Finds the best available staff member for a crisis.
 *
 * @param {string} crisisType - Type of crisis
 * @param {string} crisisFloor - Floor where crisis occurred
 * @param {Array} staff - All staff members
 * @returns {Object|null} Best matched staff member, or null if none available
 */
function findBestStaff(crisisType, crisisFloor, staff) {
  const preferredRoles = ROLE_MAP[crisisType] || ROLE_MAP.other;
  const available = staff.filter(s => s.status === 'available');

  if (available.length === 0) return null;

  // Score each available staff member
  const scored = available.map(s => {
    let score = 0;

    // Role match: higher score for preferred roles
    const roleIdx = preferredRoles.indexOf(s.role);
    if (roleIdx === 0) score += 30;
    else if (roleIdx === 1) score += 20;
    else if (roleIdx >= 2) score += 10;

    // Floor proximity
    if (s.floor === crisisFloor) score += 25;
    else {
      // Approximate proximity by floor number difference
      const crisisFloorNum = parseInt(crisisFloor?.replace(/\D/g, '') || '0');
      const staffFloorNum = parseInt(s.floor?.replace(/\D/g, '') || '0');
      const diff = Math.abs(crisisFloorNum - staffFloorNum);
      if (diff <= 1) score += 15;
      else if (diff <= 3) score += 5;
    }

    // Experience bonus
    score += Math.min((s.crises_handled || 0) * 2, 10);

    return { staff: s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.staff || null;
}

module.exports = { findBestStaff };
