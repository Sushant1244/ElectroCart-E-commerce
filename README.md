# ElectroCart — Full-Stack E-Commerce Platform

<p align="center">
  <img src="https://img.shields.io/badge/ElectroCart-E--Commerce-blue?style=for-the-badge&logo=shopping-cart&logoColor=white" alt="ElectroCart">
  <img src="https://img.shields.io/badge/React-18-blue?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=flat&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-13+-blue?style=flat&logo=postgresql" alt="PostgreSQL">
</p>

## Introduction

ElectroCart is a comprehensive full-stack e-commerce platform built with modern web technologies. This application provides a complete shopping experience with user authentication, product management, shopping cart functionality, order processing, and payment integration. It's designed specifically for the Nepalese market with native support for popular local payment gateways like Khalti and eSewa.

The project features a React-based frontend with Vite for fast development, a Node.js/Express backend API, and optional PostgreSQL database support. It includes both customer-facing features and a powerful admin dashboard for managing products, orders, and analytics.

---

## Key Features

### Customer Features
- **Product Browsing**: Browse products by categories, search functionality, filtering by price/rating, and product detail pages with images and descriptions
- **User Authentication**: Secure registration and login with OTP verification via email, JWT-based session management
- **Shopping Cart**: Add/remove items, quantity adjustment, price calculation, persistent cart (saved to database for logged-in users)
- **Wishlist**: Save products for later, move items to cart, persistent across sessions
- **Order Management**: Place orders, view order history, track order status in real-time
- **User Dashboard**: Profile management, address book, order tracking, notification center

### Admin Features
- **Dashboard Analytics**: Revenue charts, sales statistics, top products, recent orders overview using Recharts
- **Product Management**: Full CRUD operations, bulk upload/delete, image upload with preview, category management
- **Inventory Management**: Stock tracking, low-stock alerts, bulk stock updates, inventory history
- **Order Management**: View all orders, update order status, process refunds, generate invoices
- **Blog System**: Create/edit/delete blog posts, publish announcements, content management
- **User Management**: View users, manage admin accounts, role-based access control
- **Promo Codes**: Create and manage discount codes, track usage, set expiration dates
- **Payment Reports**: View payment transactions, track Khalti/eSewa payments, financial summaries

### Payment Integration
- **Khalti Integration**: Complete payment gateway integration with sandbox and production modes, payment verification webhook handling
- **eSewa Integration**: Full eSewa support for Nepalese users, sandbox testing environment
- **Order Processing**: Automatic order confirmation emails, payment status tracking, transaction history

### Technical Features
- **JWT Authentication**: Secure token-based auth for users and administrators with role-based access
- **Database Options**: PostgreSQL with Sequelize ORM for production, demo mode with in-memory data for development
- **Email Notifications**: Order confirmations, OTP verification, shipping updates via Nodemailer (SMTP)
- **Image Handling**: Automatic image fallback, S3 upload support, local storage fallback
- **RESTful API**: Well-structured API endpoints following REST conventions
- **Error Handling**: Global error boundaries, graceful degradation, comprehensive error messages

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
