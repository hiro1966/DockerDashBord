# 🚀 WSL2 → Ubuntu Docker 環境移行ガイド

## 📋 概要

WSL2上のDockerからネイティブUbuntu環境のDockerへプロジェクトを移行する手順です。

---

## 前提条件

### WSL2側（移行元）
- ✅ Dockerが起動している
- ✅ プロジェクトが正常に動作している
- ✅ 十分なディスク空き容量（約2GB以上）

### Ubuntu側（移行先）
- ✅ Docker + Docker Composeがインストール済み
- ✅ 十分なディスク空き容量（約5GB以上）
- ✅ USBメモリまたはネットワーク経由で転送可能

---

## 🎯 移行方法（3つの選択肢）

### 方法1: オフライン移行（推奨）⭐

USBメモリなどの物理メディアを使用

**メリット**: 
- ネットワーク不要
- 確実に移行できる
- 大容量でも安心

**デメリット**:
- USBメモリが必要（2GB以上推奨）

### 方法2: ネットワーク経由

scp/rsyncを使用してネットワーク転送

**メリット**:
- USBメモリ不要
- 高速（LAN環境の場合）

**デメリット**:
- ネットワーク設定が必要
- WSL2とUbuntuが同じネットワークにある必要

### 方法3: GitHubリポジトリ経由

プロジェクトファイルのみをGitで転送、Dockerイメージは再ビルド

**メリット**:
- 最もシンプル
- ファイルサイズが小さい

**デメリット**:
- Dockerイメージの再ビルドが必要
- ビルド時間がかかる

---

## 📦 方法1: オフライン移行（詳細手順）

### Phase 1: WSL2でエクスポート

#### 1-1. WSLターミナルを開く

```bash
wsl
cd ~/DockerDashBord
```

#### 1-2. エクスポートスクリプトを実行

```bash
# 実行権限を確認
chmod +x export-for-offline.sh

# エクスポート実行
./export-for-offline.sh
```

**実行結果**:
```
✅ Dockerイメージのエクスポート完了
✅ プロジェクトファイルのアーカイブ完了
✅ チェックサム作成完了

エクスポート先: ~/hospital-offline-export/
```

#### 1-3. エクスポートファイルを確認

```bash
ls -lh ~/hospital-offline-export/
```

**生成されるファイル**:
```
hospital-all-images.tar       # 500MB-1GB (Dockerイメージ)
webapp-project.tar.gz         # 数MB (プロジェクトファイル)
import-offline.sh             # インポートスクリプト
checksums.txt                 # チェックサムファイル
OFFLINE_MIGRATION.md          # 移行ガイド
README_OFFLINE.txt            # 使い方
```

#### 1-4. USBメモリへコピー

**Windows側でエクスプローラーを使用:**

1. エクスプローラーで以下のパスを開く:
   ```
   \\wsl$\Ubuntu-20.04\home\user1\hospital-offline-export
   ```

2. すべてのファイルをUSBメモリにコピー

**WSL側でコマンドを使用:**

```bash
# USBメモリのマウントポイントを確認
df -h | grep media

# コピー
cp -r ~/hospital-offline-export /mnt/usb/
# または
cp -r ~/hospital-offline-export /media/$USER/USB/
```

---

### Phase 2: Ubuntu側でインポート

#### 2-1. USBメモリからファイルをコピー

```bash
# USBメモリをマウント（自動マウントの場合はスキップ）
# 手動マウントの例:
# sudo mount /dev/sdb1 /mnt/usb

# ホームディレクトリにコピー
cp -r /media/$USER/USB/hospital-offline-export ~/
cd ~/hospital-offline-export
```

#### 2-2. Dockerのインストール確認

```bash
# Dockerがインストールされているか確認
docker --version
docker compose version

# インストールされていない場合は以下を参照
# OFFLINE_MIGRATION.md の「Dockerオフラインインストール」セクション
```

#### 2-3. インポート実行

**自動インポート（推奨）:**

```bash
chmod +x import-offline.sh
./import-offline.sh
```

**手動インポート:**

```bash
# 1. チェックサム確認
sha256sum -c checksums.txt

# 2. Dockerイメージをロード
sudo docker load -i hospital-all-images.tar

# 3. プロジェクトを展開
tar -xzf webapp-project.tar.gz -C ~/
cd ~/webapp

# 4. Docker Composeで起動
sudo docker compose up -d

# 5. 起動確認
sudo docker compose ps
```

#### 2-4. アクセス確認

```bash
# ブラウザで以下にアクセス
http://localhost:3000?staffId=admin001
```

---

## 📡 方法2: ネットワーク経由移行

### 前提条件

- WSL2とUbuntuが同じネットワークにある
- SSHでアクセス可能

### 2-1. WSL2側でエクスポート

```bash
cd ~/DockerDashBord
./export-for-offline.sh
```

### 2-2. Ubuntu側のIPアドレスを確認

