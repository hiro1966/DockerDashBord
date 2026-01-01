# ❌ トラブルシューティング: よくあるエラーと解決方法

## 目次
1. [npm run test:all のエラー](#npm-run-testall-のエラー)
2. [E2Eテストのエラー](#e2eテストのエラー)
3. [Docker関連のエラー](#docker関連のエラー)
4. [WSL環境でのエラー](#wsl環境でのエラー)

---

## npm run test:all のエラー

### エラー: `ENOENT: no such file or directory, open 'package.json'`

```
npm error code ENOENT
npm error syscall open
npm error path \\wsl.localhost\Ubuntu-20.04\home\user1\DockerDashBord\package.json
npm error errno -4058
npm error enoent Could not read package.json
```

#### 原因
ルートディレクトリに`package.json`が存在しないため。

#### 解決策

**方法1: 最新版を取得（推奨）**
```bash
git pull origin main
```

**方法2: package.jsonを手動作成**
```bash
# プロジェクトルートで実行
cat > package.json << 'EOF'
{
  "name": "hospital-dashboard-root",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test:all": "npm run test:server && npm run test:client && npm run test:e2e",
    "test:server": "cd graphql-server && npm test",
    "test:client": "cd dashboard && npm test",
    "test:e2e": "cd e2e-tests && npm test"
  }
}
EOF
```

**方法3: 代替のテスト実行方法**
```bash
# シェルスクリプトを使用
./run-all-tests.sh  # Linux/Mac/WSL
run-all-tests.bat   # Windows
```

---

## E2Eテストのエラー

### エラー: `Test failed: Timeout 30000ms exceeded`

#### 原因
Dockerサービスが起動していない、またはページがロードされない。

#### 解決策

```bash
# 1. Dockerを起動
docker compose up -d

# 2. 起動確認
docker compose ps
# すべてのサービスが "Up" であることを確認

# 3. ブラウザでアクセス確認
# http://localhost:3000?staffId=admin001

# 4. ログを確認
docker compose logs -f

# 5. 問題があればリビルド
docker compose down
docker compose up -d --build
```

### エラー: `Error: browserType.launch: Executable doesn't exist`

#### 原因
Playwrightのブラウザがインストールされていない。

#### 解決策

```bash
cd e2e-tests
npx playwright install
```

---

## Docker関連のエラー

### エラー: `Cannot connect to the Docker daemon`

#### 原因
Dockerが起動していない、またはDocker daemonが実行されていない。

#### 解決策

**Windows/Mac:**
```bash
# Docker Desktopを起動
# またはタスクバー/メニューバーのDockerアイコンを確認
```

**Linux:**
```bash
# Docker serviceを起動
sudo systemctl start docker

# 起動確認
sudo systemctl status docker
```

**WSL:**
```bash
# Windows側でDocker Desktopが起動しているか確認
# WSLとの統合が有効になっているか確認
# Docker Desktop > Settings > Resources > WSL Integration
```

### エラー: `port is already allocated`

```
Error response from daemon: driver failed programming external connectivity:
Bind for 0.0.0.0:3000 failed: port is already allocated
```

#### 原因
ポート3000、4000、または5432が既に使用されている。

#### 解決策

```bash
# 1. 使用中のポートを確認
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Linux/Mac
lsof -i :3000
lsof -i :4000

# 2. プロセスを停止
# Windows（管理者権限のPowerShell）
Stop-Process -Id <PID>

# Linux/Mac
kill -9 <PID>

# 3. 既存のDockerコンテナを停止
docker compose down

# 4. 再起動
docker compose up -d
```

---

## WSL環境でのエラー

### エラー: `\\wsl.localhost\... path not found`

#### 原因
Windows側からWSLのパスにアクセスしようとしている。

#### 解決策

**WSL内で実行（推奨）:**
```bash
# WSLターミナルを開く
wsl

# プロジェクトディレクトリへ移動
cd ~/webapp  # または /home/user/webapp

# テストを実行
npm run test:all
```

**Windows側から実行する場合:**
```bash
# PowerShellで
wsl -d Ubuntu-20.04 -e bash -c "cd ~/webapp && npm run test:all"
```

### エラー: Docker network issues in WSL

#### 原因
WSL2のネットワーク設定の問題。

#### 解決策

```bash
# 1. WSLを再起動
# PowerShell（管理者権限）
wsl --shutdown
wsl

# 2. Dockerを再起動
docker compose down
docker compose up -d

# 3. ポートフォワーディングを再設定
# PowerShell（管理者権限）
.\wsl-port-forward.ps1
```

---

## テスト実行のベストプラクティス

### チェックリスト

実行前に以下を確認：

- [ ] 正しいディレクトリにいる（プロジェクトルート）
  ```bash
  pwd
  # 出力: /home/user/webapp または類似のパス
  ```

- [ ] package.jsonが存在する
  ```bash
  ls package.json
  ```

- [ ] 依存関係がインストールされている
  ```bash
  npm run install:all
  ```

- [ ] Dockerが起動している（E2Eテストの場合）
  ```bash
  docker compose ps
  ```

- [ ] Playwrightがインストールされている（E2Eテストの場合）
  ```bash
  cd e2e-tests
  npx playwright --version
  ```

### 推奨される実行順序

```bash
# 1. 最新版を取得
git pull origin main

# 2. 依存関係をインストール
npm run install:all

# 3. Dockerを起動（E2Eテストの場合）
docker compose up -d

# 4. テストを実行
npm run test:all

# または個別に実行
npm run test:server:unit
npm run test:server:integration
npm run test:client
npm run test:e2e
```

---

## デバッグのヒント

### サーバーテストのデバッグ

```bash
cd graphql-server

# 詳細なログを表示
npm test -- --verbose

# 特定のテストファイルのみ実行
npm test -- authResolvers.test.js

# ウォッチモードで実行
npm run test:watch
```

### クライアントテストのデバッグ

```bash
cd dashboard

# UIを表示してデバッグ
npm run test:watch

# カバレッジを確認
npm run test:coverage
```

### E2Eテストのデバッグ

```bash
cd e2e-tests

# ブラウザを表示して実行
npm run test:headed

# デバッグモード
npm run test:debug

# 特定のテストのみ実行
npm test -- dashboard.spec.js
```

---

## よくある質問

### Q: テストが遅い

**A:** 並列実行を試してください：

```bash
# サーバーとクライアントを並列実行
npm run test:server & npm run test:client

# ただし、E2Eは分けて実行（Dockerを使うため）
npm run test:e2e
```

### Q: テストがランダムに失敗する

**A:** 以下を確認：

1. Dockerが正常に動作しているか
2. ネットワークが安定しているか
3. システムリソース（メモリ、CPU）に余裕があるか
4. 他のプロセスがポートを使っていないか

### Q: カバレッジレポートが表示されない

**A:** カバレッジコマンドを使用：

```bash
# サーバー
cd graphql-server
npm run test:coverage
# coverage/lcov-report/index.html を開く

# クライアント
cd dashboard
npm run test:coverage
# coverage/index.html を開く
```

---

## さらに困ったら

1. **ドキュメントを確認**
   - [TEST_QUICKSTART.md](./TEST_QUICKSTART.md)
   - [TESTING.md](./TESTING.md)
   - [README.md](./README.md)

2. **Dockerログを確認**
   ```bash
   docker compose logs -f
   ```

3. **すべてクリーンアップして再起動**
   ```bash
   # Docker完全クリーンアップ
   docker compose down -v
   docker compose up -d --build
   
   # 依存関係を再インストール
   npm run install:all
   
   # テストを実行
   npm run test:all
   ```

4. **GitHubでIssueを作成**
   - リポジトリ: https://github.com/hiro1966/DockerDashBord
   - エラーメッセージ、実行環境、再現手順を記載

---

## まとめ

**最も一般的な解決策:**

1. `git pull origin main` で最新版を取得
2. `npm run install:all` で依存関係をインストール
3. `docker compose up -d` でDockerを起動
4. `npm run test:all` でテストを実行

これで大半の問題は解決します！🚀
