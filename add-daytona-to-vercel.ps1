# Add Daytona API Key to Vercel
# This script adds the DAYTONA_API_KEY environment variable to your Vercel project

Write-Host "🚀 Adding Daytona API Key to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
    Write-Host ""
}

# Set the environment variable
Write-Host "Adding DAYTONA_API_KEY to Vercel..." -ForegroundColor Yellow

vercel env add DAYTONA_API_KEY production

Write-Host ""
Write-Host "✓ Environment variable added!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Redeploy your app: vercel --prod" -ForegroundColor White
Write-Host "2. Or go to Vercel dashboard and click 'Redeploy'" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
