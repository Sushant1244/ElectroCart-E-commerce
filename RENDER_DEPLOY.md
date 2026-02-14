# Deployment to Render.com

This guide provides step-by-step instructions for deploying ElectroCart to Render.com.

## Prerequisites

- A [Render.com](https://render.com) account
- A [GitHub](https://github.com) repository with your code pushed

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub. The project should have this structure:
```
ecommerce-3/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── Procfile
│   └── ...
├── frontend/
│   ├── package.json
│   ├── vite.config.mjs
│   └── ...
└── ...
```

### 2. Create a PostgreSQL Database on Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Fill in the details:
   - **Name**: `electrocart-db` (or your preferred name)
   - **Database Name**: `electrocart`
   - **User**: `postgres` (default)
   - **Password**: Choose a strong password
   - **Region**: Select closest to your users
4. Click **Create Database**
5. Wait for the database to become available (green status)
6. Copy the **Internal Database URL** (you'll need this)

### 3. Create a Web Service on Render

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Fill in the details:
   - **Name**: `electrocart` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free` (for testing)
4. Click **Advanced** and add these environment variables:
   - `NODE_ENV`: `production`
   - `POSTGRES_URL`: (paste the PostgreSQL URL from step 2)
   - `CLIENT_URL`: `https://your-service-name.onrender.com` (use your actual URL)
   - `PG_SYNC`: `true` (for first deployment only to create tables)
5. Click **Create Web Service**

### 4. Wait for Deployment

Render will:
1. Install backend dependencies
2. Install frontend dependencies (via heroku-postbuild)
3. Build the React frontend
4. Start the server

### 5. Verify Deployment

Once deployed:
1. Visit your app at `https://your-service-name.onrender.com`
2. The API should be running at `https://your-service-name.onrender.com/api`
3. Test the API: `curl https://your-service-name.onrender.com/api/products`

### 6. Seed the Database (First Time)

After first deployment, you may need to seed the database with demo products:

1. Go to your Render service shell:
   - Dashboard → Your Service → **Shell**
2. Run the seed script:
   ```bash
   cd backend && node seed_pg.js
   ```

### 7. Create Admin User

To access the admin dashboard:

1. Use the registration page to create an account
2. Manually update the user's `role` to `admin` in the PostgreSQL database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Set to `production` | `production` |
| `PORT` | Port for the server (Render sets this) | `10000` |
| `POSTGRES_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `CLIENT_URL` | Your app's URL | `https://myapp.onrender.com` |
| `PG_SYNC` | Enable auto schema sync | `true` (first deploy only) |
| `SMTP_*` | Email settings (optional) | See `.env.production.example` |
| `KHALTI_*` | Payment settings (optional) | See `.env.production.example` |

## Troubleshooting

### Blank Page After Deployment
- Check if the frontend build completed successfully in the deploy logs
- Ensure `CLIENT_URL` is set correctly

### Database Connection Errors
- Verify `POSTGRES_URL` is correct
- Check that the PostgreSQL instance is running (green status)

### Images Not Loading
- The uploads folder needs to be persisted or use S3 for storage
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)

### 502 Bad Gateway
- Check if the server started correctly in the logs
- Verify the start command is correct: `cd backend && npm start`

## Updating the App

To deploy updates:
1. Push changes to your GitHub repository
2. Render will automatically redeploy
3. Or manually trigger a deploy from the Render dashboard
