const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { addCrisis, getCrises, getCrisisById, updateCrisis, addCrisisEvent, getStaff, getStaffById, updateStaff } = require('../store');
const { triageCrisis } = require('../engine/triage');
const { findBestStaff } = require('../engine/assignment');
const { notifyStaffSMS } = require('../notify');
const { GoogleGenerativeAI } = require('@google/generative-ai');


/**
 * POST /api/crises
 * Report a new crisis (from Guest SOS or Command Center).
 */
router.post('/', (req, res) => {
  const { type, description, floor, room, reporter_name, reporter_phone, geo_confidence } = req.body;

  if (!type) return res.status(400).json({ error: 'type is required' });

  // Smart triage
  const existingCrises = getCrises();
  const { severity, protocols, escalation_note } = triageCrisis(type, description, existingCrises, floor);

  const crisis = {
    id: uuidv4(),
    type,
    description: description || '',
    floor: floor || 'Unknown',
    room: room || '',
    reporter_name: reporter_name || 'Guest',
    reporter_phone: reporter_phone || '',
    geo_confidence: geo_confidence !== undefined ? geo_confidence : 40,
    severity,
    protocols,
    escalation_note,
    status: 'reported',
    assigned_to: null,
    assigned_staff_name: null,
    created_at: new Date().toISOString(),
    acknowledged_at: null,
    assigned_at: null,
    resolved_at: null,
    resolution_notes: '',
    timeline: [
      { event: 'Crisis reported', time: new Date().toISOString(), actor: reporter_name || 'Guest' },
    ],
  };

  // Auto-assign best available staff
  const staff = getStaff();
  const bestStaff = findBestStaff(type, floor, staff);
  if (bestStaff) {
    crisis.assigned_to = bestStaff.id;
    crisis.assigned_staff_name = bestStaff.name;
    crisis.assigned_at = new Date().toISOString();
    crisis.status = 'assigned';
    crisis.timeline.push({
      event: `Auto-assigned to ${bestStaff.name} (${bestStaff.role})`,
      time: new Date().toISOString(),
      actor: 'System',
    });
    updateStaff(bestStaff.id, { status: 'responding', current_crisis: crisis.id });
  }

  if (escalation_note) {
    crisis.timeline.push({ event: escalation_note, time: new Date().toISOString(), actor: 'System' });
  }

  addCrisis(crisis);

  // Emit via Socket.io (attached to req by middleware)
  if (req.io) {
    req.io.emit('crisis:new', crisis);
    if (bestStaff) {
      req.io.emit('staff:updated', { id: bestStaff.id, status: 'responding', current_crisis: crisis.id });
    }
  }

  // Send SMS notification to assigned staff (async, non-blocking)
  if (bestStaff) {
    notifyStaffSMS(bestStaff, crisis).catch(err => console.error('SMS notification error:', err));
  }

  res.status(201).json({ message: 'Crisis reported', crisis });
});

/**
 * GET /api/crises
 * List all crises, optionally filtered.
 */
router.get('/', (req, res) => {
  const crises = getCrises(req.query);
  res.json({ count: crises.length, crises });
});

/**
 * GET /api/crises/:id
 */
router.get('/:id', (req, res) => {
  const crisis = getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });
  res.json({ crisis });
});

/**
 * POST /api/crises/:id/acknowledge
 * Staff acknowledges the crisis.
 */
router.post('/:id/acknowledge', (req, res) => {
  const { staff_id } = req.body;
  const crisis = getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  const staffMember = staff_id ? getStaffById(staff_id) : null;
  const staffName = staffMember?.name || 'Staff';

  crisis.status = 'acknowledged';
  crisis.acknowledged_at = new Date().toISOString();
  if (staff_id && !crisis.assigned_to) {
    crisis.assigned_to = staff_id;
    crisis.assigned_staff_name = staffName;
    crisis.assigned_at = new Date().toISOString();
    if (staffMember) updateStaff(staff_id, { status: 'responding', current_crisis: crisis.id });
  }

  addCrisisEvent(crisis.id, {
    event: `Acknowledged by ${staffName}`,
    time: new Date().toISOString(),
    actor: staffName,
  });

  if (req.io) req.io.emit('crisis:updated', crisis);
  res.json({ message: 'Crisis acknowledged', crisis });
});

