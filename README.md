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

