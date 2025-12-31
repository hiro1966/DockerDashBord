# 🚚 オフラインUbuntu環境への移行ガイド

このガイドでは、病院管理ダッシュボードシステムをオフラインのUbuntu環境に移行する方法を説明します。

## 📋 概要

オフライン環境では、以下の2つの方法があります：

1. **方法1**: Dockerイメージをエクスポート/インポート（推奨・軽量）
2. **方法2**: プロジェクトファイル + Dockerイメージを全て持ち込む（確実）

---

## 🎯 方法1: Dockerイメージのエクスポート/インポート（推奨）

この方法は最も効率的で、必要なファイルのみを移行します。

### Step 1: オンライン環境（現在のマシン）での準備

#### 1-1. プロジェクトをビルド

```bash
cd /home/user/webapp
docker compose build
```

#### 1-2. Dockerイメージを確認

```bash
docker images | grep -E "hospital|postgres"
```

以下のようなイメージが表示されます：

```
webapp-dashboard              latest    ...
webapp-graphql-server         latest    ...
postgres                      15-alpine ...
```

#### 1-3. Dockerイメージをエクスポート

```bash
cd /home/user/webapp

# 各イメージをtarファイルに保存
docker save -o hospital-dashboard.tar webapp-dashboard:latest
docker save -o hospital-graphql-server.tar webapp-graphql-server:latest
docker save -o postgres-15-alpine.tar postgres:15-alpine

# または、すべてを1つのファイルに（推奨）
docker save -o hospital-all-images.tar \
  webapp-dashboard:latest \
  webapp-graphql-server:latest \
  postgres:15-alpine

# ファイルサイズ確認
ls -lh *.tar
```

#### 1-4. プロジェクトファイルをアーカイブ

```bash
cd /home/user

# プロジェクトファイルをtar.gzに圧縮（node_modulesを除外）
tar -czf webapp-project.tar.gz \
  --exclude='webapp/dashboard/node_modules' \
  --exclude='webapp/graphql-server/node_modules' \
  --exclude='webapp/.git' \
  webapp/

# ファイルサイズ確認
ls -lh webapp-project.tar.gz
```

#### 1-5. 必要なファイルをUSB/外部ストレージにコピー

以下のファイルを用意：

```
移行用ファイル一覧：
├── hospital-all-images.tar        # Dockerイメージ（約500MB-1GB）
├── webapp-project.tar.gz          # プロジェクトファイル（数MB）
└── install-docker-offline.sh     # Dockerインストールスクリプト（後述）
```

### Step 2: オフライン環境（Ubuntu）での準備

#### 2-1. Dockerのインストール（オフライン）

**オンライン環境で事前にDockerパッケージをダウンロード：**

```bash
# オンライン環境で実行
mkdir docker-offline-packages
cd docker-offline-packages

# Ubuntu 22.04の場合
wget https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/containerd.io_1.6.24-1_amd64.deb
wget https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/docker-ce_24.0.7-1~ubuntu.22.04~jammy_amd64.deb
wget https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/docker-ce-cli_24.0.7-1~ubuntu.22.04~jammy_amd64.deb
wget https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/docker-buildx-plugin_0.11.2-1~ubuntu.22.04~jammy_amd64.deb
wget https://download.docker.com/linux/ubuntu/dists/jammy/pool/stable/amd64/docker-compose-plugin_2.21.0-1~ubuntu.22.04~jammy_amd64.deb

# Ubuntu 20.04の場合は "jammy" を "focal" に置き換え

# tarファイルにまとめる
cd ..
tar -czf docker-offline-packages.tar.gz docker-offline-packages/
```

**オフライン環境でインストール：**

```bash
# USBから移行用ファイルをコピー
mkdir -p ~/hospital-migration
cd ~/hospital-migration
# （USBからファイルをコピー）

# Dockerパッケージを展開
tar -xzf docker-offline-packages.tar.gz
cd docker-offline-packages

# Dockerをインストール
sudo dpkg -i containerd.io_*.deb
sudo dpkg -i docker-ce-cli_*.deb
sudo dpkg -i docker-ce_*.deb
sudo dpkg -i docker-buildx-plugin_*.deb
sudo dpkg -i docker-compose-plugin_*.deb

# Dockerサービスを開始
sudo systemctl start docker
sudo systemctl enable docker

# 確認
sudo docker --version
sudo docker compose version

# 現在のユーザーをdockerグループに追加（再ログイン後に有効）
sudo usermod -aG docker $USER
```

#### 2-2. Dockerイメージをインポート

```bash
cd ~/hospital-migration

# Dockerイメージを読み込む
sudo docker load -i hospital-all-images.tar

# 確認
sudo docker images
```

#### 2-3. プロジェクトファイルを展開

```bash
cd ~
tar -xzf ~/hospital-migration/webapp-project.tar.gz

# 確認
ls -la webapp/
```

### Step 3: オフライン環境でアプリケーションを起動

```bash
cd ~/webapp

# Dockerコンテナを起動
sudo docker compose up -d

# ログ確認
sudo docker compose logs -f

# ステータス確認
sudo docker compose ps
```

### Step 4: アクセス確認

ブラウザで以下のURLを開く：

```
http://localhost:3000?staffId=admin001
```

---

## 🎯 方法2: すべてをゼロから構築（Docker未インストールの場合）

### Step 1: 必要なファイルの準備（オンライン環境）

#### 1-1. プロジェクトファイルをアーカイブ

