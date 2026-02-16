# 他端末アクセス問題の完全解決

## ✅ 問題

他の端末からダッシュボードにアクセスすると、認証のタイミングで以下のエラーが発生：

```
http://localhost:4000/graphql - ERR_CONNECTION_REFUSED
```

---

## 🔍 原因

### 技術的な詳細

1. **フロントエンドのGraphQL設定**
   - ブラウザ（クライアント側）が `localhost:4000` に直接アクセスしようとしていた
   - `localhost` は常に「自分自身」を指すため、他端末から見ると自分のPC内部を探してしまう

2. **ネットワーク構成**
   ```
   他端末のブラウザ
     ↓ http://192.168.1.100:3000 にアクセス（成功）
   ダッシュボード表示
     ↓ http://localhost:4000/graphql にアクセス（失敗）
   エラー: ERR_CONNECTION_REFUSED
   ```

3. **問題のコード（修正前）**
   ```javascript
   // dashboard/src/main.jsx
   const hostname = window.location.hostname  // 192.168.1.100
   return `${protocol}//${hostname}:4000/graphql`  // ポート4000が別で必要
   ```

---

## ✅ 解決策：Nginxリバースプロキシの導入

### アーキテクチャの変更

**修正前（問題あり）:**
```
他端末
  ↓ :3000
[Dashboard] ----X---→ :4000 [GraphQL]  ← アクセスできない
```

**修正後（正常）:**
```
他端末
  ↓ :80
[Nginx] -------→ :3000 [Dashboard]
   |
   └----------→ :4000 [GraphQL]
```

すべてのアクセスが**単一のエントリーポイント（Nginx）**を経由するため、他端末からも問題なくアクセスできます。

---

## 🚀 実装内容

### 1. Nginxコンテナの追加

**`nginx/Dockerfile`**
```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`nginx/nginx.conf`**
```nginx
upstream dashboard {
    server dashboard:3000;
}

upstream graphql {
    server graphql-server:4000;
}

server {
    listen 80;
    
    # ダッシュボード
    location / {
        proxy_pass http://dashboard;
        # WebSocket サポート
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
    
    # GraphQL API
    location /graphql {
        proxy_pass http://graphql;
        # CORS 対応
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}
```

### 2. Docker Compose設定の更新

**`docker-compose.yml`**
```yaml
services:
  # ... 既存のサービス ...
  
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: hospital-nginx
    ports:
      - "0.0.0.0:80:80"  # ポート80でリッスン
    depends_on:
      - dashboard
      - graphql-server
    restart: unless-stopped
```

### 3. フロントエンドの修正

**`dashboard/src/main.jsx`（修正後）**
```javascript
const getGraphQLUrl = () => {
  if (import.meta.env.VITE_GRAPHQL_URL) {
    return import.meta.env.VITE_GRAPHQL_URL
  }
  
  // Nginxリバースプロキシを使用
  // 同じホスト・ポートで /graphql パスにアクセス
  const protocol = window.location.protocol
  const host = window.location.host  // hostname + port
  return `${protocol}//${host}/graphql`
}
```

**動作:**
- ダッシュボードが `http://192.168.1.100/` でアクセスされると
- GraphQL APIは `http://192.168.1.100/graphql` になる
- **同じホスト、同じポート**のため、他端末からも問題なくアクセス可能

---

## 📊 ネットワークフロー

### 修正後の完全なフロー

```
【他端末のブラウザ】
     ↓
  http://192.168.1.100/
     ↓
【Nginx :80】
     ├─ / → dashboard:3000（React）
     └─ /graphql → graphql-server:4000（GraphQL Yoga）
            ↓
     【PostgreSQL :5432】
```

### リクエストの例

1. **ダッシュボードへのアクセス**
   ```
   ブラウザ: GET http://192.168.1.100/
   Nginx: proxy_pass http://dashboard:3000/
   Dashboard: Reactアプリを返す
   ```

2. **職員認証（GraphQL）**
   ```
   ブラウザ: POST http://192.168.1.100/graphql
   Nginx: proxy_pass http://graphql-server:4000/graphql
   GraphQL: verifyStaff クエリを実行
   ```

---

## 🎯 セットアップ手順

### 1. 最新のコードを取得

```bash
cd ~/DockerDashBord  # または /home/user/webapp
git pull origin main
```

### 2. 既存のコンテナを停止

```bash
docker compose down
```

### 3. 新しい構成で起動

```bash
docker compose up -d --build
```

### 4. 起動確認

```bash
docker compose ps
```

**期待される出力:**
```
NAME                      STATUS
hospital-postgres         Up
hospital-graphql-server   Up
hospital-dashboard        Up
hospital-nginx            Up  ← 新しく追加
```

