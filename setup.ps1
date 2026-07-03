# ─── Britishce44 — First-time Setup ────────────────────
# Run this once after cloning to install deps + init DB.
# ─────────────────────────────────────────────────────

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Britishce44 — Setup                        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Check prerequisites
Write-Host "`n[1/4] Checking prerequisites..." -ForegroundColor Yellow
$hasPnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $hasPnpm) {
  Write-Host "   ❌ pnpm not found. Install it: npm install -g pnpm" -ForegroundColor Red
  exit 1
}
Write-Host "   ✅ pnpm found" -ForegroundColor Green

# 2. Install dependencies
Write-Host "`n[2/4] Installing dependencies..." -ForegroundColor Yellow
pnpm install
if (-not $?) { Write-Host "   ❌ pnpm install failed" -ForegroundColor Red; exit 1 }
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green

# 3. Copy .env file
Write-Host "`n[3/4] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path "$root\artifacts\api-server\.env")) {
  Copy-Item "$root\artifacts\api-server\.env.local" "$root\artifacts\api-server\.env" -Force
  Write-Host "   ✅ Created api-server/.env from .env.local" -ForegroundColor Green
} else {
  Write-Host "   ℹ  api-server/.env exists, skipping" -ForegroundColor Gray
}
if (-not (Test-Path "$root\artifacts\britishce44\.env")) {
  Copy-Item "$root\artifacts\britishce44\.env.local" "$root\artifacts\britishce44\.env" -Force
  Write-Host "   ✅ Created britishce44/.env from .env.local" -ForegroundColor Green
} else {
  Write-Host "   ℹ  britishce44/.env exists, skipping" -ForegroundColor Gray
}

# 4. Push DB schema (requires PostgreSQL running)
Write-Host "`n[4/4] Pushing database schema..." -ForegroundColor Yellow
Write-Host "   ⚠  Make sure PostgreSQL is running and DATABASE_URL is set in api-server/.env" -ForegroundColor Yellow
pnpm --filter @workspace/db run push
if ($?) {
  Write-Host "   ✅ Database schema pushed" -ForegroundColor Green
} else {
  Write-Host "   ⚠  DB push failed. Check PostgreSQL connection and DATABASE_URL." -ForegroundColor Red
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "   Run .\start-local.ps1 to launch the platform." -ForegroundColor White
