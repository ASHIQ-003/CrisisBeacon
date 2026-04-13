/**
 * notify.js — Multi-channel notification service for CrisisBeacon.
 *
 * Supports:
 * - Twilio SMS/WhatsApp (when TWILIO_* env vars are set)
 * - Console logging (always)
 *
 * If Twilio credentials are not configured, notifications degrade
 * gracefully to console-only — no crashes.
 */

let twilioClient = null;

function initTwilio() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      console.log('📱 Twilio SMS notifications enabled');
      return true;
    } catch (err) {
      console.log('📱 Twilio package not installed — SMS disabled. Run: npm install twilio');
      return false;
    }
  }
  console.log('📱 Twilio not configured — SMS disabled (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE in .env)');
  return false;
}

/**
 * Send SMS to a staff member about a new crisis assignment.
 */
async function notifyStaffSMS(staffMember, crisis) {
  const message = `🚨 CrisisBeacon Alert!\n\nYou've been assigned to a ${crisis.severity?.toUpperCase()} ${crisis.type?.replace(/_/g, ' ')} crisis.\n📍 Location: ${crisis.floor}${crisis.room ? ' / ' + crisis.room : ''}\n📝 ${crisis.description || 'No description'}\n\nPlease respond immediately.`;

  console.log(`📱 [SMS] → ${staffMember.name} (${staffMember.phone}): ${crisis.type} on ${crisis.floor}`);

  if (twilioClient && staffMember.phone) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: staffMember.phone,
      });
      console.log(`✅ SMS sent to ${staffMember.name}`);
      return { sent: true, channel: 'sms' };
    } catch (err) {
      console.error(`❌ SMS failed for ${staffMember.name}:`, err.message);
      return { sent: false, channel: 'sms', error: err.message };
    }
  }

  return { sent: false, channel: 'none', reason: 'Twilio not configured or no phone number' };
}

/**
 * Send WhatsApp message to a staff member.
 */
async function notifyStaffWhatsApp(staffMember, crisis) {
  const message = `🚨 *CrisisBeacon Alert!*\n\nYou've been assigned to a *${crisis.severity?.toUpperCase()}* _${crisis.type?.replace(/_/g, ' ')}_ crisis.\n📍 *Location:* ${crisis.floor}${crisis.room ? ' / ' + crisis.room : ''}\n📝 ${crisis.description || 'No description'}\n\nPlease respond immediately.`;

  if (twilioClient && staffMember.phone) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_PHONE}`,
        to: `whatsapp:${staffMember.phone}`,
      });
      console.log(`✅ WhatsApp sent to ${staffMember.name}`);
      return { sent: true, channel: 'whatsapp' };
    } catch (err) {
      console.error(`❌ WhatsApp failed for ${staffMember.name}:`, err.message);
      return { sent: false, channel: 'whatsapp', error: err.message };
    }
  }

  return { sent: false, channel: 'none' };
}

// Initialize on load
const twilioReady = initTwilio();

module.exports = { notifyStaffSMS, notifyStaffWhatsApp, twilioReady };
