# WSL内でテストを実行するためのWindows用スクリプト
# 使い方: .\run-tests-wsl.ps1

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🧪 Running Tests in WSL" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# WSLが利用可能か確認
Write-Host "🔍 Checking WSL availability..." -ForegroundColor Yellow
$wslCheck = wsl --list --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ WSL is not available" -ForegroundColor Red
    Write-Host "Please install WSL first: https://docs.microsoft.com/windows/wsl/install" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ WSL is available" -ForegroundColor Green
Write-Host ""

# プロジェクトパスを自動検出
Write-Host "📂 Detecting project path..." -ForegroundColor Yellow

# 現在のディレクトリからWSLパスを推測
$currentPath = (Get-Location).Path

# UNCパスの場合
if ($currentPath -like "\\wsl*") {
    # \\wsl.localhost\Ubuntu-20.04\home\user1\DockerDashBord
    # -> /home/user1/DockerDashBord
    $wslPath = $currentPath -replace '\\\\wsl[^\\]*\\[^\\]*\\', '/' -replace '\\', '/'
    Write-Host "📍 Detected WSL path: $wslPath" -ForegroundColor Green
}
# ローカルドライブの場合、WSL内の既知のパスを試す
else {
    $possiblePaths = @(
        "~/DockerDashBord",
        "~/webapp",
        "/home/user1/DockerDashBord",
        "/home/user/webapp"
    )
    
    $wslPath = $null
    foreach ($path in $possiblePaths) {
        $testResult = wsl bash -c "test -d $path && echo 'exists' || echo 'notfound'" 2>$null
        if ($testResult -eq "exists") {
            $wslPath = $path
            Write-Host "📍 Found project at: $wslPath" -ForegroundColor Green
            break
        }
    }
    
    if (-not $wslPath) {
        Write-Host "❌ Could not find project directory in WSL" -ForegroundColor Red
        Write-Host "Please specify the path manually:" -ForegroundColor Yellow
        Write-Host "  wsl bash -c 'cd /your/path && ./run-all-tests.sh'" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""

# テストスクリプトの存在を確認
Write-Host "🔍 Checking test script..." -ForegroundColor Yellow
$scriptCheck = wsl bash -c "test -f $wslPath/run-all-tests.sh && echo 'exists' || echo 'notfound'"
if ($scriptCheck -ne "exists") {
    Write-Host "❌ run-all-tests.sh not found at $wslPath" -ForegroundColor Red
    Write-Host "Make sure you're in the correct directory" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Test script found" -ForegroundColor Green
Write-Host ""

# スクリプトに実行権限を付与
Write-Host "🔧 Setting execute permissions..." -ForegroundColor Yellow
wsl bash -c "chmod +x $wslPath/run-all-tests.sh" 2>$null
Write-Host ""

# テストを実行
Write-Host "🚀 Executing tests in WSL..." -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

wsl bash -c "cd $wslPath && ./run-all-tests.sh"

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ Tests completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Tests failed with exit code: $exitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "  1. Check if Docker is running: docker compose ps" -ForegroundColor Cyan
    Write-Host "  2. Install dependencies: npm run install:all" -ForegroundColor Cyan
    Write-Host "  3. Check logs: docker compose logs -f" -ForegroundColor Cyan
    Write-Host "  4. See TROUBLESHOOTING.md for more help" -ForegroundColor Cyan
    exit $exitCode
}
