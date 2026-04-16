const express = require('express');
const router = express.Router();
const { getStaff, getStaffById, updateStaff, getVenue } = require('../store');

/** GET /api/staff — List all staff */
router.get('/', async (req, res) => {
  const staff = await getStaff(req.query);
  res.json({ count: staff.length, staff });
});

/** GET /api/staff/:id */
router.get('/:id', async (req, res) => {
  const member = await getStaffById(req.params.id);
  if (!member) return res.status(404).json({ error: 'Staff not found' });
  res.json({ staff: member });
});

/** PUT /api/staff/:id/status — Update staff status */
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const member = await updateStaff(req.params.id, { status });
  if (!member) return res.status(404).json({ error: 'Staff not found' });
  if (req.io) req.io.emit('staff:updated', member);
  res.json({ message: 'Status updated', staff: member });
});

/** GET /api/venue — Get venue info */
router.get('/venue/info', async (req, res) => {
  const venue = await getVenue();
  if (!venue) return res.status(404).json({ error: 'Venue not configured' });
  res.json({ venue });
});

module.exports = router;
