require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ─── Validate environment variables at startup ───────────────────────────────
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missing = required.filter(key => !process.env[key] || process.env[key].includes('PASTE_YOUR'));
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('Open backend\\.env and fill in your Supabase credentials from supabase.com');
  // process.exit(1); // Temporarily disabled for Phase 2 verification
}

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check endpoint ────────────────────────────────────────────────────
// Important: Render's free tier spins down with inactivity.
// Use UptimeRobot (free) to ping this endpoint every 5 minutes to keep it awake.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AgriCast API',
    version: '1.0.0'
  });
});

// ─── Route placeholder (filled in later phases) ──────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'AgriCast API is running. See /health for status.' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const weatherRoutes = require('./src/routes/weather');
const mapRoutes = require('./src/routes/mapLayers');
app.use('/api/weather', weatherRoutes);
app.use('/api/map', mapRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ AgriCast API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});