# 🚀 ElectroCart — Full-Stack E-Commerce Platform

A modern, full-stack e-commerce application built with React (Vite) frontend and Node.js/Express backend. Features a complete shopping experience with admin dashboard, inventory management, multiple payment gateways, and analytics.

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)

---

## ✨ Key Features

### 🛒 Shopping Experience
- **Product Catalog** — Browse products with categories, search, and filtering
- **Shopping Cart** — Persistent cart with quantity management
- **User Accounts** — Registration, login, order history
- **Wishlist** — Save products for later
- **Order Tracking** — Real-time order status updates

### 👨‍💼 Admin Dashboard
- **Analytics Dashboard** — Revenue charts, sales analytics, trend visualization
- **Inventory Management** — Real-time stock tracking, bulk operations, low stock alerts
- **Product Management** — Add, edit, delete products with image uploads
- **Order Management** — Status updates, tracking numbers
- **Blog Management** — Content management for blog posts

### 💳 Payment Integration
- **Khalti** — Popular Nepal payment gateway (production & sandbox)
- **eSewa** — Another Nepal payment option

### 🔧 Technical Features
- **JWT Authentication** — Secure user and admin authentication
- **PostgreSQL Support** — Full database integration via Sequelize
- **Demo Mode** — Works without database for development/testing
- **Email Notifications** — Order confirmations, OTP verification
- **Image Fallbacks** — Resilient image loading strategy

---

## 🧩 Tech Stack

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

## 📁 Project Structure

```
ecommerce-3/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components (Home, Cart, Admin, etc.)
│   │   ├── data/            # Demo product data
│   │   └── constants/       # App constants
│   └── public/uploads/      # Frontend static images
│
├── backend/                  # Express API server
│   ├── controllers/         # Route handlers
│   ├── routes/              # API routes
│   ├── models/              # Sequelize models
│   ├── middleware/          # Auth middleware
│   ├── utils/               # Utilities (email, helpers)
│   ├── uploads/             # Backend static uploads
│   └── scripts/             # Database scripts
│
├── README.md                # Main documentation
├── ADMIN_DOCS.md            # Admin panel documentation
├── VERCEL_DEPLOY.md         # Vercel deployment guide
├── RENDER_DEPLOY.md         # Render.com deployment guide
└── vercel.json              # Vercel configuration
```

---

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (optional, for production)

### Installation

```bash
# Clone and navigate to project
cd ecommerce-3

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Development

```bash
# Start backend (port 5001)
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm run dev
```

Visit `http://localhost:5173` to view the app.

### Demo Mode
Without `POSTGRES_URL`, the app runs in demo/offline mode with sample products — perfect for UI development without database setup.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
# Database (optional - app works in demo mode without)
POSTGRES_URL=postgres://user:password@localhost:5432/electrocart

# Server
PORT=5001
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here

# CORS
CLIENT_URL=http://localhost:5173
DEV_ALLOW_ALL_ORIGINS=true

# Email (SMTP)
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

## 📚 Available Scripts

### Backend
```bash
npm start           # Start production server
npm run dev         # Start with file watching
npm run dev:nodemon # Start with nodemon
npm run test        # Run tests
npm run seed:pg     # Seed PostgreSQL database
```

### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview    # Preview production build
npm run test       # Run tests (Vitest)
```

---

## 🔐 Default Admin Account

After seeding the database, an admin user is created:

- **Email:** `admin@example.com`
- **Password:** (set during first run or use password reset)

---

## 📄 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Authentication (register, login, OTP) |
| `/api/products` | Product CRUD operations |
| `/api/orders` | Order management |
| `/api/cart` | Shopping cart |
| `/api/wishlist` | User wishlist |
| `/api/payments/khalti` | Khalti payment integration |
| `/api/payments/esewa` | eSewa payment integration |
| `/api/inventory` | Stock management (admin) |
| `/api/analytics` | Dashboard analytics |
| `/api/blogs` | Blog posts |
| `/api/notifications` | User notifications |

---

## 🖥️ Deployment

### Vercel
See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed instructions.

### Render.com
See [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) for detailed instructions.

---

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm run test
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📧 Support

For issues or questions, please open a GitHub issue with reproduction steps.

---

*Built with ❤️ using React and Node.js*
