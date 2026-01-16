# 🚀 WSL2 → Ubuntu 移行クイックスタート

## ⚡ 最も簡単な3ステップ

```bash
# WSL2側
./export-for-offline.sh

# ファイルをUSBメモリにコピー

# Ubuntu側
./import-offline.sh
```

---

## 📋 詳細手順

### Step 1: WSL2側でエクスポート

#### 1-1. WSLターミナルを開く

```bash
# PowerShellまたはコマンドプロンプトで
wsl

# プロジェクトディレクトリへ移動
cd ~/DockerDashBord
```

#### 1-2. エクスポートスクリプトを実行

```bash
chmod +x export-for-offline.sh
./export-for-offline.sh
```

**⚠️ 注意**: Dockerが起動していることを確認してください
```bash
# Docker起動確認
docker compose ps

# 起動していない場合
docker compose up -d
```

**エクスポート完了後の表示:**
```
✅ Dockerイメージのエクスポート完了
✅ プロジェクトファイルのアーカイブ完了
✅ エクスポート先: ~/hospital-offline-export/

以下のファイルが生成されました:
- hospital-all-images.tar (約500MB-1GB)
- webapp-project.tar.gz (数MB)
- import-offline.sh
- checksums.txt
```

#### 1-3. エクスポートファイルの確認

```bash
ls -lh ~/hospital-offline-export/
```

---

### Step 2: ファイルの転送

#### 方法A: USBメモリ（推奨）

**Windowsエクスプローラーで:**

1. エクスプローラーのアドレスバーに入力:
   ```
   \\wsl$\Ubuntu-20.04\home\user1\hospital-offline-export
   ```

2. すべてのファイルを選択 → USBメモリにコピー

**WSLコマンドで:**

```bash
# USBメモリのマウントポイントを確認
df -h | grep media

# コピー
cp -r ~/hospital-offline-export /media/$USER/USB名/
```

#### 方法B: ネットワーク経由（LAN）

```bash
# Ubuntu側のIPアドレスを確認（Ubuntu側で実行）
ip addr show | grep inet

# WSL2側でrsyncを使用
rsync -avz --progress ~/hospital-offline-export/ username@192.168.1.100:~/hospital-offline-export/
```

---

### Step 3: Ubuntu側でインポート

#### 3-1. ファイルをコピー

```bash
# USBメモリから
cp -r /media/$USER/USB名/hospital-offline-export ~/

# ディレクトリへ移動
cd ~/hospital-offline-export
```

#### 3-2. Dockerの確認

```bash
# Dockerがインストールされているか確認
docker --version
docker compose version

# インストールされていない場合
# 以下のコマンドを実行（Ubuntu 20.04/22.04）
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

#### 3-3. インポート実行

```bash
chmod +x import-offline.sh
./import-offline.sh
```

**インポート完了後の表示:**
```
✅ チェックサム検証完了
✅ Dockerイメージロード完了
✅ プロジェクト展開完了
✅ Docker Compose起動完了

アクセス: http://localhost:3000?staffId=admin001
```

#### 3-4. アクセス確認

ブラウザで以下にアクセス:
```
http://localhost:3000?staffId=admin001
```

---

## 🔧 トラブルシューティング

### エラー1: Dockerの権限エラー

```bash
permission denied while trying to connect to the Docker daemon socket
```

**解決策:**
```bash
# dockerグループに追加
sudo usermod -aG docker $USER

# 再ログイン
newgrp docker

# または一度ログアウト/ログイン
```

### エラー2: ポートが使用中

```bash
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**解決策:**
```bash
# 使用中のプロセスを確認
sudo lsof -i :3000

# 停止
sudo kill -9 <PID>
```

### エラー3: ディスク容量不足

```bash
no space left on device
```

**解決策:**
```bash
# 容量確認
df -h

# 不要なDockerリソースを削除
docker system prune -a --volumes
```

---

## ⏱️ 所要時間

| ステップ | 時間 |
|---------|------|
| エクスポート | 5分 |
| USB転送（USB 3.0） | 5分 |
| インポート | 3分 |
| **合計** | **約13分** |

---

## ✅ チェックリスト

### エクスポート前
- [ ] WSL2でDockerが起動している
- [ ] プロジェクトが正常に動作している
- [ ] 十分なディスク空き容量（2GB以上）

### インポート前
- [ ] Ubuntu側にDockerがインストール済み
- [ ] 十分なディスク空き容量（5GB以上）
- [ ] 転送ファイルが全て揃っている

### 完了確認
- [ ] `docker compose ps` で全サービスが Up
- [ ] ブラウザでアクセスできる
- [ ] ログインできる（staffId=admin001）

---

## 💡 ヒント

### エクスポートファイルのサイズを確認

```bash
du -sh ~/hospital-offline-export/
```

### 圧縮してさらに小さく

```bash
cd ~
tar -czf hospital-offline-export.tar.gz hospital-offline-export/

# サイズ確認
ls -lh hospital-offline-export.tar.gz
```

### ネットワーク転送の進捗表示

```bash
rsync -avz --progress ~/hospital-offline-export/ user@host:~/hospital-offline-export/
```

---

## 📚 詳細ドキュメント

移行に関する詳細情報:
- [WSL_TO_UBUNTU_MIGRATION.md](./WSL_TO_UBUNTU_MIGRATION.md) - 完全ガイド
- [OFFLINE_MIGRATION.md](./OFFLINE_MIGRATION.md) - オフライン移行詳細
- [OFFLINE_QUICK_GUIDE.md](./OFFLINE_QUICK_GUIDE.md) - オフライン移行クイック

---

## まとめ

**最速の手順:**

```bash
# WSL2で
cd ~/DockerDashBord
./export-for-offline.sh

# USBメモリにコピー（Windowsエクスプローラー）
# \\wsl$\Ubuntu-20.04\home\user1\hospital-offline-export
# → USBメモリへコピー

# Ubuntu側で
cd ~/hospital-offline-export
./import-offline.sh

# 完了！
```

これで移行完了です 🎉
