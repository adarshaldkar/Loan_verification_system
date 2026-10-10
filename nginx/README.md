# Nginx Reverse Proxy Setup Guide for LVMS

This directory contains the production-grade **Nginx reverse proxy configuration** for the **Loan Verification Management System (LVMS)**.

---

## 1. Do You Need Nginx?

| Deployment Type | Is Nginx Needed? | Why? |
| :--- | :--- | :--- |
| **Local Development** | ❌ No | Next.js runs on `localhost:3000` and Express on `localhost:5000` directly. |
| **Serverless / PaaS (Vercel + Render)** | ❌ No | Vercel and Render provide their own managed Edge routers and SSL certificates. |
| **VPS (AWS Lightsail, EC2, Hostinger, DigitalOcean)** | ✅ **Yes (Essential)** | Nginx binds to ports `80` (HTTP) and `443` (HTTPS), handles SSL, forwards `/api/*` to Express (port 5000), and forwards all UI routes to Next.js (port 3000). |
| **Docker / Docker Compose** | ✅ **Yes (Recommended)** | Nginx acts as the single ingress container for both frontend and backend. |

---

## 2. Key Capabilities in this Nginx Config (`default.conf`)

1. **Unified Single Domain**: Both frontend and backend live under one domain (e.g. `https://lvms.yourcompany.com`). Eliminates CORS pre-flight bottlenecks and cross-site cookie restrictions.
2. **Reverse Routing**:
   - `https://yourdomain.com/api/*` ➔ Express API on port `5000`
   - `https://yourdomain.com/*` ➔ Next.js App on port `3000`
3. **Large File Uploads**: `client_max_body_size 50M;` configured for bulk customer Excel sheets, field verification photos, and audio recordings.
4. **WebSocket & Live Tracking**: Passes `Upgrade` and `Connection "upgrade"` headers for real-time agent GPS tracking.
5. **Rate Limiting**:
   - `30 req/s` on general API endpoints
   - Strict `5 req/s` on `/api/v1/auth/login` to prevent credential stuffing.
6. **Next.js Static Asset Caching**: 1-year immutable caching on `/_next/static/` for fast load times.

---

## 3. Quick VPS Deployment Instructions (Ubuntu / Debian)

### Step 1: Install Nginx & Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Copy the Configuration
```bash
# Copy default.conf to sites-available
sudo cp nginx/default.conf /etc/nginx/sites-available/lvms.conf

# Edit domain name
sudo nano /etc/nginx/sites-available/lvms.conf
# Replace "yourdomain.com" with your actual domain or elastic IP

# Enable the site
sudo ln -s /etc/nginx/sites-available/lvms.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test config syntax
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Issue Free SSL Certificate (HTTPS)
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 4: Run Node Apps via PM2
```bash
# Backend (from server/ folder)
cd server
npm run build
pm2 start dist/server.js --name "lvms-backend"

# Frontend (from root folder)
cd ..
npm run build
pm2 start npm --name "lvms-frontend" -- start

# Save PM2 state to survive reboots
pm2 save
pm2 startup
```
