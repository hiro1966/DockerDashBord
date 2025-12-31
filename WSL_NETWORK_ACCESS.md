# 🐧 WSL2でのネットワークアクセス設定ガイド

WSL2上のDockerで動いているアプリケーションに、他のパソコンからアクセスする方法を説明します。

## 🎯 問題の原因

WSL2は独自のIPアドレスを持つ仮想マシンとして動作しています。
- WindowsホストのIPアドレス: `192.168.1.100`（例）
- WSL2のIPアドレス: `172.x.x.x`（動的に変わる）

他のパソコンは WindowsホストのIPアドレスにアクセスしますが、WSL2内部のサービスには直接アクセスできません。

## ✅ 解決方法

### 方法1: ポートプロキシの設定（推奨）

WindowsホストからWSL2へポートを転送します。

#### Step 1: WSL2のIPアドレスを確認

WSL2のターミナルで：

```bash
hostname -I | awk '{print $1}'
```

または

```bash
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1
```

例: `172.24.208.107`

#### Step 2: PowerShellでポートフォワーディングを設定

**PowerShellを管理者権限で実行**してください：

```powershell
# WSL2のIPアドレスを取得
$wsl_ip = (wsl hostname -I).trim()

# ポートフォワーディング設定
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=$wsl_ip

# ファイアウォール設定
netsh advfirewall firewall add rule name="WSL Dashboard 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="WSL GraphQL 4000" dir=in action=allow protocol=TCP localport=4000

# 設定確認
netsh interface portproxy show all
```

#### Step 3: 設定の確認

```powershell
# ポートフォワーディングのリストを表示
netsh interface portproxy show all
```

以下のように表示されればOKです：

```
リッスン          ipv4 アドレス     接続先         ipv4 アドレス

0.0.0.0           3000                  172.24.208.107    3000
0.0.0.0           4000                  172.24.208.107    4000
```

#### Step 4: 他のパソコンからアクセス

WindowsホストのIPアドレス（`192.168.1.100`など）を使用：

```
http://192.168.1.100:3000?staffId=admin001
```

---

### 方法2: 自動設定スクリプト（便利）

WSL2のIPアドレスは再起動時に変わるため、自動設定スクリプトを作成します。

#### スクリプト作成

PowerShellスクリプト `wsl-port-forward.ps1` を作成：

```powershell
# WSL2のIPアドレスを取得
$wsl_ip = (wsl hostname -I).trim()

Write-Host "WSL2 IP: $wsl_ip"

# 既存のポートフォワーディングを削除
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=4000 listenaddress=0.0.0.0 2>$null

# 新しいポートフォワーディングを追加
Write-Host "Setting up port forwarding..."
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=$wsl_ip

# ファイアウォールルール（初回のみ）
$ruleExists = Get-NetFirewallRule -DisplayName "WSL Dashboard 3000" -ErrorAction SilentlyContinue
if (-not $ruleExists) {
    Write-Host "Creating firewall rules..."
    New-NetFirewallRule -DisplayName "WSL Dashboard 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
    New-NetFirewallRule -DisplayName "WSL GraphQL 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
}

# 確認
Write-Host "`nCurrent port forwarding:"
netsh interface portproxy show all

