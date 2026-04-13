const { google } = require("googleapis");

/**
 * Authenticates using a service account and returns a Sheets client.
 */
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * Extracts the spreadsheet ID from a full Google Sheets URL or bare ID.
 * Supports: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 */
function extractSpreadsheetId(urlOrId) {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/**
 * Fetches rows from Google Sheets and maps them to the needs schema.
 *
 * Expected sheet columns (row 1 = headers):
 * A: location_name  B: latitude  C: longitude  D: need_type
 * E: description    F: urgency (1-3)  G: families_affected  H: reported_date
 *
 * @param {string} sheetUrlOrId  Full URL or spreadsheet ID
 * @param {string} [range]       Sheet range, defaults to Sheet1!A1:H100
 * @returns {Promise<Array>}     Array of need objects
 */
async function importNeedsFromSheet(sheetUrlOrId, range = "Sheet1!A1:H100") {
  const spreadsheetId = extractSpreadsheetId(sheetUrlOrId);
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return []; // only headers or empty

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => row.length >= 4) // skip empty rows
    .map((row, index) => {
      const get = (key) => {
        const idx = headers.indexOf(key);
        return idx >= 0 ? (row[idx] || "").trim() : "";
      };

      const urgencyRaw = parseInt(get("urgency") || get("urgency_score"), 10);
      const urgency = [1, 2, 3].includes(urgencyRaw) ? urgencyRaw : 2;

      return {
        id: `need_${Date.now()}_${index}`,
        location_name: get("location_name") || get("location") || "Unknown",
        latitude: parseFloat(get("latitude") || get("lat")) || null,
        longitude: parseFloat(get("longitude") || get("lng") || get("lon")) || null,
        need_type: get("need_type") || get("need") || "General",
        description: get("description") || "",
        urgency, // 1 = critical, 2 = moderate, 3 = low
        urgency_label: urgency === 1 ? "Critical" : urgency === 2 ? "Moderate" : "Low",
        families_affected: parseInt(get("families_affected") || get("families"), 10) || 0,
        reported_date: get("reported_date") || get("date") || new Date().toISOString().split("T")[0],
        status: "open",
      };
    });
}

module.exports = { importNeedsFromSheet, extractSpreadsheetId };
