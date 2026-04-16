const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { addCrisis, getCrises, getCrisisById, updateCrisis, addCrisisEvent, getStaff, getStaffById, updateStaff } = require('../store');
const { triageCrisis } = require('../engine/triage');
const { findBestStaff } = require('../engine/assignment');
const { notifyStaffSMS } = require('../notify');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * In-memory rate limiter to prevent spam
 * Limits: 3 requests per 60 seconds per IP
 */
const rateLimitStore = new Map();

/**
 * POST /api/crises
 * Report a new crisis (from Guest SOS or Command Center).
 */
router.post('/', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const timestamps = rateLimitStore.get(ip).filter(t => now - t < 60000); // keep last 60s
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  
  if (timestamps.length > 3) {
    return res.status(429).json({ error: 'Too many requests. Please wait before submitting again.', isRateLimited: true });
  }

  const { type, description, floor, room, reporter_name, reporter_phone, geo_confidence } = req.body;

  if (!type) return res.status(400).json({ error: 'type is required' });

  // Automated Protocol Engine
  const existingCrises = await getCrises();
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
  const staff = await getStaff();
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
    await updateStaff(bestStaff.id, { status: 'responding', current_crisis: crisis.id });
  }

  if (escalation_note) {
    crisis.timeline.push({ event: escalation_note, time: new Date().toISOString(), actor: 'System' });
  }

  await addCrisis(crisis);

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
router.get('/', async (req, res) => {
  const crises = await getCrises(req.query);
  res.json({ count: crises.length, crises });
});

/**
 * GET /api/crises/:id
 */
router.get('/:id', async (req, res) => {
  const crisis = await getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });
  res.json({ crisis });
});

/**
 * POST /api/crises/:id/acknowledge
 * Staff acknowledges the crisis.
 */
router.post('/:id/acknowledge', async (req, res) => {
  const { staff_id } = req.body;
  const crisis = await getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  const staffMember = staff_id ? await getStaffById(staff_id) : null;
  const staffName = staffMember?.name || 'Staff';

  const updates = {
    status: 'acknowledged',
    acknowledged_at: new Date().toISOString(),
  }

  if (staff_id && !crisis.assigned_to) {
    updates.assigned_to = staff_id;
    updates.assigned_staff_name = staffName;
    updates.assigned_at = new Date().toISOString();
    if (staffMember) await updateStaff(staff_id, { status: 'responding', current_crisis: crisis.id });
  }

  const updatedCrisis = await updateCrisis(crisis.id, updates);

  await addCrisisEvent(crisis.id, {
    event: `Acknowledged by ${staffName}`,
    time: new Date().toISOString(),
    actor: staffName,
  });

  // Re-fetch to emit updated state
  const finalCrisis = await getCrisisById(crisis.id);
  if (req.io) req.io.emit('crisis:updated', finalCrisis);
  res.json({ message: 'Crisis acknowledged', crisis: finalCrisis });
});

/**
 * POST /api/crises/:id/respond
 * Staff marks they are actively responding.
 */
router.post('/:id/respond', async (req, res) => {
  const crisis = await getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  await updateCrisis(crisis.id, { status: 'responding' });
  const staffName = crisis.assigned_staff_name || 'Staff';

  await addCrisisEvent(crisis.id, {
    event: `${staffName} is responding on-site`,
    time: new Date().toISOString(),
    actor: staffName,
  });

  const finalCrisis = await getCrisisById(crisis.id);
  if (req.io) req.io.emit('crisis:updated', finalCrisis);
  res.json({ message: 'Responding', crisis: finalCrisis });
});

/**
 * POST /api/crises/:id/escalate
 * Escalate to external 911 / EMS.
 */
router.post('/:id/escalate', async (req, res) => {
  const crisis = await getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  await updateCrisis(crisis.id, { escalated: true });
  
  await addCrisisEvent(crisis.id, {
    event: `🚨 Automated Dispatch sent to Local 911 Authorities`,
    time: new Date().toISOString(),
    actor: 'System (911 Dispatch)',
  });

  const finalCrisis = await getCrisisById(crisis.id);
  if (req.io) req.io.emit('crisis:updated', finalCrisis);
  res.json({ message: 'Escalated to 911', crisis: finalCrisis });
});

/**
 * POST /api/crises/:id/resolve
 * Mark the crisis as resolved.
 */
router.post('/:id/resolve', async (req, res) => {
  const { notes } = req.body;
  const crisis = await getCrisisById(req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis not found' });

  await updateCrisis(crisis.id, {
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolution_notes: notes || '',
  });

  const staffName = crisis.assigned_staff_name || 'Staff';

  // Free up the assigned staff
  if (crisis.assigned_to) {
    const member = await getStaffById(crisis.assigned_to);
    if (member) {
      const updatedStaff = await updateStaff(crisis.assigned_to, {
        status: 'available',
        current_crisis: null,
        crises_handled: (member.crises_handled || 0) + 1,
      });
      if (req.io) req.io.emit('staff:updated', updatedStaff);
    }
  }

  await addCrisisEvent(crisis.id, {
    event: `Crisis resolved by ${staffName}${notes ? ': ' + notes : ''}`,
    time: new Date().toISOString(),
    actor: staffName,
  });

  const finalCrisis = await getCrisisById(crisis.id);
  if (req.io) req.io.emit('crisis:resolved', finalCrisis);
  res.json({ message: 'Crisis resolved', crisis: finalCrisis });
});

/**
 * POST /api/crises/:id/debrief
 * Generates an AI post-incident report.
 */
router.post('/:id/debrief', async (req, res) => {
  const crisis = await getCrisisById(req.params.id);
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
    
    await updateCrisis(crisis.id, { ai_debrief: text });

    const finalCrisis = await getCrisisById(crisis.id);
    if (req.io) req.io.emit('crisis:updated', finalCrisis);
    res.json({ message: 'Debrief generated', debrief: text });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate AI debrief' });
  }
});

module.exports = router;
