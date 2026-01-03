# 🚀 ElectroCart — Modern E‑commerce Website

ElectroCart is a full-stack  e‑commerce application built to showcase a compact, resilient storefront UI and a minimal API for product data and uploads.

## ✨ Why this project
- ✅ Clean, responsive React frontend (Vite) with a local-first image strategy so the UI stays useful when the API is unavailable.
- ⚙️ Simple Node/Express backend that serves product APIs and static uploads.
- 🎯 Great for learning, prototyping storefront UIs, and experimenting with progressive fallbacks.

## 🚩 Features
- 🛍️ Product listing, product detail pages, and a persisted cart
- 📦 Demo product data for offline/demo mode
- ♿ Accessible navigation (skip link, ARIA attributes)
- 🖼️ Image fallback behavior (frontend public uploads → backend uploads → inline placeholder)

## 🧩 Tech stack
- Frontend: React, Vite, react-router-dom
- Backend: Node.js, Express

## 📁 Repository layout
- `frontend/` — React/Vite app (src, public, build scripts)
- `backend/` — Express API, serves `/api` routes and static `/uploads`
- `frontend/public/uploads` and `backend/uploads` — product images used by the app

---

## ⚡ Quick start (developer)
1. Install dependencies

```bash
# from repository root
cd backend && npm install
cd ../frontend && npm install
```

2. Start services

```bash
# Start backend on the default port (5001)
cd backend
npm start

# Start frontend (Vite)
cd ../frontend
npm run dev
```

3. Open the app
- 🌐 Visit the local Vite URL (printed by the command), e.g. `http://localhost:5173`.
- 🧪 If the backend is not running, the frontend will display demo products automatically.

## 🏗️ Build for production

```bash
cd frontend
npm run build
# serve dist with your static server of choice
```

## 🐞 Troubleshooting
- ❌ Blank or missing images: confirm the files under `frontend/public/uploads` and `backend/uploads` exist and match the image filenames referenced by products.
- 🔌 API connection refused: ensure backend started successfully and no other process is using the configured port. Verify with:

```bash
curl -i http://localhost:5001/api/products
```

## 🧠 Developer tips
- 🔁 Demo data is provided in `frontend/src/data/demoProducts.js`. If you add a real database, centralize seeding to avoid duplication.
- 🛠️ To change the API base used by the frontend, set `VITE_API_URL` in the frontend environment or `.env` file.

## 🤝 Contributing
- Fork, branch, and send a pull request. Keep changes focused and include build/test notes.

## 📝 License
- MIT

## 📬 Contact
- For quick help, open an issue in the repo with a short description and reproduction steps.

---

If you'd like I can also add:
- 📸 Screenshots or a short demo GIF embedded in this README
- 🛠️ One-line macOS dev commands or a Docker compose setup

Tell me which enhancement you'd like next and I'll add it.
# ElectroCart — Modern E‑commerce Demo

ElectroCart is a full-stack demo e‑commerce application built to showcase a compact, resilient storefront UI and a minimal API for product data and uploads.

Why this project
- Clean, responsive React frontend (Vite) with a local-first image strategy so the UI stays useful when the API is unavailable.
- Simple Node/Express backend that serves product APIs and static uploads.
- Useful as a learning project, prototype storefront, or UI playground.

Features
- Product listing, product detail pages, and a persisted cart.
- Demo product data for offline/demo mode.
- Responsive card grid and accessible navigation (skip link, aria support).
- Image fallback behavior (frontend public uploads → backend uploads → inline placeholder).

Tech stack
- Frontend: React, Vite, react-router-dom
- Backend: Node.js, Express

Repository layout
- `frontend/` — React/Vite app (src, public, build scripts)
- `backend/` — Express API, serves `/api` routes and static `/uploads`
- `frontend/public/uploads` and `backend/uploads` — product images used by the app

Quick start (developer)
1. Install dependencies

