const express = require("express");
const router = express.Router();
const { importNeedsFromSheet } = require("../sheets");
const { setNeeds, getNeeds, getNeedById, addNeed } = require("../store");
const { matchVolunteersToNeed } = require("../matcher");
const { getVolunteers } = require("../store");

/**
 * POST /api/needs
 * Manually create a single need from the dashboard.
 * Body: { location_name, latitude, longitude, need_type, description, urgency, families_affected }
 */
router.post("/", (req, res) => {
  const { location_name, latitude, longitude, need_type, description, urgency, families_affected } = req.body;

  if (!need_type) return res.status(400).json({ error: "need_type is required" });
  if (!location_name) return res.status(400).json({ error: "location_name is required" });

  const need = addNeed({
    location_name: location_name.trim(),
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    need_type: need_type.trim(),
    description: (description || "").trim(),
    urgency: [1, 2, 3].includes(Number(urgency)) ? Number(urgency) : 2,
    families_affected: parseInt(families_affected, 10) || 0,
  });

  res.status(201).json({ message: "Need created", need });
});

/**
 * POST /api/needs/import
 * Body: { sheet_url: "https://docs.google.com/spreadsheets/d/..." }
 * Imports community needs from a Google Sheet into the in-memory store.
 */
router.post("/import", async (req, res, next) => {
  try {
    const { sheet_url, range } = req.body;
    if (!sheet_url) return res.status(400).json({ error: "sheet_url is required" });

    const needs = await importNeedsFromSheet(sheet_url, range);
    setNeeds(needs);

    res.json({
      message: `Imported ${needs.length} needs from Google Sheets`,
      count: needs.length,
      needs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/needs
 * Query params: ?status=open&urgency=1
 * Returns all needs, optionally filtered.
 */
router.get("/", (req, res) => {
  const needs = getNeeds(req.query);
  // Sort: critical first, then by families_affected descending
  const sorted = needs.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency - b.urgency;
    return b.families_affected - a.families_affected;
  });
  res.json({ count: sorted.length, needs: sorted });
});

/**
 * GET /api/needs/:id
 * Returns a single need with top 3 volunteer matches.
 */
router.get("/:id", (req, res) => {
  const need = getNeedById(req.params.id);
  if (!need) return res.status(404).json({ error: "Need not found" });

  const volunteers = getVolunteers();
  const matches = matchVolunteersToNeed(need, volunteers, 3);

  res.json({ need, matches });
});

module.exports = router;
