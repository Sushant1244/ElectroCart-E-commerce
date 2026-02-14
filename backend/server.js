require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { DataTypes } = require('sequelize');
const app = express();

// Vercel serverless support
const vel = require('@vercel/express');

// Safety check: do not allow ALLOW_UNVERIFIED_ORDERS in production
if (process.env.NODE_ENV === 'production' && (process.env.ALLOW_UNVERIFIED_ORDERS || '').toLowerCase() === 'true') {
  console.error('ALERT: ALLOW_UNVERIFIED_ORDERS=true is not permitted in production. Disable this flag and restart.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const uploadsRoutes = require('./routes/uploads');
const paymentsRoutes = require('./routes/payments');
const notificationsRoutes = require('./routes/notifications');
const inquiriesRoutes = require('./routes/inquiries');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');
const pgConfig = require('./config/sequelize');
let pgProductsRouter = null;
// Only initialize Postgres when running the server directly. This avoids
// starting background DB connections during tests which can leave open handles.
if (require.main === module) {
  // If Sequelize/PG is configured, attempt to authenticate and optionally sync schema
  if (pgConfig && pgConfig.sequelize) {
    const { sequelize } = pgConfig;
    (async () => {
      try {
        await sequelize.authenticate();
        console.log('Postgres (Sequelize) connected');
        // In development, allow automatic schema sync when PG_SYNC env var is truthy
        if (process.env.PG_SYNC === 'true') {
          await sequelize.sync({ alter: true });
          console.log('Postgres schema synchronized (alter)');
        } else {
          console.log('Postgres schema not synchronized automatically. To auto-create tables in dev set PG_SYNC=true and restart the server.');
        }
        // Convenience: if running locally (not production), ensure the `reviews` table exists
        // This helps devs who have Postgres configured but haven't run migrations yet.
        try {
          if (process.env.NODE_ENV !== 'production' && pgConfig && pgConfig.Review) {
            const qi = sequelize.getQueryInterface();
            const tables = await qi.showAllTables();
            // showAllTables can return array of objects or strings depending on dialect/config
            const tableNames = (tables || []).map(t => (typeof t === 'string' ? t : (t.tableName || t.name))).map(n => String(n).toLowerCase());
            if (!tableNames.includes('reviews')) {
              console.log('`reviews` table missing — creating via Review.sync() (development only)');
              await pgConfig.Review.sync({ alter: true });
              console.log('`reviews` table created/updated');
            }
          }
        } catch (e) {
          console.warn('Failed to auto-create `reviews` table (dev helper):', e && e.message ? e.message : e);
        }
        // Ensure email verification columns exist (safe to run in dev/production)
        try {
          const qi = sequelize.getQueryInterface();
          const usersDesc = await qi.describeTable('users').catch(() => null);
          if (usersDesc) {
            if (!usersDesc.emailVerified) {
              await qi.addColumn('users', 'emailVerified', { type: DataTypes.BOOLEAN, defaultValue: false });
              console.log('Added column users.emailVerified');
            }
            if (!usersDesc.emailVerificationToken) {
              await qi.addColumn('users', 'emailVerificationToken', { type: DataTypes.STRING });
              console.log('Added column users.emailVerificationToken');
            }
            if (!usersDesc.emailVerificationExpire) {
              await qi.addColumn('users', 'emailVerificationExpire', { type: DataTypes.BIGINT });
              console.log('Added column users.emailVerificationExpire');
            }
          }
        } catch (e) {
          console.warn('Failed to ensure email verification columns:', e && e.message ? e.message : e);
        }
      } catch (err) {
        console.error('Sequelize connection failed:', err.message || err);
      }
    })();

    try {
      const pgProductsFactory = require('./routes/pgProducts');
      pgProductsRouter = pgProductsFactory(pgConfig);
    } catch (err) {
      console.error('Failed to load PG routes', err.message);
    }
  }
}

const PORT = process.env.PORT || 5001;
// MongoDB support has been removed; use POSTGRES_URL to enable Postgres.

// Enable CORS: in production use CLIENT_URL, in development allow localhost on common dev ports
// For local debugging you can set DEV_ALLOW_ALL_ORIGINS=true in backend/.env to allow any origin
if (process.env.NODE_ENV === 'production') {
  // In Vercel monorepo, frontend and backend are on same domain, so allow request origin
  app.use(cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server) or same-origin requests
      if (!origin) return cb(null, true);
      // Allow any origin on the same Vercel domain (including preview deployments)
      // Also allow explicitly configured CLIENT_URL
      const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
      const isAllowed = allowedOrigins.some(allowed => 
        allowed && (origin === allowed || origin.endsWith('.' + allowed) || origin.endsWith('-' + allowed))
      ) || origin.includes('vercel.app') || origin.includes('vercel-storage.com');
      if (isAllowed) return cb(null, true);
      // For same-domain requests (frontend calling backend on same Vercel app)
      return cb(null, true);
    },
    credentials: true
  }));
  } else {
    if (process.env.DEV_ALLOW_ALL_ORIGINS === 'true') {
      // Allow all origins for quick local debugging (mirrors request Origin header)
      app.use(cors({ origin: true, credentials: true }));
    } else {
      const allowedLocalOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:3001'
      ];
      app.use(cors({
        origin: (origin, cb) => {
          // Allow requests with no origin like curl or server-to-server
          if (!origin) return cb(null, true);
          // Allow explicit allowedLocalOrigins, any localhost:port and 127.0.0.1:port, and IPv6 loopback
          if (
            allowedLocalOrigins.includes(origin) ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('http://[::1]:')
          ) return cb(null, true);
          return cb(new Error('Not allowed by CORS'), false);
        },
        credentials: true
      }));
    }
}