```bash
# from repository root
cd backend && npm install
cd ../frontend && npm install
```

2. Start services

```bash
# Start backend on the default port (5001)
cd backend
npm start

# Start frontend (Vite)
cd ../frontend
npm run dev
```

3. Open the app
- Visit the local Vite URL (printed by the command), e.g. `http://localhost:5173`.
- If the backend is not running, the frontend will display demo products automatically.

Build for production

```bash
cd frontend
npm run build
# serve dist with your static server of choice
```

Troubleshooting
- Blank or missing images: confirm the files under `frontend/public/uploads` and `backend/uploads` exist and match the image filenames referenced by products.
- API connection refused: ensure backend started successfully and no other process is using the configured port. Verify with:

```bash
curl -i http://localhost:5001/api/products
```

Developer tips
- Demo data is provided in `frontend/src/data/demoProducts.js`. If you add a real database, centralize seeding to avoid duplication.
- To change the API base used by the frontend, set `VITE_API_URL` in the frontend environment or `.env` file.

Contributing
- Fork, branch, and send a pull request. Keep changes focused and include build/test notes.

License
- MIT

Contact
- For quick help, open an issue in the repo with a short description and reproduction steps.
# Elecrocart - E-commerce Website

A fully functional e-commerce website built with React (frontend) and Node.js/Express (backend).

## Features

### Customer Features
- Browse all products
- View featured products
- Product detail pages
- Shopping cart functionality
- Add/remove items from cart
- Checkout (orders are automatically marked as paid for demo)
- User authentication

### Admin Features
- Admin dashboard with statistics
- **Sales Analytics**:
  - Total sales and orders
  - Sales over time (monthly line chart)
  - Top selling products (bar chart)
- **Product Management**:
  - Add new products with images
  - Edit existing products
  - Delete products
  - Mark products as featured
  - Manage product stock
- View all orders

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- Recharts for data visualization
- Vite as build tool

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- BCrypt for password hashing

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

4. Create the uploads directory (for product images):
```bash
mkdir uploads
```

5. Seed the database (creates admin user and sample products):
```bash
npm run seed
```

6. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional, defaults are set):
```env
VITE_API_BASE=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Admin Credentials

After running the seed script:
- Email: `admin@demo.com`
- Password: `admin123`

## Project Structure

```
ecommerce/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── uploads/         # Uploaded product images
│   ├── server.js        # Entry point
│   └── seed.js          # Database seeder
│
└── frontend/
    ├── public/          # Static files
    ├── src/
    │   ├── api/         # API configuration
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   │   └── admin/   # Admin pages
    │   └── styles.css   # Global styles
    └── vite.config.mjs  # Vite configuration
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products?featured=true` - Get featured products
- `GET /api/products/:slug` - Get product by slug
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `POST /api/orders` - Create order (authenticated)
- `GET /api/orders/my` - Get user's orders (authenticated)
- `GET /api/orders` - Get all orders (admin only)
- `PATCH /api/orders/:id` - Update order status (admin only)

### Analytics (Admin Only)
- `GET /api/analytics` - Get sales statistics and charts data

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

## Features in Detail

### Admin Dashboard
- Real-time statistics: Total sales, orders, products, featured products
- Interactive charts:
  - Line chart showing sales over time (monthly)
  - Bar chart showing top selling products
- Product management with inline edit and delete
- Featured product toggle

### Shopping Experience
- Responsive design that works on all devices
- Smooth scrolling and modern UI
- Product images with fallbacks
- Stock availability indicators
- Featured product badges
- Category filtering capability

## Notes

- Orders are automatically marked as "paid" for demo purposes. In production, integrate with a payment gateway.
- Images are stored locally in the `backend/uploads` directory. Consider using cloud storage (AWS S3, Cloudinary) for production.
- The JWT secret should be changed in production.
- MongoDB connection string should be updated for production deployment.

## License

This project is open source and available for learning purposes.

