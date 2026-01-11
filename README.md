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

# ElectroCart — Full-stack E‑commerce Demo

A compact full-stack e‑commerce application (React + Vite frontend, Node/Express backend) with local-first image fallbacks and optional Postgres support.

---

## Quick summary
- Frontend: `frontend/` (Vite, React, Recharts)
- Backend: `backend/` (Node, Express; serves `/api` and static `/uploads`)
- Built for local development and demos. Supports optional Postgres (Sequelize) seeding.

---

## Requirements
- Node.js 16+ (recommend 18+)
- npm (or yarn)
- (Optional) Postgres server if you want to use the PG seed scripts and PG-backed models

---

## Setup — install dependencies

From repository root:

```bash
# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

---

## Environment variables

Backend (create `backend/.env`):

```env
# required only if using Postgres support. If omitted, the app runs in demo mode.
POSTGRES_URL=postgres://user:password@localhost:5432/electrocart
# API port (default 5001)
PORT=5001
# allow the frontend dev server origin in CORS or set DEV_ALLOW_ALL_ORIGINS=true for local dev
DEV_ALLOW_ALL_ORIGINS=true
# Set a JWT secret for auth (use a secure value for production)
JWT_SECRET=change_this_in_production
```

Frontend (optional `frontend/.env`):

```env
VITE_API_URL=http://localhost:5001
```

Notes:
- If you do not set `POSTGRES_URL`, the backend will still serve demo data (in-memory or seeded sample products) so you can develop without a DB.

---

## Start services (development)

1) Start backend (default port 5001):

```bash
cd backend
npm start
# or for auto-reload during development
npm run dev
```

2) Start frontend (Vite dev server):

```bash
cd frontend
npm run dev
```

3) Open the app in your browser (Vite URL printed by the command, typically `http://localhost:5173`).

---

## Database (Postgres) — optional

This project supports Postgres via Sequelize. If you want to enable it:

1) Start or install Postgres and create a database (example using psql):

```bash
# create DB (example)
createdb electrocart
# or using psql
psql -c "CREATE DATABASE electrocart;"
```

2) Set the connection string in `backend/.env` (or export `POSTGRES_URL`):

```env
POSTGRES_URL=postgres://dbuser:dbpass@localhost:5432/electrocart
```

3) Seed the database (PG seeder):

```bash
cd backend
# this script uses POSTGRES_URL to connect and will create tables + demo data
npm run seed:pg
```

4) Optional: ensure admin user + seed from demo products

```bash
# runs ensure_admin_and_seed_products.js which reads demo data from frontend/src/data/demoProducts.js
node ensure_admin_and_seed_products.js
```

Notes on seeding
- `seed_pg.js` will `sync({ force: true })` the schema during seeding. Use with care; it drops existing tables.
- `ensure_admin_and_seed_products.js` reads the demo products from the frontend code and inserts missing products without dropping tables.

---

## Running in demo mode (no DB)

If you don't supply `POSTGRES_URL`, the backend runs in demo/offline mode and returns demo product data. This is useful for quick UI work without installing Postgres.

---

## Seeded admin user

When seeding is run (PG seed or ensure_admin), a demo admin is created. Default credentials (for development only):

- Email: `admin@example.com`
- Password: `admin123` (or see seed scripts — some seeds set a placeholder hashed password)

---

## Useful backend scripts

- `npm start` — start server
- `npm run dev` — start server with node watch
- `npm run dev:nodemon` — start server with nodemon
- `npm run seed:pg` — run Postgres seeder (requires POSTGRES_URL)

---

## File uploads

- Images used by demo products live in `frontend/public/uploads` and `backend/uploads`.
- The frontend resolver prefers `window.location.origin + /uploads/...` (served from the frontend public folder) and falls back to the backend `/uploads` URL if needed. Filenames with spaces or unicode characters are percent-encoded when requested.

---

## Troubleshooting

- Port 5001 already in use: find process and stop it:

```bash
lsof -i :5001 -sTCP:LISTEN
kill <PID>
```

- If images do not appear: open DevTools Network -> look for `/uploads/...` request and verify status (200 vs 404). Filenames are encoded; make sure the file present in `backend/uploads` matches the product's filename.

- If analytics charts show no data: open DevTools Console and check for the debug `AdminDashboard salesByMonth:` line; paste it into an issue if it looks wrong and I'll adapt the parser.

---

## Contributing

Fork, branch, and open a PR. Keep changes small and document any new environment variables or DB changes.

---

If you'd like, I can also:
- Add a Docker Compose file to run the frontend, backend, and Postgres together,
- Add a one-liner `make` or npm script that bootstraps the dev environment (install + start),
- Add screenshots or a short demo GIF to this README.

Tell me which enhancement you'd like next and I'll add it.
### Authentication

- `POST /api/auth/register` - Register new user
