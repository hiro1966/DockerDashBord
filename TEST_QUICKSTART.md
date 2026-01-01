# 🧪 テスト実行クイックリファレンス

## 📋 目次
- [すべてのテストを実行](#すべてのテストを実行)
- [個別のテストを実行](#個別のテストを実行)
- [テストカバレッジ](#テストカバレッジ)
- [トラブルシューティング](#トラブルシューティング)

---

## すべてのテストを実行

### 方法1: npm スクリプト（推奨）

```bash
# ルートディレクトリで実行
npm run test:all
```

### 方法2: シェルスクリプト

#### Linux/Mac/WSL
```bash
./run-all-tests.sh
```

#### Windows (コマンドプロンプト)
```cmd
run-all-tests.bat
```

#### Windows (PowerShell)
```powershell
.\run-all-tests.bat
```

---

## 個別のテストを実行

### A. サーバーのユニットテスト

```bash
# 方法1: ルートから
npm run test:server:unit

# 方法2: graphql-serverディレクトリで
cd graphql-server
npm run test:unit
```

**テスト内容:**
- マスタデータリゾルバ（診療科、病棟、医師）
- 認証リゾルバ（staffId検証、権限チェック）
- 売上リゾルバ（医師別、診療科別）

### B. サーバーの統合テスト

```bash
# 方法1: ルートから
npm run test:server:integration

# 方法2: graphql-serverディレクトリで
cd graphql-server
npm run test:integration
```

**テスト内容:**
- GraphQL API エンドポイント
- クエリとミューテーションの動作
- エラーハンドリング

### C. クライアントのコンポーネントテスト

```bash
# 方法1: ルートから
npm run test:client

# 方法2: dashboardディレクトリで
cd dashboard
npm test
```

**テスト内容:**
- HomePageコンポーネント
- 認証フロー
- ナビゲーション
- アクセス制御

### D. E2Eテスト

**⚠️ 事前準備: Dockerを起動**
```bash
docker compose up -d
```

**テスト実行:**
```bash
# 方法1: ルートから
npm run test:e2e

# 方法2: e2e-testsディレクトリで
cd e2e-tests
npm test
```

**ブラウザを表示して実行:**
```bash
npm run test:e2e:headed
```

**テスト内容:**
- 認証フロー（staffId パラメータ）
- ダッシュボードページの表示
- 外来患者ページ
- 入院患者ページ
- 売上ページ（権限チェック）

---

## テストカバレッジ

### すべてのカバレッジを生成

```bash
npm run test:coverage
```

### サーバーのカバレッジのみ

```bash
npm run test:server:coverage
```

### クライアントのカバレッジのみ

```bash
npm run test:client:coverage
```

---

## ユーティリティコマンド

### すべての依存関係をインストール

```bash
npm run install:all
```

### Docker操作

```bash
# 起動
npm run docker:up

# 停止
npm run docker:down

# リビルド起動
npm run docker:build

# ログ確認
npm run docker:logs
```

---

## トラブルシューティング

### 問題1: `npm run test:all`でエラーが出る

**原因:** ルートディレクトリに`package.json`がない

**解決策:**
```bash
# ルートディレクトリにpackage.jsonが存在するか確認
ls package.json

# なければ、以下のいずれかの方法を使用
./run-all-tests.sh  # Linux/Mac/WSL
run-all-tests.bat   # Windows
```

### 問題2: E2Eテストが失敗する

**原因:** Dockerサービスが起動していない

**解決策:**
```bash
# Dockerを起動
docker compose up -d

# 起動確認
docker compose ps

# すべてのサービスが "Up" であることを確認
```

### 問題3: テストが見つからない

**原因:** 依存関係がインストールされていない

**解決策:**
```bash
# すべての依存関係をインストール
npm run install:all

# または個別にインストール
cd graphql-server && npm install
cd dashboard && npm install
cd e2e-tests && npm install && npx playwright install
```

### 問題4: Playwright のブラウザがない

**解決策:**
```bash
cd e2e-tests
npx playwright install
```

### 問題5: WSL環境でパスエラーが出る

**原因:** Windows側からWSLのパスにアクセスしようとしている

**解決策:**
```bash
# WSL内で実行
wsl
cd ~/webapp  # またはプロジェクトのパス
npm run test:all
```

---

## テストの詳細ドキュメント

詳細なテスト戦略、TDDワークフロー、ベストプラクティスについては、
[TESTING.md](./TESTING.md) を参照してください。

---

## クイックチェックリスト

テスト実行前の確認事項:

- [ ] プロジェクトのルートディレクトリにいる
- [ ] 依存関係がインストールされている (`npm run install:all`)
- [ ] E2Eテストの場合: Dockerが起動している (`docker compose up -d`)
- [ ] E2Eテストの場合: Playwrightのブラウザがインストールされている

---

## 実行時間の目安

| テストタイプ | 実行時間 |
|------------|---------|
| サーバーユニット | 5-10秒 |
| サーバー統合 | 10-20秒 |
| クライアントコンポーネント | 5-10秒 |
| E2E | 30-60秒 |
| **すべて** | **約1-2分** |

---

## よくある質問

### Q: テストを並列実行できますか？

A: はい、可能です。ただし、E2EテストはDockerを使うため、他のテストと競合する可能性があります。

```bash
# サーバーとクライアントのテストを並列実行（E2Eは除く）
npm run test:server & npm run test:client
```

### Q: ウォッチモードで開発したい

A: 各ディレクトリでウォッチモードを使用できます：

```bash
# サーバー
cd graphql-server && npm run test:watch

# クライアント
cd dashboard && npm run test:watch
```

### Q: 特定のテストファイルだけ実行したい

A: テストフレームワークのフィルター機能を使用します：

```bash
# Jest（サーバー）
cd graphql-server
npm test -- authResolvers.test.js

# Vitest（クライアント）
cd dashboard
npm test -- HomePage.test

# Playwright（E2E）
cd e2e-tests
npm test -- dashboard.spec.js
```

---

## まとめ

**最もシンプルな方法:**
```bash
# プロジェクトルートで
npm run test:all
```

**より詳細な制御が必要な場合:**
```bash
# Linux/Mac/WSL
./run-all-tests.sh

# Windows
run-all-tests.bat
```

これで、すぐにテストを実行できます！🚀
