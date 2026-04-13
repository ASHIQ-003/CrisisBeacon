/**
 * triage.js — Automated Protocol Engine
 *
 * Severity levels: critical | high | medium | low
 * Deterministic rule-based classification based on crisis type, keywords, and cluster detection.
 * Designed for reliability in life-safety scenarios rather than probabilistic AI models.
 */

const CRITICAL_TYPES = ['fire', 'explosion', 'active_threat', 'structural'];
const HIGH_TYPES = ['medical', 'gas_leak', 'flood'];
const MEDIUM_TYPES = ['security', 'power_outage', 'elevator'];
const LOW_TYPES = ['noise', 'suspicious', 'other'];

const CRITICAL_KEYWORDS = [
  'unconscious', 'not breathing', 'gunshot', 'weapon', 'bomb', 'explosion',
  'fire', 'smoke', 'collapse', 'trapped', 'bleeding', 'heart attack', 'stroke',
  'multiple casualties', 'mass', 'active shooter', 'hostage',
];

const HIGH_KEYWORDS = [
  'injured', 'broken', 'chest pain', 'difficulty breathing', 'seizure',
  'allergic', 'choking', 'gas smell', 'flooding', 'water leak',
];

const PROTOCOLS = {
  fire: ['Activate fire alarm on affected floor', 'Evacuate floor immediately', 'Notify fire department', 'Deploy fire extinguisher team'],
  medical: ['Dispatch on-site medic', 'Prepare first aid kit', 'Clear path for stretcher', 'Call ambulance if severe'],
  security: ['Dispatch security team', 'Lock down affected area', 'Review CCTV footage', 'Alert nearby staff'],
  active_threat: ['Initiate lockdown procedure', 'Notify law enforcement immediately', 'Evacuate adjacent areas', 'Activate silent alarm'],
  gas_leak: ['Evacuate floor immediately', 'Shut off gas supply', 'Open ventilation', 'Call gas utility emergency'],
  flood: ['Shut off water main', 'Deploy pumps and sandbags', 'Evacuate lower levels', 'Protect electrical panels'],
  power_outage: ['Switch to backup generators', 'Check elevator entrapments', 'Deploy flashlights to staff', 'Notify electric utility'],
  elevator: ['Communicate with trapped guests', 'Call elevator service company', 'Dispatch maintenance', 'Prepare manual release'],
  structural: ['Evacuate building immediately', 'Call structural engineers', 'Notify emergency services', 'Set up perimeter'],
  explosion: ['Evacuate entire building', 'Call fire and police', 'Initiate triage for casualties', 'Secure perimeter'],
  noise: ['Dispatch security to investigate', 'Check with adjacent rooms', 'Log complaint'],
  suspicious: ['Dispatch security to investigate', 'Review CCTV', 'Do not confront — observe and report'],
  other: ['Dispatch nearest available staff', 'Assess situation on-site', 'Escalate if necessary'],
};

/**
 * Classifies crisis severity and suggests response protocols.
 *
 * @param {string} type - Crisis type (fire, medical, security, etc.)
 * @param {string} description - Free text description from reporter
 * @param {Array} existingCrises - All current crises (for cluster detection)
 * @param {string} floor - Floor where crisis occurred
 * @returns {{ severity, protocols, escalation_note }}
 */
function triageCrisis(type, description = '', existingCrises = [], floor = '') {
  const desc = (description || '').toLowerCase();
  let severity = 'medium';

  // 1. Type-based classification
  if (CRITICAL_TYPES.includes(type)) severity = 'critical';
  else if (HIGH_TYPES.includes(type)) severity = 'high';
  else if (MEDIUM_TYPES.includes(type)) severity = 'medium';
  else if (LOW_TYPES.includes(type)) severity = 'low';

  // 2. Keyword escalation
  if (CRITICAL_KEYWORDS.some(kw => desc.includes(kw))) {
    severity = 'critical';
  } else if (severity !== 'critical' && HIGH_KEYWORDS.some(kw => desc.includes(kw))) {
    severity = 'high';
  }

  // 3. Cluster detection — if 2+ active crises on same floor, escalate
  let escalation_note = null;
  if (floor) {
    const sameFloorActive = existingCrises.filter(
      c => c.floor === floor && ['reported', 'acknowledged', 'responding'].includes(c.status)
    );
    if (sameFloorActive.length >= 2) {
      if (severity !== 'critical') severity = 'critical';
      escalation_note = `⚠️ Cluster detected: ${sameFloorActive.length + 1} incidents on ${floor}. Auto-escalated to CRITICAL.`;
    }
  }

  // 4. Get response protocols
  const protocols = PROTOCOLS[type] || PROTOCOLS.other;

  return { severity, protocols, escalation_note };
}

module.exports = { triageCrisis };
