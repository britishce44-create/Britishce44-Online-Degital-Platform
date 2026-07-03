# Britishce44 — Full Deployment Guide

## Architecture

```
Website URL (violet-finch-872010.hostingersite.com)
    │
    ├── Frontend (React SPA) — already deployed as static files
    │     Build from: artifacts/britishce44/
    │
    └── API Server + Database — needs Hostinger VPS or equivalent
          └── Node.js api-server :5000
          └── PostgreSQL :5432
          └── Coturn (TURN) :3478
          └── Mediasoup (SFU) : dynamic UDP ports
```

## Option A: Hostinger VPS (Recommended — $8.99/mo)

Everything runs on one VPS with Docker Compose.

### Step 1 — Buy VPS

1. Log into Hostinger → Products → VPS
2. Choose **KVM 2** ($8.99/mo) — Ubuntu 22.04
3. Note your VPS IP address

### Step 2 — Deploy

SSH into your VPS and run:

```bash
# Update & install Docker
apt update && apt install -y docker.io docker-compose-v2 certbot python3-certbot-nginx

# Clone the project
git clone https://github.com/YOUR_USER/britishce44-platform.git /opt/britishce44
cd /opt/britishce44

# Edit .env: set strong passwords, VITE_TURN_SERVERS with your VPS IP
nano docker-compose.yml
# → Change POSTGRES_PASSWORD
# → Set MEDIASOUP_ANNOUNCED_IP to your VPS IP
```

### Step 3 — Configure Environment

```bash
# Copy and edit env files
cp artifacts/api-server/.env.online artifacts/api-server/.env
cp artifacts/britishce44/.env.online artifacts/britishce44/.env

# Edit the .env files with production values:
# DATABASE_URL=postgres://britishce44:YOUR_PASSWORD@localhost:5432/britishce44
# VITE_TURN_SERVERS=[{"urls":"turn:YOUR_VPS_IP:3478","username":"britishce44","credential":"YOUR_TURN_SECRET"}]
# MEDIASOUP_ANNOUNCED_IP=YOUR_VPS_IP
```

### Step 4 — Start

```bash
# Start PostgreSQL + TURN
docker compose up -d postgres coturn

# Push database schema
pnpm --filter @workspace/db run push

# Build api-server
pnpm --filter @workspace/api-server run build

# Start api-server with PM2 (auto-restart)
npm install -g pm2
pm2 start node --name "britishce44-api" \
  -- --enable-source-maps artifacts/api-server/dist/index.mjs
pm2 save
pm2 startup
```

### Step 5 — Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Copy config
cat > /etc/nginx/sites-available/britishce44 << 'NGINX'
server {
    listen 80;
    server_name platform.britishce44.com;

    # Redirect to HTTPS (after cert)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name platform.britishce44.com;

    # SSL (get with certbot after domain pointed)
    ssl_certificate /etc/letsencrypt/live/platform.britishce44.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.britishce44.com/privkey.pem;

    # Frontend
    root /opt/britishce44/artifacts/britishce44/dist/public;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }

    # API
    location /api/ { proxy_pass http://127.0.0.1:5000; proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host; proxy_cache_bypass $http_upgrade; }

    # Socket.IO
    location /api/socket.io/ { proxy_pass http://127.0.0.1:5000; proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host; proxy_read_timeout 86400; }

    # Mediasoup signaling
    location /signaling/ { proxy_pass http://127.0.0.1:5000; proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host; proxy_read_timeout 86400; }

    # Gzip
    gzip on; gzip_types text/css application/javascript image/svg+xml;
    gzip_min_length 256;
}
NGINX

ln -s /etc/nginx/sites-available/britishce44 /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL certificate (after pointing domain)
certbot --nginx -d platform.britishce44.com
```

### Step 6 — Build & Deploy Frontend

```bash
# Build the frontend with production env
cd /opt/britishce44
pnpm --filter @workspace/britishce44 run build

# The built files are now at artifacts/britishce44/dist/public/
# Nginx serves them directly
```

---

## Option B: Hostinger Shared + Managed Node.js (Cheaper)

| Component | Where | Cost |
|-----------|-------|------|
| Frontend (static) | Hostinger shared hosting (current) | Included |
| Backend API | Hostinger Managed Node.js Hosting | $3.99/mo |
| PostgreSQL | Supabase free tier (or) Aiven | Free |

### Deploy Frontend to Shared Hosting
```bash
# Build
cd artifacts/britishce44
pnpm run build

# Upload dist/public/ to your Hostinger file manager
# → public_html/platform/
```

### Deploy Backend to Managed Node.js
```bash
# In Hostinger hPanel → Node.js → Create project
# Point to: artifacts/api-server/dist/index.mjs
# Set env vars in hPanel:
#   DATABASE_URL, PORT=5000
```

---

## Adding the Button to Your Website

### If your website IS the React SPA (current state):

The `PlatformAccessButton` component is already built at:
`artifacts/britishce44/src/components/platform-access-button.tsx`

Import it into your homepage and it renders a floating golden B44 button:

```tsx
import { PlatformAccessButton } from '@/components/platform-access-button'

function HomePage() {
  const [showLogin, setShowLogin] = useState(false)
  return (
    <>
      <YourWebsiteContent />
      <PlatformAccessButton onOpenLogin={() => setShowLogin(true)} />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
```

### If your website is WordPress or plain HTML:

Add this ONE line to your site's `<head>` or footer:

```html
<script src="https://violet-finch-872010.hostingersite.com/embed.js" data-mode="redirect"></script>
```

Options:
- `data-mode="redirect"` — navigates to the platform
- `data-mode="popup"` — opens in a popup window
- `data-mode="iframe"` — opens in a fullscreen iframe overlay

---

## Performance Optimization Checklist

| Item | How |
|------|-----|
| ✅ **CDN** | Hostinger includes Cloudflare CDN — enable in hPanel |
| ✅ **Gzip/Brotli** | Nginx config above includes gzip |
| ✅ **Cache static assets** | Set `Cache-Control: max-age=31536000` for JS/CSS |
| ✅ **Database connection pool** | Already configured in `lib/db/src/index.ts` |
| ✅ **WebSocket upgrades** | Nginx config has `proxy_set_header Upgrade` |
| ✅ **TURN server** | Coturn in Docker Compose handles NAT traversal |
| ✅ **Mediasoup SFU** | Proper server-side media routing for group calls |
| ✅ **SSL/HTTPS** | Certbot + Let's Encrypt |
| ✅ **PM2 auto-restart** | Backend restarts on crash |
