const express = require('express');
const router = express.Router();
const { getStats } = require('../store');

/** GET /api/analytics — Get aggregated stats */
router.get('/', (req, res) => {
  const stats = getStats();
  res.json(stats);
});

module.exports = router;
