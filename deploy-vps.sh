#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# Britishce44 — Full VPS Deployment Script
# Target: Hostinger VPS (Ubuntu 22.04+) or any Ubuntu 22.04 VPS
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ─── CONFIGURE THESE ─────────────────────────────────────
DOMAIN="platform.britishce4.com"
#                   ↑ Change to your custom domain if you have one
ROOT_DIR="/opt/britishce44"
API_PORT=5000
# ═══════════════════════════════════════════════════════════

# Auto-generate credentials
POSTGRES_PASSWORD="b44_$(openssl rand -hex 12)"
TURN_SECRET="turn_$(openssl rand -hex 8)"
VPS_IP=$(curl -4 -s ifconfig.me 2>/dev/null || echo "YOUR_VPS_IP")

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   Britishce44 — VPS PRODUCTION DEPLOY             ║"
echo "║   Domain: $DOMAIN"
echo "║   VPS IP: $VPS_IP"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: System —───────────────────────────────────
echo "[1/7] Installing system dependencies..."
apt update -qq && apt upgrade -y -qq
apt install -y -qq curl gnupg git nginx ufw \
  docker.io docker-compose-v2 certbot python3-certbot-nginx
echo "  OK  system packages installed"

# ─── Step 2: Node.js + pnpm ─────────────────────────────
echo "[2/7] Installing Node.js + pnpm..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y -qq nodejs
npm install -g pnpm pm2
echo "  OK  Node.js $(node -V) + pnpm $(pnpm -v)"

# ─── Step 3: Project ───────────────────────────────────
echo "[3/7] Setting up project directory..."
mkdir -p "$ROOT_DIR"

if [ -d "$ROOT_DIR/.git" ]; then
  echo "  → Pulling latest..."
  cd "$ROOT_DIR" && git pull
else
  echo "  ⚠  No git repo found at $ROOT_DIR"
  echo "     You need to get the project files there first:"
  echo "     Option A — git clone:"
  echo "       git clone <YOUR_REPO_URL> $ROOT_DIR"
  echo "     Option B — SCP from local machine:"
  echo "       scp -r C:\\path\\to\\project user@$VPS_IP:$ROOT_DIR"
  echo ""
  echo "     After files are in place, re-run this script."
  exit 1
fi

cd "$ROOT_DIR"
echo "  OK  project files found"

# Install all workspace deps
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "  OK  dependencies installed"

# ─── Step 4: Environment ────────────────────────────────
echo "[4/7] Configuring environment..."

# Backend .env
cat > artifacts/api-server/.env << ENV
DATABASE_URL=postgres://britishce44:${POSTGRES_PASSWORD}@localhost:5432/britishce44
PORT=${API_PORT}
MEDIASOUP_ANNOUNCED_IP=${VPS_IP}
# Google OAuth (uncomment and fill in for Gmail/Drive/Calendar):
# GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=xxx
# GOOGLE_REFRESH_TOKEN=xxx
# OpenAI (uncomment and fill in for AI reports):
# OPENAI_API_KEY=sk-...
ENV

# Frontend .env (must include PORT + BASE_PATH for Vite build)
cat > artifacts/britishce44/.env << ENV
VITE_ONLINE_MODE=true
VITE_SIGNALING_URL=https://${DOMAIN}
VITE_TURN_SERVERS=[{"urls":"turn:${DOMAIN}:3478","username":"britishce44","credential":"${TURN_SECRET}"}]
BASE_PATH=/
PORT=8080
ENV

echo "  OK  .env files written"
echo "  ⚠  SAVE THESE CREDENTIALS:"
echo "     PostgreSQL: britishce44 / $POSTGRES_PASSWORD"
echo "     TURN:       britishce44 / $TURN_SECRET"

# ─── Step 5: Docker (PostgreSQL + Coturn) ──────────────
echo "[5/7] Starting PostgreSQL & TURN server..."

cat > docker-compose.yml << 'DOCKER'
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    container_name: britishce44-db
    restart: unless-stopped
    network_mode: host
    environment:
      POSTGRES_USER: britishce44
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: britishce44
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U britishce44"]
      interval: 5s
      timeout: 5s
      retries: 5

  coturn:
    image: coturn/coturn:latest
    container_name: britishce44-turn
    restart: unless-stopped
    network_mode: host
    command: >
      -n --log-file=stdout --realm=britishce44.com
      --listening-port=3478 --tls-listening-port=5349
      --fingerprint --lt-cred-mech
      --user=britishce44:${TURN_SECRET}
      --total-quota=100 --stale-nonce=600
      --no-multicast-peers --no-cli

volumes:
  pgdata:
DOCKER

export POSTGRES_PASSWORD TURN_SECRET
docker compose up -d

echo "  ⏳ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker exec britishce44-db pg_isready -U britishce44 &>/dev/null; then
    echo "  OK  PostgreSQL ready (${i}s)"
    break
  fi
  sleep 1
done

# ─── Step 6: Build & Start ─────────────────────────────
echo "[6/7] Building & starting..."

# Load backend env into current shell so child processes see DATABASE_URL
set -a
. artifacts/api-server/.env
set +a

# Push DB schema
pnpm --filter @workspace/db run push
echo "  OK  database schema pushed"

# Build API server
pnpm --filter @workspace/api-server run build
echo "  OK  api-server built"

# Build frontend (PORT and BASE_PATH come from .env)
export PORT=8080 BASE_PATH=/
pnpm --filter @workspace/britishce44 run build
echo "  OK  frontend built"

# Start API server via PM2
pm2 delete britishce44-api 2>/dev/null || true
pm2 start node --name "britishce44-api" \
  -- --enable-source-maps artifacts/api-server/dist/index.mjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "  OK  api-server started via PM2"

# ─── Step 7: Nginx ─────────────────────────────────────
echo "[7/7] Configuring Nginx..."

# HTTP-only config (works before SSL certs)
cat > /etc/nginx/sites-available/${DOMAIN} << NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    root ${ROOT_DIR}/artifacts/britishce44/dist/public;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;
    gzip_vary on;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/socket.io/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "  OK  nginx configured (HTTP)"

# Firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3478/udp
ufw --force enable
echo "  OK  firewall active"

# ─── Done ──────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETE                           ║"
echo "╠════════════════════════════════════════════════════╣"
echo "║                                                    "
echo "║   Frontend:  http://${DOMAIN}                      "
echo "║   API:       http://${DOMAIN}/api/healthz          "
echo "║                                                    "
echo "║   Next steps:                                      "
echo "║                                                    "
echo "║   1) Point your domain's DNS A record to:          "
echo "║      ${VPS_IP}                                     "
echo "║                                                    "
echo "║   2) Get SSL certificate:                          "
echo "║      certbot --nginx -d ${DOMAIN}                  "
echo "║                                                    "
echo "║   3) Add the embed script to your main website:    "
echo "║      <script src=\"https://${DOMAIN}/embed.js\"    "
echo "║              data-mode=\"popup\"></script>         "
echo "║                                                    "
echo "║   Manage:                                          "
echo "║      pm2 status | pm2 logs britishce44-api         "
echo "║      docker compose logs -f                        "
echo "║                                                    "
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "  Credentials (save these!):"
echo "  ─────────────────────────────────"
echo "  DB:        britishce44 / $POSTGRES_PASSWORD"
echo "  TURN:      britishce44 / $TURN_SECRET"
