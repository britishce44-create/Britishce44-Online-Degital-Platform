# ─── Britishce44 Desktop — Build Script ──────────────
# 1. Builds the frontend SPA
# 2. Builds the api-server
# 3. Packages everything into an .exe installer
# ─────────────────────────────────────────────────────

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspace = Resolve-Path "$root\..\.."

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Britishce44 — Desktop Build                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

# Step 1: Install deps (if needed)
Write-Host "`n[1/5] Ensuring dependencies..." -ForegroundColor Yellow
Set-Location $workspace
pnpm install
if (-not $?) { Write-Host "❌ pnpm install failed" -ForegroundColor Red; exit 1 }

# Step 2: Build the database schema
Write-Host "`n[2/5] Checking database schema..." -ForegroundColor Yellow
pnpm --filter @workspace/db run push
if (-not $?) { Write-Host "⚠  DB push failed — continuing (server may not work)" -ForegroundColor Yellow }

# Step 3: Build the API server
Write-Host "`n[3/5] Building API server..." -ForegroundColor Yellow
pnpm --filter @workspace/api-server run build
if (-not $?) { Write-Host "❌ API server build failed" -ForegroundColor Red; exit 1 }

# Step 4: Build the frontend
Write-Host "`n[4/5] Building frontend..." -ForegroundColor Yellow
pnpm --filter @workspace/britishce44 run build
if (-not $?) { Write-Host "❌ Frontend build failed" -ForegroundColor Red; exit 1 }

# Step 5: Build the desktop installer
Write-Host "`n[5/5] Packaging desktop installer..." -ForegroundColor Yellow
Set-Location $root
pnpm run build
if (-not $?) { Write-Host "❌ Desktop build failed" -ForegroundColor Red; exit 1 }

Write-Host "`n✅ Desktop installer created!" -ForegroundColor Green
$installer = Get-ChildItem "$root\dist-installer" -Filter "*.exe" | Select-Object -First 1
if ($installer) {
  Write-Host "   📦 $($installer.FullName)" -ForegroundColor White
  $size = [math]::Round($installer.Length / 1MB, 1)
  Write-Host "   Size: ${size} MB" -ForegroundColor Gray
}
