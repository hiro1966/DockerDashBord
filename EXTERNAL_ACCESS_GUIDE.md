# 他端末からのアクセス設定ガイド

## 🌐 概要

他の端末（スマホ、タブレット、別のPC）から病院管理ダッシュボードにアクセスする方法を説明します。

---

## ✅ 解決済み：Nginxリバースプロキシの導入

### 問題
他端末からアクセスすると、認証時に `http://localhost:4000/graphql` への接続エラー（ERR_CONNECTION_REFUSED）が発生していました。

### 原因
- フロントエンドが `localhost:4000` にアクセスしようとしていた
- 他端末から見ると `localhost` は自分自身を指すため接続できない

### 解決策
**Nginxリバースプロキシを導入**し、すべてのアクセスを同じポート（80番）経由にしました。

```
他端末
  ↓
http://192.168.1.100/          → Nginx → Dashboard (3000)
http://192.168.1.100/graphql   → Nginx → GraphQL (4000)
```

---

## 🚀 セットアップ手順

### 1. 最新のコードを取得

```bash
cd ~/DockerDashBord  # または /home/user/webapp
git pull origin main
```

### 2. Dockerコンテナを再起動

```bash
# 既存のコンテナを停止
docker compose down

# 新しい構成で起動（Nginxも含む）
docker compose up -d --build
```

### 3. 起動確認

```bash
docker compose ps
```

**期待される出力:**
```
NAME                      STATUS
hospital-postgres         Up
hospital-graphql-server   Up
hospital-dashboard        Up
hospital-nginx            Up  ← 追加された
```

### 4. ログ確認（任意）

```bash
docker compose logs -f nginx
```

---

## 📱 アクセス方法

### 同じネットワーク内からのアクセス

#### 1. サーバーのIPアドレスを確認

**Linux/Mac:**
```bash
hostname -I
# または
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**WSL2（Windows）:**
```bash
wsl hostname -I
```

例: `192.168.1.100`

#### 2. ブラウザでアクセス

**ダッシュボード:**
```
http://192.168.1.100/?staffId=admin001
```

**GraphQL Playground:**
```
http://192.168.1.100/graphql
```

**注意:** ポート番号（`:3000`、`:4000`）は不要になりました！

---

## 🔧 ポート設定

### Nginxリバースプロキシを使用する場合（推奨）

| サービス | 外部ポート | 内部ポート | URL |
|---------|----------|-----------|-----|
| Nginx | 80 | - | `http://<IP>/` |
| Dashboard | - | 3000 | Nginx経由 |
| GraphQL | - | 4000 | Nginx経由（`/graphql`） |
| PostgreSQL | 5432 | 5432 | 直接アクセス不可（Docker内部のみ） |

### 直接アクセスする場合（レガシー）

もし直接アクセスしたい場合は、環境変数を設定：

```bash
# dashboard/.env を作成
echo "VITE_GRAPHQL_URL=http://192.168.1.100:4000/graphql" > dashboard/.env

# 再ビルド
docker compose up -d --build dashboard
```

アクセス:
- ダッシュボード: `http://192.168.1.100:3000/?staffId=admin001`
- GraphQL: `http://192.168.1.100:4000/graphql`

---

## 🔥 ファイアウォール設定

### Linux（Ubuntu/Debian）

```bash
# ポート80を開放
sudo ufw allow 80/tcp

# ファイアウォールの状態確認
sudo ufw status
```

### Windows（WSL2の場合）

**PowerShell（管理者権限）:**
```powershell
# ポート80を開放
New-NetFirewallRule -DisplayName "Hospital Dashboard" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# WSL2のポート転送（必要な場合）
$wsl_ip = (wsl hostname -I).trim().Split()[0]
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=$wsl_ip
```

詳細: [WSL_NETWORK_ACCESS.md](./WSL_NETWORK_ACCESS.md)

---

## 🧪 接続テスト

### 1. ローカルでテスト

```bash
# ダッシュボード
curl -I http://localhost/

# GraphQL
curl -X POST http://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### 2. 他端末からテスト

**スマホ/タブレットのブラウザで:**
```
http://<サーバーのIP>/
```

**他のPCから:**
```bash
# ダッシュボード
curl -I http://192.168.1.100/

# GraphQL
curl -X POST http://192.168.1.100/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

---

## 🚨 トラブルシューティング

### 問題1: Nginxコンテナが起動しない

**症状:**
```bash
docker compose ps
# hospital-nginx -> Exited (1)
```

