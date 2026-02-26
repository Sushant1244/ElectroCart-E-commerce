⚡ ElectroCart — Full-Stack E-Commerce Platform
<p align="center"> <img src="https://img.shields.io/badge/ElectroCart-E--Commerce-blue?style=for-the-badge&logo=shopping-cart&logoColor=white" alt="ElectroCart"> <img src="https://img.shields.io/badge/React-18-blue?style=flat&logo=react" alt="React"> <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=flat&logo=node.js" alt="Node.js"> <img src="https://img.shields.io/badge/PostgreSQL-13+-blue?style=flat&logo=postgresql" alt="PostgreSQL"> <img src="https://img.shields.io/badge/Khalti-Payment-red?style=flat" alt="Khalti"> <img src="https://img.shields.io/badge/eSewa-Payment-orange?style=flat" alt="eSewa"> </p>
📖 Introduction
ElectroCart is a full-stack e-commerce platform tailored for the Nepalese market. It provides:
🛒 Smooth shopping experience
🔒 Secure user authentication with OTP
💳 Integrated payments via Khalti and eSewa
📝 Admin dashboard for product, orders, and user management
Built with React (Vite) frontend, Node.js/Express backend, and PostgreSQL database support.
✨ Key Features
🛍️ Customer Features
Browse products by categories, search, and filters
Secure login/register, OTP verification, JWT sessions
Persistent shopping cart & wishlist
Place orders, track status, view history
User dashboard with profile, addresses, notifications
🛠️ Admin Features
Dashboard analytics: revenue, top products, charts
Product & inventory management: CRUD, bulk upload, stock alerts
Order management: update status, refunds, invoices
Blog & content management
User management with role-based access
Promo codes & discount tracking
Payment reports: Khalti/eSewa transactions
💳 Payment Integration
Khalti & eSewa support, sandbox & production
Automatic order confirmations and payment tracking
⚙️ Technical Features
JWT authentication & role-based access
PostgreSQL via Sequelize ORM
Email notifications via Nodemailer
RESTful API endpoints
Image handling with fallback & S3 support
Global error handling & logging
🏗️ Tech Stack
Layer	Technology
Frontend	React 18, Vite, React Router
Backend	Node.js, Express
Database	PostgreSQL (optional), Sequelize ORM
Authentication	JWT
Charts	Recharts
Payments	Khalti, eSewa
Email	Nodemailer (SMTP)
📂 Project Structure
ecommerce-3/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # Reusable UI bits
│   │   ├── pages/            # Page components
│   │   ├── data/             # Demo product data
│   │   └── constants/        # App constants
│   └── public/uploads/       # Static images
├── backend/                  # Express API
│   ├── controllers/          # Route handlers
│   ├── routes/               # API routes
│   ├── models/               # Sequelize models
│   ├── middleware/           # Auth middleware
│   ├── utils/                # Utilities (email, helpers)
│   ├── uploads/              # Static uploads
│   └── scripts/              # DB scripts
├── README.md                
├── ADMIN_DOCS.md            
├── VERCEL_DEPLOY.md         
├── RENDER_DEPLOY.md         
└── vercel.json              
🚀 Getting Started
🧰 Prerequisites
Node.js 18+
npm or yarn
PostgreSQL (optional)
⚡ Installation
# Clone the project
git clone <repo-url>
cd ecommerce-3

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
▶️ Running Locally
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
Open http://localhost:5173 in your browser.
💡 Demo Mode: Runs with sample data if no database is configured.
🔑 Environment Variables
Backend (backend/.env)
POSTGRES_URL=postgres://user:password@localhost:5432/electrocart
PORT=5001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
KHALTI_ENV=dev
KHALTI_SECRET_KEY=your_khalti_secret
KHALTI_LIVE_PUBLIC_KEY=your_khalti_public
Frontend (frontend/.env)
VITE_API_URL=http://localhost:5001
VITE_KHALTI_PUBLIC_KEY=your_khalti_public_key
⚡ Scripts
Backend
npm start           # Production
npm run dev         # Watch mode
npm run dev:nodemon # Nodemon
npm test
npm run seed:pg     # Seed DB
Frontend
npm run dev
npm run build
npm run preview
npm run test
👤 Default Admin Account
Email: admin@example.com
Password: Set during first run or via reset
🌐 API Endpoints
Endpoint	Description
/api/auth	Register, login, OTP
/api/products	Product CRUD
/api/orders	Order management
/api/cart	Shopping cart
/api/wishlist	Wishlist
/api/payments/khalti	Khalti integration
/api/payments/esewa	eSewa integration
/api/inventory	Stock management
/api/analytics	Dashboard analytics
/api/blogs	Blog posts
/api/notifications	User notifications
🤝 Contributing
Fork the repository
Create a feature branch
Make your changes
Submit a pull request