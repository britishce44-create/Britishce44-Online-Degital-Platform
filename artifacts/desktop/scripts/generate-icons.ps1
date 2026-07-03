# ─── Generate App Icons ─────────────────────────────
# Requires: Inkscape or ImageMagick installed.
# Converts public/icon.svg → public/icon.png + public/icon.ico
# ─────────────────────────────────────────────────────

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$public = Join-Path $root ".." "public"

# Try Inkscape first
$inkscape = Get-Command "inkscape" -ErrorAction SilentlyContinue
if ($inkscape) {
  Write-Host "Generating icons via Inkscape..." -ForegroundColor Yellow
  & inkscape "$public\icon.svg" -o "$public\icon-256.png" -w 256 -h 256
  & inkscape "$public\icon.svg" -o "$public\icon-64.png" -w 64 -h 64
  & inkscape "$public\icon.svg" -o "$public\icon-32.png" -w 32 -h 32
  & inkscape "$public\icon.svg" -o "$public\icon-16.png" -w 16 -h 16
  Write-Host "  ✅ Icons created in public/" -ForegroundColor Green
  Write-Host "  ⚠  Convert to .ico using: https://icoconvert.com or ImageMagick:" -ForegroundColor Yellow
  Write-Host "     magick convert public/icon-256.png public/icon.ico" -ForegroundColor Gray
  return
}

# Try ImageMagick
$magick = Get-Command "magick" -ErrorAction SilentlyContinue
if ($magick) {
  Write-Host "Generating icons via ImageMagick..." -ForegroundColor Yellow
  & magick convert "$public\icon.svg" -resize 256x256 "$public\icon-256.png"
  & magick convert "$public\icon.svg" -resize 64x64 "$public\icon-64.png"
  & magick convert "$public\icon.svg" -resize 256x256 "$public\icon.ico"
  Write-Host "  ✅ Icons created (including .ico)" -ForegroundColor Green
  return
}

Write-Host "⚠  Neither Inkscape nor ImageMagick found." -ForegroundColor Yellow
Write-Host "   Install one of them, then re-run this script." -ForegroundColor Yellow
Write-Host "   Or manually convert public/icon.svg to PNG/ICO online." -ForegroundColor Yellow
