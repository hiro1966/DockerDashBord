# 🔧 WSL2ポートフォワーディング設定スクリプト（改良版）

# WSL2のメインIPアドレスを取得（最初のIPのみ）
$wsl_ip = (wsl hostname -I).trim().Split()[0]

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WSL2 Port Forwarding Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WSL2 IP Address: $wsl_ip" -ForegroundColor Green
Write-Host ""

# 既存のポートフォワーディングを削除
Write-Host "Removing existing port forwarding rules..." -ForegroundColor Yellow
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=4000 listenaddress=0.0.0.0 2>$null

# 新しいポートフォワーディングを追加
Write-Host "Adding new port forwarding rules..." -ForegroundColor Yellow
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=$wsl_ip

# ファイアウォールルールの確認と追加
Write-Host "Checking firewall rules..." -ForegroundColor Yellow

$rule3000 = Get-NetFirewallRule -DisplayName "WSL Dashboard 3000" -ErrorAction SilentlyContinue
if (-not $rule3000) {
    Write-Host "Creating firewall rule for port 3000..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName "WSL Dashboard 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow | Out-Null
    Write-Host "✓ Firewall rule created for port 3000" -ForegroundColor Green
} else {
    Write-Host "✓ Firewall rule already exists for port 3000" -ForegroundColor Green
}

$rule4000 = Get-NetFirewallRule -DisplayName "WSL GraphQL 4000" -ErrorAction SilentlyContinue
if (-not $rule4000) {
    Write-Host "Creating firewall rule for port 4000..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName "WSL GraphQL 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow | Out-Null
    Write-Host "✓ Firewall rule created for port 4000" -ForegroundColor Green
} else {
    Write-Host "✓ Firewall rule already exists for port 4000" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Current Port Forwarding Configuration:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
netsh interface portproxy show all

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Access Information:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# WindowsホストのIPアドレスを取得
$host_ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Where-Object {$_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress

if ($host_ip) {
    Write-Host "Windows Host IP: $host_ip" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access from other devices:" -ForegroundColor Yellow
    Write-Host "  Dashboard: http://${host_ip}:3000?staffId=admin001" -ForegroundColor White
    Write-Host "  GraphQL:   http://${host_ip}:4000/graphql" -ForegroundColor White
} else {
    Write-Host "Windows Host IP: Not detected" -ForegroundColor Red
    Write-Host "Run 'ipconfig' to find your IP address manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Local access:" -ForegroundColor Yellow
Write-Host "  Dashboard: http://localhost:3000?staffId=admin001" -ForegroundColor White
Write-Host "  GraphQL:   http://localhost:4000/graphql" -ForegroundColor White
Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
