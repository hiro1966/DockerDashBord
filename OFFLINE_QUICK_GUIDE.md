# 📦 オフライン移行クイックガイド

オフラインのUbuntu環境に移行するための最短手順です。

## 🎯 手順概要

```
オンライン環境 → エクスポート → USB転送 → オフライン環境 → インポート → 起動
```

---

## 📤 オンライン環境（現在のマシン）

### ワンコマンドでエクスポート

```bash
cd /home/user/webapp
./export-for-offline.sh
```

エクスポート先: `~/hospital-offline-export/`

### 手動エクスポート

```bash
cd /home/user/webapp

# 1. Dockerイメージをビルド
docker compose build

# 2. イメージをエクスポート
docker save -o ~/hospital-all-images.tar \
  $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "dashboard|graphql") \
  postgres:15-alpine

# 3. プロジェクトを圧縮
cd /home/user
tar -czf ~/webapp-project.tar.gz \
  --exclude='webapp/dashboard/node_modules' \
  --exclude='webapp/graphql-server/node_modules' \
  --exclude='webapp/.git' \
  webapp/
```

### USBにコピー

以下をUSBメモリにコピー：
- `~/hospital-offline-export/` フォルダ全体

または：
- `hospital-all-images.tar`（約500MB-1GB）
- `webapp-project.tar.gz`（数MB）
- `import-offline.sh`
- `OFFLINE_MIGRATION.md`

---

## 📥 オフライン環境（Ubuntu）

### 前提条件

Dockerがインストールされている必要があります。

#### Dockerの確認

```bash
docker --version
docker compose version
```

インストールされていない場合は、`OFFLINE_MIGRATION.md` のDocker オフラインインストール手順を参照してください。

### ワンコマンドでインポート

```bash
# USBからファイルをコピー
cp -r /media/$USER/USB/hospital-offline-export ~/

# インポート実行
cd ~/hospital-offline-export
./import-offline.sh
```

### 手動インポート

```bash
# 1. Dockerイメージをロード
sudo docker load -i hospital-all-images.tar

# 2. プロジェクトを展開
cd ~
tar -xzf hospital-offline-export/webapp-project.tar.gz

# 3. 起動
cd ~/webapp
sudo docker compose up -d

# 4. 確認
sudo docker compose ps
```

---

## 🌐 アクセス

ブラウザで開く：

```
http://localhost:3000?staffId=admin001
```

### テストユーザー

- **管理者**: `admin001` （権限レベル 99）
- **事務部長**: `director001` （権限レベル 90）
- **医師**: `doctor001` （権限レベル 10）

---

## 🛠️ よく使うコマンド

### 起動・停止

```bash
cd ~/webapp

# 起動
sudo docker compose up -d

# 停止
sudo docker compose down

# ログ確認
sudo docker compose logs -f

# ステータス確認
sudo docker compose ps
```

### データのリセット

```bash
cd ~/webapp
sudo docker compose down -v  # ボリュームも削除
sudo docker compose up -d    # 再起動（初期データが再投入される）
```

---

## 📏 必要なディスク容量

- Dockerイメージ: 約 500MB - 1GB
- プロジェクトファイル: 約 10MB
- Docker実行時: 約 2GB（ボリューム含む）

**合計**: 約 3-4GB

---

## 🔍 トラブルシューティング

### ポートが既に使用されている

```bash
# ポート確認
sudo netstat -tulpn | grep -E '3000|4000|5432'

# PostgreSQLが動いている場合
sudo systemctl stop postgresql
```

### 権限エラー

```bash
# dockerグループに追加
sudo usermod -aG docker $USER

# ログアウト・ログインまたは
newgrp docker
```

### コンテナが起動しない

```bash
# ログ確認
sudo docker compose logs

# 再起動
sudo docker compose down
sudo docker compose up -d
```

---

## 📞 サポート情報

詳細なトラブルシューティングは `OFFLINE_MIGRATION.md` を参照してください。

システム情報の確認：

```bash
# OS情報
lsb_release -a

# Docker情報
docker --version
docker compose version

# ディスク容量
df -h

# イメージ一覧
docker images

# コンテナ一覧
docker ps -a
```

---

## ✅ チェックリスト

### オンライン環境

- [ ] `export-for-offline.sh` を実行
- [ ] `~/hospital-offline-export/` フォルダを確認
- [ ] USBメモリにコピー

### オフライン環境

- [ ] Dockerがインストールされている
- [ ] 十分なディスク容量がある（5GB以上推奨）
- [ ] `import-offline.sh` を実行
- [ ] ブラウザでアクセス確認

---

## 🎉 完了！

オフライン環境で病院管理ダッシュボードが動作しています。

**重要**: 本番環境で使用する場合は、セキュリティ設定を必ず見直してください。
