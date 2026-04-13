require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

// Auto-seed demo data
require('./seed');

const crisesRoutes = require('./routes/crises');
const staffRoutes = require('./routes/staff');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io setup
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST', 'PUT'] },
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Attach io to every request so routes can emit events
app.use((req, res, next) => { req.io = io; next(); });

// Network IP helper for QR codes
const os = require('os');
app.get('/api/network-ip', (req, res) => {
  let ip = 'localhost';
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ip = net.address;
      }
    }
  }
  res.json({ ip });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'CrisisBeacon API', version: '1.0.0' });
});

// Rate Limiting (Anti-Spam / Anti-Prankster)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP
  message: { error: 'Rate limit exceeded. Too many requests.' },
  skip: (req) => req.method === 'GET' // Exempt GET requests so Dashboard polling doesn't trigger 429
});

// Routes
app.use('/api/', apiLimiter);
app.use('/api/crises', crisesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);

// Third-party integrations status
const { twilioReady } = require('./notify');
app.get('/api/integrations', (req, res) => {
  res.json({
    integrations: [
      { name: 'Twilio SMS', status: twilioReady ? 'active' : 'not_configured', description: 'Staff receive SMS alerts when assigned to a crisis' },
      { name: 'Browser Push Notifications', status: 'active', description: 'OS-level alerts when dashboard tab is in background' },
      { name: 'WebSocket (Socket.io)', status: io.engine.clientsCount > 0 ? 'active' : 'ready', clients: io.engine.clientsCount, description: 'Real-time bidirectional updates across all connected devices' },
      { name: 'QR Code API', status: 'active', description: 'Dynamic QR codes for room-specific SOS links (qrserver.com)' },
      { name: 'Web Audio API', status: 'active', description: 'Alert sounds for critical crises' },
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`🚨 CrisisBeacon API running on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket ready on ws://localhost:${PORT}`);
  });
}

module.exports = app;
