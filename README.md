# ElectroCart — Full-Stack E-Commerce Platform

So I built this e-commerce application over time — started as something small and gradually grew into a full-featured shopping platform. It's got a React frontend running on Vite, Node/Express backend, and honestly works pretty well for what I needed it to do. Let me walk you through what's here.

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)

---

## What It Can Do

### For Shoppers
You've got your standard e-commerce stuff here — product browsing with categories and search, a shopping cart that actually remembers what's in it, user accounts with order history, wishlists, and real-time order tracking so people know where their stuff is.

### For Admins
The dashboard gives you revenue charts and sales analytics (always satisfying to see those numbers). There's full inventory management with stock tracking, bulk operations, and alerts when things are running low. Product management lets you add, edit, and delete items with image uploads. And there's a simple blog system if you want to publish content.

### Payments
This was built with Nepal's market in mind, so it's got Khalti and eSewa integration — both in sandbox and production modes. If you need something else, you'd need to add it, but these two cover most use cases here.

### Under the Hood
- JWT auth for users and admins — nothing fancy, but it works
- PostgreSQL via Sequelize if you want a real database, or it runs in demo mode without one (super handy for development)
- Email notifications for orders and OTP verification
- Some image fallback logic so the UI doesn't break if images fail to load

---

## The Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL (optional), Sequelize ORM |
| Authentication | JWT |
| Charts | Recharts |
| Payments | Khalti, eSewa |
| Email | Nodemailer (SMTP) |

---

## Project Structure

```
ecommerce-3/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # Reusable UI bits
│   │   ├── pages/           # Page components (Home, Cart, Admin, etc.)
│   │   ├── data/            # Demo product data
│   │   └── constants/       # App constants
│   └── public/uploads/      # Static images
│
├── backend/                  # Express API
│   ├── controllers/         # Route handlers
│   ├── routes/              # API routes
│   ├── models/              # Sequelize models
│   ├── middleware/          # Auth middleware
│   ├── utils/               # Utilities (email, helpers)
│   ├── uploads/             # Static uploads
│   └── scripts/             # DB scripts
│
├── README.md                # This file
├── ADMIN_DOCS.md            # Admin panel docs
├── VERCEL_DEPLOY.md         # Vercel deployment guide
├── RENDER_DEPLOY.md         # Render.com deployment guide
└── vercel.json              # Vercel config
```

---

## Getting It Running

### What You Need
- Node.js 18 or newer
- npm or yarn
- PostgreSQL if you want the full experience (optional)

### Setup

```bash
# Clone and go into the project
cd ecommerce-3

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Running It

```bash
# Terminal 1 — backend runs on port 5001
cd backend
npm start

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` and you should be good to go.

### Demo Mode
One nice thing about this: if you don't set up `POSTGRES_URL`, it just runs with sample data. Great for tweaking the UI or testing things without dealing with a database.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database (optional - works without it in demo mode)
POSTGRES_URL=postgres://user:password@localhost:5432/electrocart

# Server
PORT=5001
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here

# CORS
CLIENT_URL=http://localhost:5173
DEV_ALLOW_ALL_ORIGINS=true

# Email (SMTP) - using Gmail or similar
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com

# Payments (Khalti - optional)
KHALTI_ENV=dev
KHALTI_SECRET_KEY=your_khalti_secret
KHALTI_LIVE_PUBLIC_KEY=your_khalti_public
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5001
VITE_KHALTI_PUBLIC_KEY=your_khalti_public_key
```

---

## Scripts You'll Use

### Backend
```bash
npm start           # Production server
npm run dev         # Watch mode
npm run dev:nodemon # Nodemon
npm test            # Run tests
npm run seed:pg     # Seed PostgreSQL
```

### Frontend
```bash
npm run dev         # Dev server
npm run build       # Production build
npm run preview     # Preview build
npm run test        # Vitest tests
```

---

## Default Admin Account

After seeding the database:
- **Email:** `admin@example.com`
- **Password:** Set during first run or use password reset

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Register, login, OTP |
| `/api/products` | Product CRUD |
| `/api orders` | Order management |
| `/api/cart` | Shopping cart |
| `/api/wishlist` | User wishlist |
| `/api/payments/khalti` | Khalti integration |
| `/api/payments/esewa` | eSewa integration |
| `/api/inventory` | Stock management (admin) |
| `/api/analytics` | Dashboard analytics |
| `/api/blogs` | Blog posts |
| `/api/notifications` | User notifications |

---

## Deployment

### Vercel
Check out [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for step-by-step instructions.

### Render.com
See [RENDER_DEPLOY.md](./RENDER_DEPLOY.md).

---

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run test
```

---

## License

MIT — do whatever you want with it, basically.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Problems or Questions?

Open an issue on GitHub with some details about what you're running into. I'll take a look when I can.

---

*Built with some late nights and too much coffee using React and Node.js*
