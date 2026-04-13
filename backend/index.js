require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Auto-seed demo data on startup
require("./seed");

const needsRoutes = require("./routes/needs");
const volunteersRoutes = require("./routes/volunteers");
const assignRoutes = require("./routes/assign");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", app: "VolunteerBridge API", version: "1.0.0" });
});

// Routes
app.use("/api/needs", needsRoutes);
app.use("/api/volunteers", volunteersRoutes);
app.use("/api/assign", assignRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`VolunteerBridge API running on http://localhost:${PORT}`);
});