/**
 * POST /api/crises/:id/respond
 * Staff marks they are actively responding.
 */
router.post('/:id/respond', (req, res) => {
  const crisis = getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  crisis.status = 'responding';
  const staffName = crisis.assigned_staff_name || 'Staff';

  addCrisisEvent(crisis.id, {
    event: `${staffName} is responding on-site`,
    time: new Date().toISOString(),
    actor: staffName,
  });

  if (req.io) req.io.emit('crisis:updated', crisis);
  res.json({ message: 'Responding', crisis });
});

/**
 * POST /api/crises/:id/escalate
 * Escalate to external 911 / EMS.
 */
router.post('/:id/escalate', (req, res) => {
  const crisis = getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  crisis.escalated = true;
  
  addCrisisEvent(crisis.id, {
    event: `🚨 Automated Dispatch sent to Local 911 Authorities`,
    time: new Date().toISOString(),
    actor: 'System (911 Dispatch)',
  });

  if (req.io) req.io.emit('crisis:updated', crisis);
  res.json({ message: 'Escalated to 911', crisis });
});

/**
 * POST /api/crises/:id/resolve
 * Mark the crisis as resolved.
 */
router.post('/:id/resolve', (req, res) => {
  const { notes } = req.body;
  const crisis = getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  crisis.status = 'resolved';
  crisis.resolved_at = new Date().toISOString();
  crisis.resolution_notes = notes || '';

  const staffName = crisis.assigned_staff_name || 'Staff';

  // Free up the assigned staff
  if (crisis.assigned_to) {
    const member = getStaffById(crisis.assigned_to);
    if (member) {
      updateStaff(crisis.assigned_to, {
        status: 'available',
        current_crisis: null,
        crises_handled: (member.crises_handled || 0) + 1,
      });
      if (req.io) req.io.emit('staff:updated', { id: member.id, status: 'available', current_crisis: null });
    }
  }

  addCrisisEvent(crisis.id, {
    event: `Crisis resolved by ${staffName}${notes ? ': ' + notes : ''}`,
    time: new Date().toISOString(),
    actor: staffName,
  });

  if (req.io) req.io.emit('crisis:resolved', crisis);
  res.json({ message: 'Crisis resolved', crisis });
});

/**
 * POST /api/crises/:id/debrief
 * Generates an AI post-incident report.
 */
router.post('/:id/debrief', async (req, res) => {
  const crisis = getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });
  if (crisis.status !== 'resolved') return res.status(400).json({ error: 'Crisis must be resolved to generate a debrief' });
  
  if (crisis.ai_debrief) {
    return res.json({ message: 'Debrief already exists', debrief: crisis.ai_debrief });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in .env' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const timelineText = (crisis.timeline || []).map(t => `- [${new Date(t.time).toLocaleTimeString()}] ${t.actor}: ${t.event}`).join('\n');
    
    const prompt = `
You are an expert Incident Response Analyst. Generate a professional, concise, plain-text Post-Incident Debrief based on the following crisis log.
Do NOT use markdown. Use simple, readable formatting with clear sections.

CRISIS DETAILS:
Type: ${crisis.type}
Severity: ${crisis.severity}
Location: ${crisis.floor} / Room ${crisis.room || 'N/A'}
Reporter: ${crisis.reporter_name}
Assigned Staff: ${crisis.assigned_staff_name}
Total Response Time: ${crisis.acknowledged_at && crisis.created_at ? Math.round((new Date(crisis.acknowledged_at) - new Date(crisis.created_at)) / 1000) : 'N/A'} seconds
Resolution Notes: ${crisis.resolution_notes}

TIMELINE:
${timelineText}

Please structure the report with:
- INCIDENT SUMMARY
- RESPONSE TIMELINE ANALYSIS
- ROOT CAUSE / ACTIONS TAKEN
- FUTURE RECOMMENDATIONS
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    crisis.ai_debrief = text;

    if (req.io) req.io.emit('crisis:updated', crisis);
    res.json({ message: 'Debrief generated', debrief: text });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate AI debrief' });
  }
});

module.exports = router;
