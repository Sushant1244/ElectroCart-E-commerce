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

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');

// Enable CORS: in production use CLIENT_URL, in development allow Vite default (5173)
if (process.env.NODE_ENV === 'production') {
  app.use(cors({ origin: process.env.CLIENT_URL || 'https://your-production-client.com', credentials: true }));
} else {
  const devOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(cors({ origin: devOrigin, credentials: true }));
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

app.get('/', (req, res) => res.send('API running'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));