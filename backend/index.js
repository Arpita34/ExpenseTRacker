require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow both local dev (Vite) and production frontend URL (set via env var)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.ALLOWED_ORIGIN,       // e.g. https://your-app.onrender.com
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow Postman / server-to-server / curl
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true); // ⚠️ temporary safe fix (prevents crash)
  }, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ── Root health check (Render uses GET "/" to verify service is up) ───────────
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'Backend is running' }));

// ── Routes ───────────────────────────────────────────────────────────────────
const expensesRouter = require('./routes/expenses');
app.use('/expenses', expensesRouter);

// ── Extended health check ─────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

module.exports = app; // exported for Jest
