# ─── Britishce44 — Online Mode ─────────────────────────
# Starts the platform with ALL features enabled.
# Requires: Docker Desktop + OpenAI API key + Google OAuth credentials.
# ─────────────────────────────────────────────────────

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   Britishce44 — ONLINE MODE                 ║" -ForegroundColor Magenta
Write-Host "║   AI · Google · Video classrooms enabled    ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Magenta

# Check Docker
$dockerOk = $null
try { $dockerOk = docker info 2>&1 } catch {}
if (-not $dockerOk) {
  Write-Host "⚠  Docker not found. Make sure PostgreSQL and Coturn are running manually." -ForegroundColor Yellow
} else {
  Write-Host "`n▶ Starting PostgreSQL + Coturn (TURN) via Docker..." -ForegroundColor Yellow
  docker compose -f "$root\docker-compose.yml" up -d
  Write-Host "   Waiting for services..." -ForegroundColor Gray
  Start-Sleep -Seconds 5
}

# Copy online env files
Copy-Item "$root\artifacts\api-server\.env.online" "$root\artifacts\api-server\.env" -Force
Copy-Item "$root\artifacts\britishce44\.env.online" "$root\artifacts\britishce44\.env" -Force

Write-Host "`n⚠  Make sure your .env files have the required API keys:" -ForegroundColor Yellow
Write-Host "   - OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "   - GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN" -ForegroundColor Gray
Write-Host "   - VITE_TURN_SERVERS (for WebRTC behind NAT)" -ForegroundColor Gray

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

Write-Host "`n✅ Online mode running!" -ForegroundColor Green
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
