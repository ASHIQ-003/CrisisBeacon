const express = require("express");
const router = express.Router();
const { addVolunteer, getVolunteers, getVolunteerById } = require("../store");
const { matchAllNeeds, matchVolunteersToNeed } = require("../matcher");
const { getNeeds, getNeedById } = require("../store");

/**
 * POST /api/volunteers/register
 * Registers a new volunteer.
 *
 * Body:
 * {
 *   name: "Priya Subramaniam",
 *   phone: "+919876543210",
 *   skills: ["food distribution", "cooking"],
 *   latitude: 13.085,
 *   longitude: 80.217,
 *   availability: "available",   // "available" | "scheduled" | "unavailable"
 *   language: "ta"               // "en" | "ta" | "hi"
 * }
 */
router.post("/register", (req, res) => {
  const { name, phone, skills, latitude, longitude, availability, language } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "name and phone are required" });
  }
  if (!phone.match(/^\+?[1-9]\d{7,14}$/)) {
    return res.status(400).json({ error: "phone must be a valid international number, e.g. +919876543210" });
  }

  const volunteer = addVolunteer({
    name: name.trim(),
    phone: phone.trim(),
    skills: Array.isArray(skills) ? skills : [],
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    availability: availability || "available",
    language: language || "en",
  });

  res.status(201).json({ message: "Volunteer registered", volunteer });
});

/**
 * GET /api/volunteers
 * Lists all registered volunteers.
 */
router.get("/", (req, res) => {
  const volunteers = getVolunteers();
  res.json({ count: volunteers.length, volunteers });
});

/**
 * GET /api/volunteers/matches/all
 * Returns top 3 volunteer matches for every open need.
 * IMPORTANT: This must be defined BEFORE /:id to avoid Express matching "matches" as an id.
 */
router.get("/matches/all", (req, res) => {
  const needs = getNeeds({ status: "open" });
  const volunteers = getVolunteers();
  const matches = matchAllNeeds(needs, volunteers, 3);
  res.json({ matches });
});

/**
 * GET /api/volunteers/matches/:needId
 * Returns top 3 volunteer matches for a specific need.
 */
router.get("/matches/:needId", (req, res) => {
  const need = getNeedById(req.params.needId);
  if (!need) return res.status(404).json({ error: "Need not found" });

  const volunteers = getVolunteers();
  const matches = matchVolunteersToNeed(need, volunteers, 3);
  res.json({ need_id: need.id, matches });
});

/**
 * GET /api/volunteers/:id
 */
router.get("/:id", (req, res) => {
  const volunteer = getVolunteerById(req.params.id);
  if (!volunteer) return res.status(404).json({ error: "Volunteer not found" });
  res.json({ volunteer });
});

module.exports = router;