```bash
cd /home/user
tar -czf webapp-full.tar.gz webapp/
```

#### 1-2. 必要なDockerイメージを事前ダウンロード

```bash
# ベースイメージをpull
docker pull node:20-alpine
docker pull postgres:15-alpine

# 保存
docker save -o node-20-alpine.tar node:20-alpine
docker save -o postgres-15-alpine.tar postgres:15-alpine
```

#### 1-3. Node.js依存関係を事前ダウンロード

```bash
cd /home/user/webapp

# GraphQLサーバーの依存関係
cd graphql-server
npm pack $(npm list --parseable | tail -n +2 | xargs -I {} basename {})
tar -czf ../graphql-server-deps.tar.gz node_modules/
cd ..

# ダッシュボードの依存関係
cd dashboard
tar -czf ../dashboard-deps.tar.gz node_modules/
cd ..
```

### Step 2: オフライン環境での構築

```bash
# プロジェクトを展開
tar -xzf webapp-full.tar.gz
cd webapp

# ベースイメージをロード
sudo docker load -i node-20-alpine.tar
sudo docker load -i postgres-15-alpine.tar

# 依存関係を復元
cd graphql-server
tar -xzf ../graphql-server-deps.tar.gz
cd ..

cd dashboard
tar -xzf ../dashboard-deps.tar.gz
cd ..

# Dockerイメージをビルド
sudo docker compose build

# 起動
sudo docker compose up -d
```

---

## 📦 方法3: docker-compose.ymlを使わずに手動起動

完全にオフラインで、docker-composeが使えない場合：

### ネットワークを作成

```bash
sudo docker network create hospital-network
```

### PostgreSQLコンテナを起動

```bash
sudo docker run -d \
  --name hospital-postgres \
  --network hospital-network \
  -e POSTGRES_DB=hospital_db \
  -e POSTGRES_USER=hospital_user \
  -e POSTGRES_PASSWORD=hospital_pass \
  -v $(pwd)/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

### GraphQLサーバーコンテナを起動

```bash
sudo docker run -d \
  --name hospital-graphql-server \
  --network hospital-network \
  -e DB_HOST=hospital-postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=hospital_db \
  -e DB_USER=hospital_user \
  -e DB_PASSWORD=hospital_pass \
  -e PORT=4000 \
  -p 4000:4000 \
  webapp-graphql-server:latest
```

### ダッシュボードコンテナを起動

```bash
sudo docker run -d \
  --name hospital-dashboard \
  --network hospital-network \
  -p 3000:3000 \
  webapp-dashboard:latest
```

---

## 🔧 トラブルシューティング

### イメージのロードに失敗する

```bash
# イメージファイルの整合性を確認
md5sum hospital-all-images.tar

# 再度ロードを試みる
sudo docker load -i hospital-all-images.tar --quiet=false
```

### 権限エラーが発生する

```bash
# dockerグループに追加
sudo usermod -aG docker $USER

# セッションを更新（またはログアウト/ログイン）
newgrp docker

# sudoなしで実行
docker compose up -d
```

### ポートが既に使用されている

```bash
# ポート使用状況を確認
sudo netstat -tulpn | grep -E '3000|4000|5432'

# 使用中のプロセスを停止
sudo systemctl stop postgresql  # PostgreSQLが既にインストールされている場合

# docker-compose.ymlでポートを変更
# ports:
#   - "3001:3000"  # 3000 -> 3001に変更
```

### コンテナが起動しない

```bash
# ログを確認
sudo docker compose logs

# 個別コンテナのログ
sudo docker logs hospital-postgres
sudo docker logs hospital-graphql-server
sudo docker logs hospital-dashboard

# コンテナを再作成
sudo docker compose down -v
sudo docker compose up -d
```

---

## 📋 チェックリスト

### オンライン環境で準備するもの

- [ ] `hospital-all-images.tar` - Dockerイメージ
- [ ] `webapp-project.tar.gz` - プロジェクトファイル
- [ ] `docker-offline-packages.tar.gz` - Dockerインストールパッケージ
- [ ] このガイド（OFFLINE_MIGRATION.md）

### オフライン環境で確認すること

- [ ] Dockerがインストールされているか: `docker --version`
- [ ] Docker Composeがインストールされているか: `docker compose version`
- [ ] 十分なディスク容量があるか: `df -h`（最低5GB推奨）
- [ ] ポート 3000, 4000, 5432 が空いているか: `netstat -tulpn`

---

## 🎯 推奨される移行フロー

1. **オンライン環境**
   - Dockerイメージをビルド
   - イメージをtarファイルにエクスポート
   - プロジェクトファイルを圧縮
   - USBメモリにコピー

2. **オフライン環境**
   - Dockerをインストール（必要に応じて）
   - Dockerイメージをインポート
   - プロジェクトファイルを展開
   - `docker compose up -d` で起動

3. **動作確認**
   - ブラウザでアクセス
   - データが正常に表示されるか確認

---

## 📞 サポート

問題が発生した場合は、以下の情報を確認してください：

- Ubuntuのバージョン: `lsb_release -a`
- Dockerのバージョン: `docker --version`
- Docker Composeのバージョン: `docker compose version`
- ディスク容量: `df -h`
- ログ: `docker compose logs`

---

## 🔐 セキュリティ注意事項

- オフライン環境でも、デフォルトのパスワードは変更することを推奨します
- `docker-compose.yml` 内の環境変数を変更してください
- 本番環境では、適切な認証とアクセス制御を実装してください
