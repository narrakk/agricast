require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// ─── Validate environment variables at startup ───────────────────────────────
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missing = required.filter(key => !process.env[key] || process.env[key].includes('PASTE_YOUR'));
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('Open backend\\.env and fill in your Supabase credentials from supabase.com');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
// Security: Restrict CORS to known origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Global Rate Limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

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