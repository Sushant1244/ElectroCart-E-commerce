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

## License
This project is licensed under a Coventry University Academic Assignment License.
It permits academic review and evaluation while restricting commercial use and
academic misconduct.

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
cd backend
npm start
npm run dev
```

2) Start frontend (Vite dev server):

```bash
cd frontend
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

```bash
cd backend
# this script uses POSTGRES_URL to connect and will create tables + demo data
npm run seed:pg
```

4) Optional: ensure admin user + seed from demo products

```bash
# runs ensure_admin_and_seed_products.js which reads demo data from frontend/src/data/demoProducts.js

Notes on seeding
- `seed_pg.js` will `sync({ force: true })` the schema during seeding. Use with care; it drops existing tables.
- `ensure_admin_and_seed_products.js` reads the demo products from the frontend code and inserts missing products without dropping tables.

---

If you don't supply `POSTGRES_URL`, the backend runs in demo/offline mode and returns demo product data. This is useful for quick UI work without installing Postgres.
---

## Seeded admin user

When seeding is run (PG seed or ensure_admin), a demo admin is created. Default credentials (for development only):

- Email: `admin@example.com`


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

## 📸 Screenshots (backend uploads)

Here are a few additional screenshots stored under `backend/uploads` used by the demo.

<p align="center">
	<img alt="Last product" src="backend/uploads/Last%20productt.png" width="360" style="margin:8px; border-radius:8px; background:#fff; padding:8px;" />
	<img alt="Latest product" src="backend/uploads/Latest%20product.png" width="360" style="margin:8px; border-radius:8px; background:#fff; padding:8px;" />
	<img alt="Mid screen" src="backend/uploads/mid%20screen.png" width="360" style="margin:8px; border-radius:8px; background:#fff; padding:8px;" />
	<img alt="Homepages" src="backend/uploads/Homepages.png" width="360" style="margin:8px; border-radius:8px; background:#fff; padding:8px;" />
</p>

Tell me which enhancement you'd like next and I'll add it.
### Authentication
## Payments (Khalti) integration — NEW

This project now includes an integrated Khalti payment provider flow (client widget + server verify) so you can accept online payments (Khalti is a popular payment gateway in Nepal).

Key points:
- Frontend opens the Khalti widget after an order is created. The widget returns a short-lived token which the frontend posts to the backend for server-side verification.
- Backend endpoints:
	- `POST /api/payments/khati/initiate` — initiate server-side session with Khalti (stores pidx in ordqqqer when returned)
	- `POST /api/payments/khati/verify` — verify a client token and mark the order paid on success
	- `POST /api/payments/khati/debug-verify` — dev helper that returns the raw Khalti response for troubleshooting (do not expose in production)
	- `GET /api/payments/khati/config` — returns the public key and environment for the frontend to read at runtime

Environment variables (backend `.env`):

```env
# Khalti keys
KHALTI_ENV=production   # or 'dev' for sandbox
KHALTI_SECRET_KEY=<your_khalti_secret_here>
# optional (live/public)
KHALTI_LIVE_PUBLIC_KEY=<your_khalti_public_here>
```

Frontend `.env` (optional):
```env
VITE_KHALTI_PUBLIC_KEY=<your_khalti_public_here>
VITE_API_URL=http://localhost:5001
```

Local testing tips:
- For local development use Khalti sandbox/dev keys and set `KHALTI_ENV=dev` so tokens work from `localhost`.
- If you must use live keys while testing from `localhost`, add your dev origin (e.g. `http://localhost:5173`) to the allowed origins in your Khalti merchant dashboard.
- Use the `/api/payments/khati/debug-verify` endpoint to inspect raw provider responses when troubleshooting (the frontend also calls this endpoint before the official verify when running in dev mode).

Security note: Never commit live secrets to version control. Keep `KHALTI_SECRET_KEY` out of the repo and use environment variables or a secret manager in production.


- `POST /api/auth/register` - Register new user
