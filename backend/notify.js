const twilio = require("twilio");

let _client = null;

/**
 * Lazily initializes the Twilio client — avoids crashes if credentials aren't set.
 */
function getClient() {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env");
    }
    _client = twilio(sid, token);
  }
  return _client;
}

const FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

/**
 * Builds a Google Maps link from lat/lng or a location name.
 */
function mapsLink(lat, lon, locationName) {
  if (lat && lon) return `https://maps.google.com/?q=${lat},${lon}`;
  return `https://maps.google.com/?q=${encodeURIComponent(locationName)}`;
}

/**
 * Sends a WhatsApp task assignment notification to a volunteer.
 *
 * @param {Object} volunteer  - { name, phone, ... }
 * @param {Object} need       - { need_type, location_name, latitude, longitude, description, families_affected }
 * @param {Object} [ngo]      - Optional NGO contact { name, phone }
 * @returns {Promise<Object>} - Twilio message SID and status
 */
async function notifyVolunteer(volunteer, need, ngo = null) {
  const toNumber = volunteer.phone.startsWith("whatsapp:")
    ? volunteer.phone
    : `whatsapp:${volunteer.phone}`;

  const location = mapsLink(need.latitude, need.longitude, need.location_name);
  const urgencyEmoji = need.urgency === 1 ? "🔴" : need.urgency === 2 ? "🟡" : "🟢";

  const ngoLine = ngo
    ? `\nNGO contact: ${ngo.name} — ${ngo.phone}`
    : "";

  const body =
    `Hi ${volunteer.name}! 👋\n\n` +
    `You've been matched to a volunteer task on *VolunteerBridge*.\n\n` +
    `${urgencyEmoji} *${need.need_type}*\n` +
    `📍 ${need.location_name}\n` +
    (need.description ? `📝 ${need.description}\n` : "") +
    (need.families_affected ? `👨‍👩‍👧 ${need.families_affected} families need help\n` : "") +
    `\n🗺️ Location: ${location}` +
    ngoLine +
    `\n\nReply *YES* to confirm or *NO* to decline.\n\n` +
    `— VolunteerBridge`;

  const message = await getClient().messages.create({
    from: FROM,
    to: toNumber,
    body,
  });

  return { sid: message.sid, status: message.status };
}

/**
 * Sends a confirmation to the NGO that a volunteer has been assigned.
 *
 * @param {string} ngoPhone   - NGO admin phone number
 * @param {Object} volunteer  - Matched volunteer
 * @param {Object} need       - The need that was assigned
 */
async function notifyNGO(ngoPhone, volunteer, need) {
  const toNumber = ngoPhone.startsWith("whatsapp:") ? ngoPhone : `whatsapp:${ngoPhone}`;

  const body =
    `✅ *VolunteerBridge — Task Assigned*\n\n` +
    `Need: *${need.need_type}* at ${need.location_name}\n` +
    `Volunteer: ${volunteer.name}\n` +
    `Phone: ${volunteer.phone}\n` +
    `Skills: ${(volunteer.skills || []).join(", ")}\n\n` +
    `The volunteer has been notified via WhatsApp.`;

  const message = await getClient().messages.create({
    from: FROM,
    to: toNumber,
    body,
  });

  return { sid: message.sid, status: message.status };
}

module.exports = { notifyVolunteer, notifyNGO };
