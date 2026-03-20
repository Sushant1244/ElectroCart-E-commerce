# How to Connect rameshprasadsah.com.np to Your Backend API

This guide explains how to connect your `.com.np` domain (rameshprasadsah.com.np) to your Vercel-deployed backend API at `https://rameshprasadsah.com.np/api`.

## Prerequisites

- Your domain: `rameshprasadsah.com.np`
- Your Vercel project deployed at: `your-project.vercel.app`
- Access to your domain registrar's DNS settings

---

## Step 1: Configure DNS Records at Your Domain Registrar

Log into your domain registrar (where you purchased rameshprasadsah.com.np) and add these DNS records exactly as shown in your Vercel dashboard:

| Record Type | Name/Host | Value/Target |
|-------------|-----------|--------------|
| CNAME | www | `00d03b8d75c2dOaO.vercel-dns-017.com` |

**Important:** Use the exact CNAME value shown in your Vercel domain settings (it will be different from the example above).

---

## Step 2: Add Domain in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Add your domain: `rameshprasadsah.com.np`
5. Vercel will verify the DNS configuration automatically

---

## Step 3: Configure Environment Variables for Your Domain

Since your backend runs on Vercel, you need to configure CORS to allow your custom domain.

### Option A: Set in Vercel Dashboard (Recommended)

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `CLIENT_URL` | `https://rameshprasadsah.com.np` | Production |
| `FRONTEND_URL` | `https://rameshprasadsah.com.np` | Production |

### Option B: Update in vercel.json (Alternative)

Your [`vercel.json`](vercel.json:1) already routes `/api/*` to backend. No additional changes needed.

---

## Step 4: Update Frontend Configuration

In `frontend/.env.production`:
```env
VITE_API_URL=
```

Leave it empty (as you have now) - this makes API calls use relative URLs, which will work correctly since both frontend and backend will be on the same domain.

---

## Step 5: Wait for DNS Propagation

DNS changes can take **5 minutes to 24 hours** to propagate globally.

Check propagation:
```bash
dig rameshprasadsah.com.np
nslookup rameshprasadsah.com.np
```

---

## Testing Your Connection

Once DNS propagates, test your API endpoint:
```bash
curl https://rameshprasadsah.com.np/api/products
```

Expected response: JSON data from your backend products API.

Your backend API will be accessible at:
```
https://rameshprasadsah.com.np/api
```

---

## For .np Domains Specific Notes

- `.com.np` is Nepal's commercial domain extension
- You may need to verify domain ownership through email or SMS
- Some Nepalese registrars (e.g., .np domain providers) require additional documentation
- DNS propagation within Nepal may be faster than international

---

## Troubleshooting

1. **Domain not verified**: Check DNS records are correctly set at your registrar
2. **SSL certificate issues**: Vercel provides free automatic SSL; go to Domains settings and ensure SSL is enabled
3. **CORS errors**: Ensure `CLIENT_URL=https://rameshprasadsah.com.np` is set in Vercel environment variables
4. **API not responding**: Check Vercel deployment logs in Dashboard → Deployments