### 5. ログ確認

```bash
# すべてのログ
docker compose logs -f

# Nginxのログのみ
docker compose logs -f nginx
```

---

## 📱 アクセス方法

### サーバーのIPアドレスを確認

```bash
hostname -I
# 例: 192.168.1.100
```

### ブラウザでアクセス

**ダッシュボード:**
```
http://192.168.1.100/?staffId=admin001
```

**GraphQL Playground:**
```
http://192.168.1.100/graphql
```

**注意:** ポート番号（`:3000`、`:4000`）は**不要**になりました！

---

## 🔧 トラブルシューティング

### 問題1: Nginxコンテナが起動しない

```bash
# ログを確認
docker compose logs nginx

# ポート80が使用中の場合
sudo lsof -i :80

# Apache/Nginxを停止
sudo systemctl stop apache2
sudo systemctl stop nginx

# 再起動
docker compose down
docker compose up -d
```

### 問題2: GraphQL接続エラー

```bash
# GraphQLサーバーのログを確認
docker compose logs -f graphql-server

# Nginxのエラーログを確認
docker compose exec nginx cat /var/log/nginx/error.log

# コンテナを再起動
docker compose restart graphql-server nginx
```

### 問題3: ポート80がすでに使用されている

**docker-compose.yml を編集:**
```yaml
nginx:
  ports:
    - "0.0.0.0:8080:80"  # 80 → 8080 に変更
```

**アクセス:**
```
http://192.168.1.100:8080/
```

### 問題4: 他端末から接続できない

**チェックリスト:**
- [ ] ファイアウォールでポート80が開放されているか？
  ```bash
  sudo ufw allow 80/tcp
  sudo ufw status
  ```
- [ ] サーバーとクライアントが同じネットワークにいるか？
- [ ] すべてのDockerコンテナが起動しているか？
  ```bash
  docker compose ps
  ```

---

## 🔥 ファイアウォール設定

### Linux（Ubuntu/Debian）

```bash
# ポート80を開放
sudo ufw allow 80/tcp

# 確認
sudo ufw status
```

### Windows（WSL2）

**PowerShell（管理者権限）:**
```powershell
# ファイアウォールルールを追加
New-NetFirewallRule -DisplayName "Hospital Dashboard" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# WSL2のポート転送
$wsl_ip = (wsl hostname -I).trim().Split()[0]
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=$wsl_ip
```

---

## ✅ 利点

### Nginxリバースプロキシのメリット

1. **✅ 単一ポート（80）でアクセス**
   - ファイアウォール設定が簡単
   - 複数のポートを開放する必要がない

2. **✅ CORS問題が発生しない**
   - 同じオリジン（ホスト・ポート）からのアクセスになるため

3. **✅ SSL/TLS終端が容易**
   - Nginxで証明書を設定するだけで、すべてのサービスがHTTPS対応

4. **✅ 負荷分散が可能**
   - 将来的に複数のバックエンドサーバーを追加可能

5. **✅ セキュリティ向上**
   - バックエンドサービスを外部に公開する必要がない
   - Nginxでアクセス制限やBasic認証を設定可能

---

## 📖 関連ドキュメント

- **[EXTERNAL_ACCESS_GUIDE.md](./EXTERNAL_ACCESS_GUIDE.md)** - 詳細なアクセスガイド（推奨）
- **[WSL_NETWORK_ACCESS.md](./WSL_NETWORK_ACCESS.md)** - WSL2環境での設定
- **[README.md](./README.md)** - プロジェクト概要
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - トラブルシューティング

---

## 🔗 リポジトリ

**GitHub:** https://github.com/hiro1966/DockerDashBord  
**最新コミット:** `29069d6` - Nginxリバースプロキシを追加して他端末からのアクセスを改善

---

## 📝 まとめ

### 修正前の問題
- ❌ 他端末から `localhost:4000` にアクセスできない
- ❌ ERR_CONNECTION_REFUSED エラー
- ❌ 複数のポート（3000、4000）を開放する必要がある

### 修正後の状態
- ✅ 単一ポート（80）でアクセス可能
- ✅ すべてのサービスが正常に動作
- ✅ 他端末からも問題なく認証可能
- ✅ CORS問題なし
- ✅ 将来的な拡張が容易

### クイックスタート

```bash
# 1. 最新版を取得
git pull origin main

# 2. 起動
docker compose down
docker compose up -d --build

# 3. IPアドレスを確認
hostname -I

# 4. ブラウザでアクセス
# http://<IP>/?staffId=admin001
```

これで、他端末からも快適にアクセスできるようになりました！ 🎉