Ubuntu側で実行:
```bash
ip addr show | grep inet
```

### 2-3. scpで転送

WSL2側で実行:
```bash
# Ubuntu側のユーザー名とIPアドレスを指定
scp -r ~/hospital-offline-export username@192.168.1.100:~/

# または rsync（推奨）
rsync -avz --progress ~/hospital-offline-export/ username@192.168.1.100:~/hospital-offline-export/
```

### 2-4. Ubuntu側でインポート

```bash
cd ~/hospital-offline-export
chmod +x import-offline.sh
./import-offline.sh
```

---

## 🐙 方法3: GitHub経由移行（軽量版）

### 3-1. WSL2側で最新版をプッシュ

```bash
cd ~/DockerDashBord
git add -A
git commit -m "移行前の最終コミット"
git push origin main
```

### 3-2. Ubuntu側でクローン

```bash
cd ~
git clone https://github.com/hiro1966/DockerDashBord.git
cd DockerDashBord
```

### 3-3. 依存関係をインストール

```bash
# サーバー
cd graphql-server && npm install

# ダッシュボード
cd ../dashboard && npm install

# E2Eテスト
cd ../e2e-tests && npm install && npx playwright install
```

### 3-4. Dockerでビルド・起動

```bash
cd ~/DockerDashBord
docker compose up -d --build
```

---

## ⚙️ Ubuntu側のDocker環境準備

### Dockerのインストール（必要な場合）

```bash
# 古いバージョンを削除
sudo apt-get remove docker docker-engine docker.io containerd runc

# 依存関係をインストール
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Dockerの公式GPGキーを追加
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# リポジトリを追加
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Dockerをインストール
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 現在のユーザーをdockerグループに追加
sudo usermod -aG docker $USER

# 再ログイン（またはログアウト/ログイン）
newgrp docker

# 動作確認
docker --version
docker compose version
```

---

## 🔍 トラブルシューティング

### 問題1: Dockerイメージのロードに失敗

**エラー:**
```
Error processing tar file: open /var/lib/docker/...: no space left on device
```

**解決策:**
```bash
# ディスク容量を確認
df -h

# 不要なDockerイメージ・コンテナを削除
docker system prune -a --volumes
```

### 問題2: 権限エラー

**エラー:**
```
permission denied while trying to connect to the Docker daemon socket
```

**解決策:**
```bash
# dockerグループに追加
sudo usermod -aG docker $USER

# 再ログインまたは
newgrp docker
```

### 問題3: ポートが使用中

**エラー:**
```
Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use
```

**解決策:**
```bash
# 使用中のポートを確認
sudo lsof -i :3000
sudo lsof -i :4000

# プロセスを停止
sudo kill -9 <PID>
```

---

## ✅ 移行チェックリスト

### WSL2側（移行元）
- [ ] プロジェクトが正常に動作している
- [ ] `./export-for-offline.sh` を実行
- [ ] エクスポートファイルが生成された
- [ ] USBメモリまたはネットワーク経由で転送

### Ubuntu側（移行先）
- [ ] Docker + Docker Composeがインストール済み
- [ ] ファイルをコピー完了
- [ ] `./import-offline.sh` を実行
- [ ] `docker compose ps` ですべてのサービスが Up
- [ ] ブラウザでアクセス確認

---

## 📊 移行時間の目安

| 方法 | 準備時間 | 転送時間 | 起動時間 | 合計 |
|-----|---------|---------|---------|------|
| オフライン（USB 2.0） | 5分 | 10-15分 | 2分 | **約20分** |
| オフライン（USB 3.0） | 5分 | 5分 | 2分 | **約12分** |
| ネットワーク（LAN） | 5分 | 3-5分 | 2分 | **約10分** |
| GitHub経由 | 2分 | 1分 | 10分（ビルド） | **約13分** |

---

## 🎯 推奨事項

### 移行方法の選択

- **通常の移行**: 方法1（オフライン移行）を推奨
- **LAN環境**: 方法2（ネットワーク経由）が最速
- **シンプル重視**: 方法3（GitHub経由）が最もシンプル

### データのバックアップ

移行前に以下をバックアップ推奨:
- PostgreSQLデータベース（本番データの場合）
- カスタム設定ファイル
- アップロードファイル（存在する場合）

---

## 📚 参考ドキュメント

- [OFFLINE_MIGRATION.md](./OFFLINE_MIGRATION.md) - オフライン移行の詳細
- [OFFLINE_QUICK_GUIDE.md](./OFFLINE_QUICK_GUIDE.md) - クイックガイド
- [README.md](./README.md) - プロジェクト全体のドキュメント

---

## まとめ

**最もシンプルな方法:**

1. WSL2で `./export-for-offline.sh` 実行
2. USBメモリにコピー
3. Ubuntu側で `./import-offline.sh` 実行
4. 完了！

これで環境の移行が完了します 🎉