Write-Host "`nSetup complete! Access your dashboard at:"
Write-Host "http://$(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Select-Object -First 1 -ExpandProperty IPAddress):3000"
```

#### 実行方法

**PowerShellを管理者権限で実行**：

```powershell
# 実行ポリシーを変更（初回のみ）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# スクリプト実行
.\wsl-port-forward.ps1
```

#### Windows起動時に自動実行（オプション）

1. タスクスケジューラを開く
2. 「基本タスクの作成」
3. トリガー: ログオン時
4. 操作: プログラムの開始
   - プログラム: `powershell.exe`
   - 引数: `-ExecutionPolicy Bypass -File "C:\path\to\wsl-port-forward.ps1"`
5. 「最上位の特権で実行する」にチェック

---

### 方法3: .wslconfig でミラーモード（Windows 11 22H2以降）

Windows 11の最新版では、WSL2のネットワークをミラーモードにできます。

#### .wslconfigファイルを作成

`C:\Users\<ユーザー名>\.wslconfig` を作成：

```ini
[wsl2]
networkingMode=mirrored
```

#### WSLを再起動

PowerShellで：

```powershell
wsl --shutdown
```

その後、WSLを再起動すると、WindowsホストとWSL2が同じIPアドレス空間を共有します。

⚠️ **注意**: この機能はWindows 11 22H2以降でのみ利用可能です。

---

## 🔍 トラブルシューティング

### 複数のIPアドレスが返される場合

WSL2が複数のIPアドレスを返す場合（例: `172.23.169.170 172.19.0.1 172.18.0.1 172.17.0.1`）：

- **最初のIPアドレス**（例: `172.23.169.170`）がWSL2のメインIPアドレスです
- その他のIPアドレスはDockerブリッジネットワークなどの仮想ネットワークです
- スクリプトは自動的に最初のIPアドレスのみを使用します

手動で確認する場合：

```bash
# WSL2内で実行
hostname -I | awk '{print $1}'
```

または

```bash
# メインネットワークインターフェース（eth0）のIPのみ取得
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1
```

### ポートフォワーディングが機能しない

#### 1. WSL2のIPアドレスを確認

```bash
# WSL2内で実行
hostname -I
```

#### 2. ポート転送の確認

```powershell
# PowerShellで実行
netsh interface portproxy show all
```

#### 3. ファイアウォールの確認

```powershell
# ファイアウォールルールを確認
Get-NetFirewallRule -DisplayName "*WSL*"
```

#### 4. Dockerコンテナの確認

```bash
# WSL2内で実行
docker compose ps
docker compose logs
```

#### 5. ポートが開いているか確認

```bash
# WSL2内で実行
netstat -tuln | grep 3000
netstat -tuln | grep 4000
```

### ポートフォワーディングの削除

不要になった場合：

```powershell
# PowerShellを管理者権限で実行
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
netsh interface portproxy delete v4tov4 listenport=4000 listenaddress=0.0.0.0

# ファイアウォールルールも削除
Remove-NetFirewallRule -DisplayName "WSL Dashboard 3000"
Remove-NetFirewallRule -DisplayName "WSL GraphQL 4000"
```

---

## 📱 アクセス方法

設定後、他のパソコンやスマートフォンから以下のURLでアクセスできます：

```
http://192.168.1.100:3000?staffId=admin001
```

（`192.168.1.100` は実際のWindowsホストのIPアドレスに置き換えてください）

### WindowsホストのIPアドレス確認

PowerShellで：

```powershell
ipconfig | Select-String "IPv4"
```

または

```powershell
Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Select-Object IPAddress
```

---

## ⚡ クイックセットアップ（コピペ用）

### 方法A: スクリプトを使用（推奨）

PowerShellを管理者権限で開いて、プロジェクトディレクトリで実行：

```powershell
cd C:\path\to\DockerDashBord
.\wsl-port-forward.ps1
```

### 方法B: 手動コマンド

PowerShellを管理者権限で開いて、以下を実行：

```powershell
# WSL2のメインIPアドレスを取得（最初のIPのみ）
$wsl_ip = (wsl hostname -I).trim().Split()[0]
Write-Host "WSL2 IP: $wsl_ip"

# 既存設定を削除
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=4000 listenaddress=0.0.0.0 2>$null

# ポートフォワーディング設定
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=$wsl_ip

# ファイアウォール設定
New-NetFirewallRule -DisplayName "WSL Dashboard 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "WSL GraphQL 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

# 確認
Write-Host "Setup complete! WSL2 IP: $wsl_ip"
netsh interface portproxy show all
```

**注意**: WSL2は複数のIPアドレスを返すことがありますが、`.Split()[0]` で最初のIPアドレス（メインIP）のみを使用します。

---

## 🔐 セキュリティ注意事項

- ポートフォワーディングは `0.0.0.0`（すべてのインターフェース）でリッスンするため、同じネットワーク上のすべてのデバイスからアクセス可能になります
- 本番環境では、特定のIPアドレスのみ許可するように設定してください
- 不要な場合は、ポートフォワーディングとファイアウォールルールを削除してください

---

## 📞 サポート

問題が解決しない場合は、以下の情報を確認してください：

1. Windowsのバージョン: `winver`
2. WSL2のバージョン: `wsl --version`
3. WSL2のIPアドレス: `wsl hostname -I`
4. ポートフォワーディングの状態: `netsh interface portproxy show all`
5. ファイアウォールの状態: `Get-NetFirewallRule -DisplayName "*WSL*"`
6. Dockerコンテナの状態: `docker compose ps`
