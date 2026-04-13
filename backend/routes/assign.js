const express = require("express");
const router = express.Router();
const { getNeedById, getVolunteerById, updateNeedStatus, addAssignment, incrementVolunteerTasks } = require("../store");
const { notifyVolunteer, notifyNGO } = require("../notify");

/**
 * POST /api/assign
 * Assigns a volunteer to a need and sends WhatsApp notifications.
 *
 * Body:
 * {
 *   need_id: "need_1234_0",
 *   volunteer_id: "vol_5678",
 *   ngo: { name: "Chennai Care NGO", phone: "+919876500000" }   // optional
 * }
 */
router.post("/", async (req, res, next) => {
  try {
    const { need_id, volunteer_id, ngo } = req.body;

    if (!need_id || !volunteer_id) {
      return res.status(400).json({ error: "need_id and volunteer_id are required" });
    }

    const need = getNeedById(need_id);
    if (!need) return res.status(404).json({ error: "Need not found" });
    if (need.status === "assigned") {
      return res.status(409).json({ error: "This need is already assigned" });
    }

    const volunteer = getVolunteerById(volunteer_id);
    if (!volunteer) return res.status(404).json({ error: "Volunteer not found" });

    // Send WhatsApp to volunteer
    let volunteerNotification = null;
    let ngoNotification = null;

    try {
      volunteerNotification = await notifyVolunteer(volunteer, need, ngo);
    } catch (twilioErr) {
      console.warn("[Twilio] WhatsApp to volunteer failed:", twilioErr.message);
      // Don't block the assignment — log and continue
    }

    // Optionally notify NGO
    if (ngo?.phone) {
      try {
        ngoNotification = await notifyNGO(ngo.phone, volunteer, need);
      } catch (twilioErr) {
        console.warn("[Twilio] WhatsApp to NGO failed:", twilioErr.message);
      }
    }

    // Update store
    updateNeedStatus(need_id, "assigned");
    incrementVolunteerTasks(volunteer_id);
    const assignment = addAssignment(need_id, volunteer_id, volunteerNotification?.sid);

    res.json({
      message: "Volunteer assigned and notified via WhatsApp",
      assignment,
      volunteer_notified: !!volunteerNotification,
      ngo_notified: !!ngoNotification,
      whatsapp_sid: volunteerNotification?.sid || null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/assign
 * Lists all assignments (for NGO dashboard).
 */
router.get("/", (req, res) => {
  const { getAssignments } = require("../store");
  res.json({ assignments: getAssignments() });
});

module.exports = router;