**解決策:**
```bash
# ログを確認
docker compose logs nginx

# ポート80が使用中の場合
sudo lsof -i :80
# または
sudo netstat -tuln | grep :80

# 使用中のプロセスを停止してから再起動
docker compose down
docker compose up -d
```

### 問題2: GraphQL接続エラー

**症状:**
ブラウザのコンソールに `ERR_CONNECTION_REFUSED` エラー

**確認:**
```bash
# GraphQLサーバーが起動しているか
docker compose ps graphql-server

# Nginxのログを確認
docker compose logs -f nginx

# GraphQLサーバーのログを確認
docker compose logs -f graphql-server
```

**解決策:**
```bash
# コンテナを再起動
docker compose restart graphql-server
docker compose restart nginx
```

### 問題3: ポート80がすでに使用されている

**症状:**
```
Error: bind: address already in use
```

**解決策1: 別のポートを使用**

`docker-compose.yml` を編集:
```yaml
nginx:
  ports:
    - "0.0.0.0:8080:80"  # 80 → 8080 に変更
```

アクセス: `http://192.168.1.100:8080/`

**解決策2: 既存のサービスを停止**

```bash
# Apache/Nginxが起動している場合
sudo systemctl stop apache2
sudo systemctl stop nginx

# Docker以外のWebサーバーを確認
sudo lsof -i :80
```

### 問題4: 他端末から接続できない

**チェックリスト:**
- [ ] サーバーとクライアントが同じネットワークにいるか？
- [ ] ファイアウォールでポート80が開放されているか？
- [ ] サーバーのIPアドレスは正しいか？
- [ ] すべてのDockerコンテナが起動しているか？

**確認コマンド:**
```bash
# 1. 同じネットワークかを確認
ip addr show

# 2. ファイアウォール確認
sudo ufw status

# 3. IPアドレス確認
hostname -I

# 4. コンテナ確認
docker compose ps
```

---

## 📊 ネットワーク構成図

### Nginxリバースプロキシあり（推奨）

```
外部クライアント
    ↓
   :80
    ↓
[Nginx] -------→ [Dashboard:3000] (React)
   |
   └----------→ [GraphQL:4000] (GraphQL Yoga)
                     ↓
                [PostgreSQL:5432]
```

**利点:**
- ✅ 単一ポート（80）でアクセス
- ✅ CORS問題が発生しない
- ✅ SSL/TLS終端が容易
- ✅ 負荷分散が可能

### 直接アクセス（レガシー）

```
外部クライアント
    ↓
   :3000              :4000
    ↓                  ↓
[Dashboard] ----→ [GraphQL]
                     ↓
                [PostgreSQL:5432]
```

**欠点:**
- ❌ 複数のポートを開放する必要がある
- ❌ CORS設定が複雑
- ❌ ファイアウォール設定が複雑

---

## 🔒 セキュリティ考慮事項

### 本番環境での推奨設定

1. **HTTPS/TLSの有効化**
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/private/server.key;
    # ...
}
```

2. **アクセス制限**
```nginx
# 特定のIPのみ許可
location / {
    allow 192.168.1.0/24;
    deny all;
    # ...
}
```

3. **Basic認証**
```nginx
location / {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    # ...
}
```

---

## 📖 関連ドキュメント

- [WSL_NETWORK_ACCESS.md](./WSL_NETWORK_ACCESS.md) - WSL2環境でのネットワーク設定
- [NETWORK_ACCESS.md](./NETWORK_ACCESS.md) - 通常のDocker環境でのネットワーク設定
- [README.md](./README.md) - プロジェクト概要
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティング

---

## ✅ まとめ

### セットアップ手順（再掲）

```bash
# 1. 最新のコードを取得
git pull origin main

# 2. コンテナを再起動
docker compose down
docker compose up -d --build

# 3. IPアドレスを確認
hostname -I

# 4. ブラウザでアクセス
# http://<IP>/?staffId=admin001
```

### アクセスURL

| 用途 | URL | ポート |
|-----|-----|-------|
| ダッシュボード | `http://<IP>/` | 80 |
| GraphQL Playground | `http://<IP>/graphql` | 80 |

### 問題が解決しない場合

1. **Nginxログを確認:**
   ```bash
   docker compose logs -f nginx
   ```

2. **デバッグツールを実行:**
   ```bash
   ./debug-auth.sh admin001
   ```

3. **Issue を作成:**
   https://github.com/hiro1966/DockerDashBord/issues

これで、他端末からも快適にアクセスできるようになりました！ 🎉
