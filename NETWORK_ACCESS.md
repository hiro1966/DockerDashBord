# 🌐 他のパソコンからアクセスする方法

このガイドでは、ローカルネットワーク上の他のパソコンから病院管理ダッシュボードにアクセスする方法を説明します。

## 📋 前提条件

- サーバーマシンと他のパソコンが**同じネットワーク**（Wi-Fi/LAN）に接続されている
- ファイアウォールでポート 3000, 4000 が許可されている

## 🚀 Step 1: サーバーのIPアドレスを確認

### Windows の場合

```cmd
ipconfig
```

**IPv4 アドレス**を確認してください（例: `192.168.1.100`）

### Mac の場合

```bash
ifconfig en0 | grep "inet "
```

または

```bash
ipconfig getifaddr en0
```

### Linux の場合

```bash
hostname -I
```

または

```bash
ip addr show
```

例: サーバーのIPアドレスが `192.168.1.100` の場合

## 🔧 Step 2: Docker設定の更新（既に対応済み）

`docker-compose.yml` は既に `0.0.0.0` でバインドされているため、すべてのネットワークインターフェースからアクセス可能です。

```yaml
ports:
  - "0.0.0.0:3000:3000"  # ダッシュボード
  - "0.0.0.0:4000:4000"  # GraphQL API
  - "0.0.0.0:5432:5432"  # PostgreSQL
```

また、フロントエンドは**動的にGraphQLサーバーのURLを構築**するため、どのIPアドレスからアクセスしても自動的に正しいGraphQLサーバーに接続されます。

## 🔥 Step 3: ファイアウォールの設定

### Windows Firewall

```powershell
# PowerShellを管理者権限で実行
netsh advfirewall firewall add rule name="Hospital Dashboard" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Hospital GraphQL" dir=in action=allow protocol=TCP localport=4000
```

または

1. 「Windows Defender ファイアウォール」を開く
2. 「詳細設定」をクリック
3. 「受信の規則」→「新しい規則」
4. 「ポート」を選択
5. TCPポート `3000, 4000` を許可

### Mac Firewall

1. システム環境設定 → セキュリティとプライバシー → ファイアウォール
2. 「ファイアウォールオプション」をクリック
3. Node.js や Docker を許可

または、ファイアウォールを一時的に無効化（テスト用）：

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

### Linux (UFW)

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp
sudo ufw reload
```

## 🌐 Step 4: 他のパソコンからアクセス

サーバーのIPアドレスが `192.168.1.100` の場合：

### ダッシュボードにアクセス

```
http://192.168.1.100:3000?staffId=admin001
```

または

```
http://192.168.1.100:3000?staffId=director001
```

### GraphQL Playgroundにアクセス

```
http://192.168.1.100:4000/graphql
```

## ✅ 動作確認

### 1. サーバーマシンで確認

```bash
# コンテナが起動しているか確認
docker compose ps

# すべてのサービスが "Up" になっているはず
```

### 2. 同じネットワーク上の他のPCで確認

ブラウザで以下のURLを開く：
- `http://192.168.1.100:3000` （IPアドレスは実際のものに置き換えてください）

### 3. 接続できない場合

#### サーバーマシンから自身にアクセスしてみる

```bash
# localhost で接続できるか確認
curl http://localhost:3000

# IPアドレスで接続できるか確認
curl http://192.168.1.100:3000
```

#### ネットワーク接続を確認

他のPCからサーバーにpingできるか確認：

```bash
ping 192.168.1.100
```

#### ポートが開いているか確認

```bash
# サーバーマシンで実行
netstat -an | grep 3000
netstat -an | grep 4000

# または
ss -tuln | grep 3000
ss -tuln | grep 4000
```

#### ファイアウォールログを確認

Windows:
```powershell
Get-EventLog -LogName Security | Where-Object {$_.EventID -eq 5157}
```

Linux:
```bash
sudo journalctl -u ufw
```

## 🔒 セキュリティ注意事項

### 本番環境での使用

本番環境や外部からアクセスする場合は、以下の対策を実施してください：

1. **HTTPSの有効化**
   - Let's Encrypt などで SSL証明書を取得
   - Nginx/Apache をリバースプロキシとして設定

2. **認証の強化**
   - パスワード認証の実装
   - JWT トークンの使用
   - セッション管理の強化

3. **ファイアウォールの適切な設定**
   - 必要なIPアドレスのみ許可
   - VPN経由でのアクセス

4. **PostgreSQLへの外部アクセスを制限**
   - docker-compose.yml でPostgreSQLのポートを内部のみに制限
   ```yaml
   ports:
     - "127.0.0.1:5432:5432"  # localhostのみ
   ```

## 📱 スマートフォンからのアクセス

スマートフォンも同じWi-Fiに接続していれば、ブラウザで以下のURLを開くだけでアクセスできます：

```
http://192.168.1.100:3000?staffId=admin001
```

## 🌍 インターネット経由でのアクセス（高度な設定）

### 方法1: ngrok（簡単・無料）

```bash
# ngrokをインストール
# https://ngrok.com/download

# ダッシュボードを公開
ngrok http 3000

# GraphQL APIを公開（別ターミナル）
ngrok http 4000
```

ngrokが生成するURLを使用してどこからでもアクセス可能になります。

### 方法2: Cloudflare Tunnel（推奨・無料）

```bash
# Cloudflare Tunnelをインストール
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

cloudflared tunnel --url http://localhost:3000
```

### 方法3: VPS/クラウドへのデプロイ

- AWS EC2
- Google Cloud Compute Engine
- DigitalOcean Droplet
- Heroku
- Vercel / Netlify (フロントエンドのみ)

## 🆘 トラブルシューティング

### エラー: "Failed to fetch"

**原因**: GraphQL サーバーに接続できない

**解決策**:
1. ブラウザの開発者ツール（F12）でコンソールを確認
2. GraphQL URLが正しいか確認（`console.log` に表示されます）
3. GraphQL サーバーが起動しているか確認

### エラー: "Network error"

**原因**: ネットワーク接続の問題

**解決策**:
1. 同じネットワークに接続しているか確認
2. ファイアウォールを確認
3. サーバーマシンのIPアドレスが正しいか確認

### エラー: "CORS policy"

**原因**: CORS設定の問題

**解決策**:
GraphQL サーバーは既に `origin: '*'` で設定されているため、通常は発生しません。
発生した場合は `graphql-server/index.js` の CORS設定を確認してください。

## 📞 サポート

問題が解決しない場合は、以下の情報を添えて報告してください：

1. サーバーマシンのOS
2. クライアントマシンのOS
3. エラーメッセージ（ブラウザの開発者ツールのコンソール）
4. `docker compose logs` の出力
5. ネットワーク構成（ルーター、VPN使用の有無など）
