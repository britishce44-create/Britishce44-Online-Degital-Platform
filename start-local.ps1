# ─── Britishce44 — Local Mode ──────────────────────────
# Starts the platform with only core offline features.
# AI, Google, and Video classrooms are gracefully disabled.
# Requires: Docker Desktop (or PostgreSQL running on localhost).
# ─────────────────────────────────────────────────────

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Britishce44 — LOCAL MODE                  ║" -ForegroundColor Cyan
Write-Host "║   Core features only (offline-capable)      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

# Check Docker
$dockerOk = $null
try { $dockerOk = docker info 2>&1 } catch {}
if (-not $dockerOk) {
  Write-Host "⚠  Docker not found. Make sure PostgreSQL is running manually on localhost:5432." -ForegroundColor Yellow
} else {
  Write-Host "`n▶ Starting PostgreSQL via Docker..." -ForegroundColor Yellow
  docker compose -f "$root\docker-compose.yml" up -d postgres
  Write-Host "   Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
  Start-Sleep -Seconds 3
}

# Copy local env files
Copy-Item "$root\artifacts\api-server\.env.local" "$root\artifacts\api-server\.env" -Force
Copy-Item "$root\artifacts\britishce44\.env.local" "$root\artifacts\britishce44\.env" -Force

# Push DB schema
Write-Host "`n▶ Pushing database schema..." -ForegroundColor Yellow
pnpm --filter @workspace/db run push
if ($?) {
  Write-Host "   ✅ Database schema ready." -ForegroundColor Green
} else {
  Write-Host "   ⚠  Database push failed. Check DATABASE_URL in api-server/.env" -ForegroundColor Red
  exit 1
}

# Start API server
Write-Host "`n▶ Starting API server (port 5000)..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
  param($root)
  Set-Location $root
  pnpm --filter @workspace/api-server run dev:win
} -ArgumentList $root

# Start frontend
Write-Host "▶ Starting frontend (port 8080)..." -ForegroundColor Yellow
$webJob = Start-Job -ScriptBlock {
  param($root)
  Set-Location $root
  pnpm --filter @workspace/britishce44 run dev
} -ArgumentList $root

Write-Host "`n✅ Local mode running!" -ForegroundColor Green
Write-Host "   API:      http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop all services." -ForegroundColor Gray

try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  docker compose -f "$root\docker-compose.yml" down
  Stop-Job $apiJob; Stop-Job $webJob
  Remove-Job $apiJob; Remove-Job $webJob
}
