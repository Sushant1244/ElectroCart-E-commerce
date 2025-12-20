require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const app = express();
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const uploadsRoutes = require('./routes/uploads');
const pgConfig = require('./config/sequelize');
let pgProductsRouter = null;
if (pgConfig) {
  try {
    const pgProductsFactory = require('./routes/pgProducts');
    pgProductsRouter = pgProductsFactory(pgConfig);
  } catch (err) {
    console.error('Failed to load PG routes', err.message);
  }
}

const PORT = process.env.PORT || 5001;
connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));