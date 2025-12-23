require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const app = express();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const uploadsRoutes = require('./routes/uploads');
const pgConfig = require('./config/sequelize');
let pgProductsRouter = null;
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

const PORT = process.env.PORT || 5001;
// MongoDB support has been removed; use POSTGRES_URL to enable Postgres.

// Enable CORS: in production use CLIENT_URL, in development allow localhost on common dev ports
if (process.env.NODE_ENV === 'production') {
  app.use(cors({ origin: process.env.CLIENT_URL || 'https://your-production-client.com', credentials: true }));
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
      if (allowedLocalOrigins.includes(origin) || origin.startsWith('http://localhost:')) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true
  }));
}

// Parse JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// uploads listing
app.use('/api/uploads', uploadsRoutes);

// If PG is enabled, mount PG product routes under /api/pg/products
if (pgProductsRouter) {
  app.use('/api/pg/products', pgProductsRouter);
}

app.get('/', (req, res) => res.send('API running'));

// Start server with an error handler to gracefully report listen errors
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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