// Parse JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight request logger to help reproduce and capture incoming requests in dev
app.use((req, res, next) => {
  try {
    const remote = req.ip || req.connection?.remoteAddress || 'unknown';
    console.log(`[req] ${new Date().toISOString()} - ${req.method} ${req.originalUrl} from ${remote}`);
  } catch (e) {
    // avoid crashing the app if logging fails
  }
  return next();
});

// Serve uploaded files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes BEFORE the catch-all for frontend
// This is critical: API routes must be handled before the React router catch-all
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// If PG is enabled, mount PG product routes under /api/pg/products
if (pgProductsRouter) {
  app.use('/api/pg/products', pgProductsRouter);
}

app.get('/', (req, res) => res.send('API running'));

// Serve frontend static files in production (AFTER API routes)
if (process.env.NODE_ENV === 'production') {
  // Serve React static files from frontend/dist
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));

  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Start server with an error handler to gracefully report listen errors
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';

function startServer() {
  const server = app.listen(PORT, LISTEN_HOST, () => console.log(`Server running on ${LISTEN_HOST}:${PORT}`));

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`ERROR: Port ${PORT} is already in use. Stop the process using the port or set a different PORT env var.`);
      // Attempt a helpful diagnostic: print processes listening on the port
      const { execSync } = require('child_process');
      try {
        const out = execSync(`lsof -i :${PORT} -sTCP:LISTEN -Pn || true`, { encoding: 'utf8' });
        console.error('Processes listening on the port:\n', out);
      } catch (e) {
        console.error('Failed to run lsof for diagnostics:', e.message || e);
      }
      process.exit(1);
    } else {
      console.error('Server error:', err && err.stack ? err.stack : err);
      process.exit(1);
    }
  });

  return server;
}

// Global error handler (development friendly) — logs stack and returns minimal message
app.use((err, req, res, next) => {
  try {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
  } catch (e) {
    console.error('Failed to log unhandled error', e);
  }
  res.status(500).json({ message: err && err.message ? err.message : '' });
});

// If run directly, start the server. Otherwise export the app for tests.
if (require.main === module) {
  startServer();
} else {
  module.exports = { app, startServer };
}

// Vercel serverless export
module.exports = app;

