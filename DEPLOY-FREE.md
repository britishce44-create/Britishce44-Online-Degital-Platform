# Britishce44 — Deploy on Your Hostinger Plan (No VPS)

## Architecture
```
lcsyemen.com ───▶ your existing company site (unchanged)
                    Add embed script → floating B44 button

platform.lcsyemen.com ──▶ React SPA (Hostinger subdomain, static files)
                            ↓ API calls via HTTPS
Render.com (free tier) ──▶ api-server + Socket.IO + WebSockets
                            ↓ PostgreSQL
Supabase (free tier) ─────▶ Database

Metered.ca (free TURN) ──▶ WebRTC relay for video calls
```

Cost: **$0/month extra**

---

## Step 1 — Create Subdomain in Hostinger

1. Log into **hPanel → Domains → lcsyemen.com → DNS / Zone Editor**
2. Add an **A record**:
   ```
   Name:  platform
   Type:  A
   Value: (your Hostinger shared server IP)
   ```
   > Find your server IP in hPanel → Websites → lcsyemen.com → Overview → Server IP

3. Wait ~5 minutes for DNS propagation

---

## Step 2 — Deploy Frontend to Subdomain

On your local machine, build the React SPA:

```powershell
cd artifacts/britishce44
$env:PORT="8080"
$env:BASE_PATH="/"
pnpm run build
```

The built files are in `dist/public/`.

### Upload to Hostinger:
1. In hPanel → **Websites → lcsyemen.com → File Manager**
2. Navigate to the folder for `platform.lcsyemen.com` subdomain
   (Usually `public_html/platform/` or it may create a separate directory)
3. Upload all files from `dist/public/` there

---

## Step 3 — Supabase PostgreSQL (Free)

1. Go to https://supabase.com → Sign up → **Start a project**
2. Region: choose closest to Yemen (Singapore or Mumbai)
3. Copy your connection string from:
   **Project Settings → Database → Connection String (URI)**
   ```
   postgres://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
   ```

---

## Step 4 — Push Code to GitHub

```powershell
cd C:\path\to\project
git init
git add -A
git commit -m "initial"
# Create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USER/britishce44-platform.git
git branch -M main
git push -u origin main
```

---

## Step 5 — Deploy API Server on Render (Free)

1. Go to https://dashboard.render.com → **New + → Web Service**
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `britishce44-api`
   - **Root Directory**: `artifacts/api-server`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && node build.mjs`
   - **Start Command**: `node --enable-source-maps dist/index.mjs`
   - **Plan**: **Free** ($0/month)

4. Add environment variables:
   ```
   DATABASE_URL = (your Supabase connection string)
   PORT = 10000
   ```

5. Click **Create Web Service**

Wait ~3 minutes for the first deploy. Render gives you a URL like:
```
https://britishce44-api.onrender.com
```

### Test it:
```
https://britishce44-api.onrender.com/api/healthz
→ { "status": "ok" }
```

---

## Step 6 — Rebuild Frontend with Backend URL

Update your frontend `.env` with the Render URL, then rebuild and re-upload:

Create `artifacts/britishce44/.env.production`:
```
VITE_ONLINE_MODE=true
VITE_SIGNALING_URL=https://britishce44-api.onrender.com
VITE_TURN_SERVERS=[{"urls":"turn:free.metered.ca:3478","username":"YOUR_METERED_USER","credential":"YOUR_METERED_SECRET"}]
BASE_PATH=/
PORT=8080
```

Rebuild:
```powershell
Remove-Item -Recurse -Force dist/public -ErrorAction SilentlyContinue
pnpm run build
```

Re-upload `dist/public/` to Hostinger (repeat Step 2).

---

## Step 7 — Push Database Schema

After the Render deploy succeeds, run this to create all tables:

```bash
# From Render's Shell tab, or in a local terminal connected to Supabase:
pnpm --filter @workspace/db run push
```

---

## Step 8 — Add Button to Your Main Website

Add this line to your `lcsyemen.com` website (before `</body>`):

```html
<script src="https://platform.lcsyemen.com/embed.js" data-mode="popup"></script>
```

A golden **B44** button will appear at the bottom-right of your company site. When clicked, it shows: Student Login, Teacher Login, New Student Application.

---

## Step 9 — Free TURN for Video Calls (Metered.ca)

1. Go to https://www.metered.ca/turn → Sign up (free)
2. Copy your **username** and **credential**
3. Update `VITE_TURN_SERVERS` in Step 6 and rebuild

Without TURN, video calls rely on Google's free STUN servers — works for ~80% of users.

---

## What Works vs What's Limited

| Feature | Status | Notes |
|---------|:------:|-------|
| Quizzes, Assessments | ✅ Full | All anti-cheat, auto-grading |
| Library, Records | ✅ Full | IndexedDB + API |
| Mailbox, Contacts | ✅ Full | Email, WhatsApp links |
| Attendance, Results | ✅ Full | All sheets, reports |
| AI Reports (OpenAI) | ✅ Full | Add your API key in Render env vars |
| PDF Downloads | ✅ Full | 3 bilingual templates |
| Newcomer Interviews | ✅ Full | Golden interview flow |
| Student PWA App | ✅ Full | Mobile installable |
| **P2P Video Classroom** | ⚠️ Works | Browser-to-browser, up to 4 students |
| **Group Video (6+)** | ❌ Degraded | Need mediasoup SFU (requires VPS) |
| **Breakout Rooms** | ❌ Limited | Need mediasoup |
| **Desktop Electron App** | ⚠️ Online mode | Can't bundle server without VPS |
| **Video for all students** | ⚠️ ~80% | Some behind strict NAT need TURN |

---

## If Video Classrooms Are Essential (Upgrade Path)

When you're ready, the VPS route ($8.99/mo) adds:
- Mediasoup SFU for group video (unlimited participants)
- Custom Coturn TURN server (100% reliability)
- Docker Compose for everything
- Desktop app with bundled server
- No Render sleep delays

The **deploy-vps.sh** script is ready to set this up in ~15 minutes when you're ready.