// Background jobs: notification cleanup
// Only schedule background timers when the server is started directly (not imported by tests)
if (require.main === module && process.env.NODE_ENV !== 'test') {
  try {
    const NOTIF_CLEANUP_ENABLED = (process.env.NOTIF_CLEANUP_ENABLED || 'true') === 'true';
    // Parse numeric env vars and validate/fallbacks to safe defaults if invalid
    let NOTIF_CLEANUP_INTERVAL_HOURS = Number(process.env.NOTIF_CLEANUP_INTERVAL_HOURS || 6);
    if (!Number.isFinite(NOTIF_CLEANUP_INTERVAL_HOURS) || Number.isNaN(NOTIF_CLEANUP_INTERVAL_HOURS) || NOTIF_CLEANUP_INTERVAL_HOURS < 1) {
      console.warn('[notif-cleanup] NOTIF_CLEANUP_INTERVAL_HOURS is invalid; falling back to 6');
      NOTIF_CLEANUP_INTERVAL_HOURS = 6;
    }
    // Ensure integer hours and clamp to minimum 1 when used for scheduling
    NOTIF_CLEANUP_INTERVAL_HOURS = Math.max(1, Math.floor(NOTIF_CLEANUP_INTERVAL_HOURS));

    let NOTIF_CLEANUP_OLDER_THAN_DAYS = Number(process.env.NOTIF_CLEANUP_OLDER_THAN_DAYS || 30);
    if (!Number.isFinite(NOTIF_CLEANUP_OLDER_THAN_DAYS) || Number.isNaN(NOTIF_CLEANUP_OLDER_THAN_DAYS) || NOTIF_CLEANUP_OLDER_THAN_DAYS < 0) {
      console.warn('[notif-cleanup] NOTIF_CLEANUP_OLDER_THAN_DAYS is invalid; falling back to 30');
      NOTIF_CLEANUP_OLDER_THAN_DAYS = 30;
    }

    let NOTIF_CLEANUP_READ_DAYS = Number(process.env.NOTIF_CLEANUP_READ_DAYS || 7);
    if (!Number.isFinite(NOTIF_CLEANUP_READ_DAYS) || Number.isNaN(NOTIF_CLEANUP_READ_DAYS) || NOTIF_CLEANUP_READ_DAYS < 0) {
      console.warn('[notif-cleanup] NOTIF_CLEANUP_READ_DAYS is invalid; falling back to 7');
      NOTIF_CLEANUP_READ_DAYS = 7;
    }
    if (NOTIF_CLEANUP_ENABLED) {
      const runCleanup = async () => {
        try {
          const adapter = require('./models/adapter');
          if (adapter && adapter.Notification && typeof adapter.Notification.deleteOlderThan === 'function') {
            const deleted = await adapter.Notification.deleteOlderThan({ olderThanDays: NOTIF_CLEANUP_OLDER_THAN_DAYS, readOlderThanDays: NOTIF_CLEANUP_READ_DAYS });
            console.log(`[notif-cleanup] deleted ${deleted} old notifications`);
          }
        } catch (e) {
          console.warn('[notif-cleanup] failed', e && e.message ? e.message : e);
        }
      };
      // Run once on startup (non-blocking)
      setTimeout(() => { runCleanup().catch(() => {}); }, 2000);
      // Schedule periodic cleanup
      setInterval(() => { runCleanup().catch(() => {}); }, Math.max(1, NOTIF_CLEANUP_INTERVAL_HOURS) * 60 * 60 * 1000);
      console.log('[notif-cleanup] scheduled every', NOTIF_CLEANUP_INTERVAL_HOURS, 'hours');
    }
  } catch (e) { console.warn('Failed to schedule notification cleanup', e && e.message ? e.message : e); }
} else {
  // When imported (for tests) or running under test env, do not start background timers.
  // Keep the log minimal so tests aren't noisy.
  if (process.env.NODE_ENV !== 'test') console.log('[notif-cleanup] not scheduled (server imported)');
}
