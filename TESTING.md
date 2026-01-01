# 🧪 テストドキュメント

このプロジェクトはテスト駆動開発（TDD）に基づいており、包括的なテストスイートを提供しています。

## 📋 目次

- [テストの種類](#テストの種類)
- [A. サーバーのユニットテスト](#a-サーバーのユニットテスト)
- [B. サーバーの統合テスト](#b-サーバーの統合テスト)
- [C. クライアントのコンポーネントテスト](#c-クライアントのコンポーネントテスト)
- [D. E2Eテスト](#d-e2eテスト)
- [CI/CD](#cicd)
- [ベストプラクティス](#ベストプラクティス)

---

## テストの種類

### テストピラミッド

```
        /\
       /  \      E2Eテスト (少)
      /____\     
     /      \    統合テスト (中)
    /________\   
   /          \  ユニットテスト (多)
  /__________  \
```

| テストタイプ | 数量 | 実行速度 | カバー範囲 | 信頼性 |
|------------|-----|---------|-----------|-------|
| ユニットテスト | 多 | 高速 | 関数・モジュール | 低 |
| 統合テスト | 中 | 中速 | API・サービス | 中 |
| E2Eテスト | 少 | 低速 | アプリ全体 | 高 |

---

## A. サーバーのユニットテスト

### 🎯 目的
個別の関数やモジュールが正しく動作することを検証します。

### 🛠️ 使用技術
- **Jest**: JavaScriptテストフレームワーク
- **ES Modules**: `import`/`export` サポート

### 📁 ディレクトリ構造

```
graphql-server/
├── src/
│   ├── db/
│   │   └── pool.js
│   ├── resolvers/
│   │   ├── masterDataResolvers.js
│   │   ├── authResolvers.js
│   │   └── salesResolvers.js
│   ├── schema/
│   │   └── typeDefs.js
│   └── __tests__/
│       └── unit/
│           ├── masterDataResolvers.test.js
│           ├── authResolvers.test.js
│           └── salesResolvers.test.js
├── jest.config.js
└── package.json
```

### 🚀 実行方法

#### すべてのユニットテストを実行

```bash
cd graphql-server
npm install
npm test
```

#### ユニットテストのみ実行

```bash
npm run test:unit
```

#### ウォッチモード（ファイル変更時に自動実行）

```bash
npm run test:watch
```

#### カバレッジレポート生成

```bash
npm run test:coverage
```

カバレッジレポートは `coverage/` ディレクトリに出力されます。

### 📝 テスト例

```javascript
describe('masterDataResolvers', () => {
  test('診療科一覧を正しく取得できる', async () => {
    // Arrange（準備）
    const mockRows = [
      { id: 1, code: '01', name: '内科', display_order: 1 }
    ]
    db.query.mockResolvedValue({ rows: mockRows })

    // Act（実行）
    const result = await getDepartments()

    // Assert（検証）
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('内科')
  })
})
```

### ✅ テストカバレッジ目標

- **ライン**: 80%以上
- **関数**: 80%以上
- **ブランチ**: 75%以上

---

## B. サーバーの統合テスト

### 🎯 目的
GraphQL APIエンドポイント全体が正しく動作することを検証します。

### 🛠️ 使用技術
- **Jest**: テストフレームワーク
- **GraphQL Yoga**: テスト用のfetch API

### 📁 ディレクトリ構造

```
graphql-server/
└── src/
    └── __tests__/
        └── integration/
            └── graphql-api.test.js
```

### 🚀 実行方法

#### 統合テストのみ実行

```bash
cd graphql-server
npm run test:integration
```

#### データベース接続が必要

統合テストを実行する前に、PostgreSQLが起動している必要があります：

```bash
# Docker Composeで起動
cd /home/user/webapp
docker compose up -d postgres

# 環境変数を設定（オプション）
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=hospital_db
export DB_USER=hospital_user
export DB_PASSWORD=hospital_pass

# テスト実行
cd graphql-server
npm run test:integration
```

### 📝 テスト例

```javascript
test('departments クエリが動作する', async () => {
  // Arrange
  const query = `
    query {
      departments {
        id
        code
        name
      }
    }
  `

  // Act
  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const result = await response.json()

  // Assert
  expect(response.status).toBe(200)
  expect(result.data.departments).toBeInstanceOf(Array)
})
```

---

## C. クライアントのコンポーネントテスト

### 🎯 目的
Reactコンポーネントが正しくレンダリングされ、ユーザー操作に正しく反応することを検証します。

### 🛠️ 使用技術
- **Vitest**: Vite対応の高速テストフレームワーク
- **React Testing Library**: Reactコンポーネントテスト
- **Happy DOM**: 軽量DOM環境
- **Apollo MockedProvider**: GraphQLモック

### 📁 ディレクトリ構造

```
dashboard/
├── src/
│   ├── components/
│   ├── pages/
│   ├── test/
│   │   ├── setup.js
│   │   └── TestProviders.jsx
│   └── __tests__/
│       └── components/
│           ├── HomePage.test.jsx
│           ├── OutpatientPage.test.jsx
│           └── SalesPage.test.jsx
├── vitest.config.js
└── package.json
```

### 🚀 実行方法

#### すべてのコンポーネントテストを実行

```bash
cd dashboard
npm install
npm test
```

#### UIモードで実行（推奨）

```bash
npm run test:ui
```

ブラウザでテスト結果を確認できます。

#### カバレッジレポート生成

```bash
npm run test:coverage
```

### 📝 テスト例

```javascript
import { render, screen } from '@testing-library/react'
import { TestProviders } from '../../test/TestProviders'
import HomePage from '../../pages/HomePage'

test('ページタイトルが表示される', () => {
  // Arrange & Act
  render(
    <TestProviders>
      <HomePage />
    </TestProviders>
  )

  // Assert
  expect(screen.getByText(/病院管理ダッシュボード/i)).toBeInTheDocument()
})
```

### 🎨 テストパターン

#### 1. レンダリングテスト
コンポーネントが正しく表示されるか検証

```javascript
test('外来患者グラフが表示される', () => {
  render(<TestProviders><OutpatientPage /></TestProviders>)
  expect(screen.getByText('外来患者数')).toBeInTheDocument()
})
```

#### 2. ユーザー操作テスト
ボタンクリックなどの操作に正しく反応するか検証

```javascript
import { fireEvent } from '@testing-library/react'

test('フィルターボタンをクリックするとデータが更新される', async () => {
  render(<TestProviders><OutpatientPage /></TestProviders>)
  
  const button = screen.getByRole('button', { name: /適用/i })
  fireEvent.click(button)
  
  await waitFor(() => {
    expect(screen.getByText('更新されました')).toBeInTheDocument()
  })
})
```

#### 3. GraphQLモックテスト
APIレスポンスをモックして検証

```javascript
const mocks = [
  {
    request: {
      query: GET_DEPARTMENTS,
    },
    result: {
      data: {
        departments: [{ id: 1, code: '01', name: '内科' }],
      },
    },
  },
]

render(
  <TestProviders mocks={mocks}>
    <OutpatientPage />
  </TestProviders>
)
```

---

## D. E2Eテスト

### 🎯 目的
実際のブラウザでアプリケーション全体が正しく動作することを検証します。

### 🛠️ 使用技術
- **Playwright**: クロスブラウザE2Eテスト
- **複数ブラウザ**: Chromium、Firefox、WebKit

### 📁 ディレクトリ構造

```
e2e-tests/
├── tests/
│   └── dashboard.spec.js
├── playwright.config.js
└── package.json
```

### 🚀 実行方法

#### 初回セットアップ

```bash
cd e2e-tests
npm install
npx playwright install
```

#### E2Eテストを実行

```bash
npm test
```

#### ヘッドレスモードで実行（ブラウザを表示）

```bash
npm run test:headed
```

#### UIモードで実行（推奨）

```bash
npm run test:ui
```

#### 特定のブラウザで実行

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### デバッグモード

```bash
npm run test:debug
```

### 📝 テスト例

```javascript
import { test, expect } from '@playwright/test'

test('有効な職員IDでログインできる', async ({ page }) => {
  // Arrange & Act
  await page.goto('/?staffId=admin001')

  // Assert
  await expect(page.locator('text=病院管理ダッシュボード')).toBeVisible()
  await expect(page.locator('text=管理者')).toBeVisible()
})
```

### 🎯 E2Eテストシナリオ

#### 1. 認証フロー
- ✅ 有効な職員IDでログイン
- ✅ 無効な職員IDでログイン失敗
- ✅ 職員IDなしでリダイレクト
- ✅ ログアウト機能

#### 2. ダッシュボード表示
- ✅ 外来患者数グラフ表示
- ✅ 入院患者数グラフ表示
- ✅ 詳細ページへの遷移

#### 3. 外来患者ページ
- ✅ 診療科別データ表示
- ✅ 期間フィルター機能
- ✅ クイック期間選択

#### 4. 入院患者ページ
- ✅ 病棟別データ表示
- ✅ 稼働率表示

#### 5. 売上ページ
- ✅ 権限チェック（レベル90以上）
- ✅ 3つの売上グラフ表示
- ✅ 診療科フィルター
- ✅ 前年比較データ

#### 6. レスポンシブデザイン
- ✅ モバイル表示
- ✅ タブレット表示

### 📊 テストレポート

テスト完了後、HTMLレポートを表示：

```bash
npm run report
```

---

## CI/CD

### GitHub Actions

`.github/workflows/test.yml` を作成してCI/CDパイプラインを設定します：

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  server-unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd graphql-server && npm install
      - name: Run unit tests
        run: cd graphql-server && npm run test:unit

  server-integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: hospital_db
          POSTGRES_USER: hospital_user
          POSTGRES_PASSWORD: hospital_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd graphql-server && npm install
      - name: Run integration tests
        run: cd graphql-server && npm run test:integration

  client-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd dashboard && npm install
      - name: Run tests
        run: cd dashboard && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd e2e-tests && npm install
      - name: Install Playwright
        run: cd e2e-tests && npx playwright install --with-deps
      - name: Start services
        run: docker compose up -d
      - name: Run E2E tests
        run: cd e2e-tests && npm test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e-tests/playwright-report/
```

---

## ベストプラクティス

### 🎯 AAA パターン

すべてのテストはAAA（Arrange-Act-Assert）パターンに従います：

```javascript
test('例', () => {
  // Arrange - テストの準備
  const input = 'test'
  
  // Act - 実行
  const result = doSomething(input)
  
  // Assert - 検証
  expect(result).toBe('expected')
})
```

### 📝 命名規則

#### テストファイル名
- ユニットテスト: `*.test.js`
- E2Eテスト: `*.spec.js`

#### テストケース名
- 日本語で記述
- 「何をテストするか」を明確に
- 例: `'有効な職員IDでログインできる'`

### 🧹 テストクリーンアップ

各テスト後に状態をクリーンアップ：

```javascript
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

### 🎭 モックの使用

外部依存をモックして、テストを独立させる：

```javascript
import { vi } from 'vitest'

vi.mock('../db/pool.js')
```

### ⏱️ タイムアウト設定

E2Eテストでは適切なタイムアウトを設定：

```javascript
test('データ読み込み', async ({ page }) => {
  await expect(page.locator('.data')).toBeVisible({ timeout: 5000 })
})
```

---

## 📊 テスト実行サマリー

### クイックスタート

```bash
# すべてのテストを実行
cd /home/user/webapp

# サーバーテスト
cd graphql-server && npm install && npm test

# クライアントテスト
cd dashboard && npm install && npm test

# E2Eテスト（サーバーが起動している必要あり）
docker compose up -d
cd e2e-tests && npm install && npx playwright install && npm test
```

### 推奨ワークフロー

#### 開発中
1. ユニットテストをウォッチモードで実行
2. コード変更時に自動実行
3. カバレッジを確認

#### コミット前
1. すべてのユニットテスト
2. 統合テスト
3. E2Eテスト（主要シナリオ）

#### プルリクエスト
1. すべてのテスト実行
2. カバレッジレポート確認
3. CI/CDパイプライン確認

---

## 🆘 トラブルシューティング

### ユニットテストが失敗する

```bash
# node_modulesをクリーンアップ
cd graphql-server
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm test -- --clearCache
```

### 統合テストが失敗する

```bash
# PostgreSQLが起動しているか確認
docker compose ps

# データベースをリセット
docker compose down -v
docker compose up -d postgres

# 接続情報を確認
docker compose logs postgres
```

### E2Eテストが失敗する

```bash
# ブラウザを再インストール
cd e2e-tests
npx playwright install --force

# ヘッドモードでデバッグ
npm run test:headed

# スクリーンショットを確認
ls -la test-results/
```

### モジュール解決エラー

```bash
# ES Modulesの設定を確認
# package.jsonに "type": "module" があるか確認

# Jestの場合
NODE_OPTIONS=--experimental-vm-modules npm test
```

---

## 📚 参考資料

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## ✅ チェックリスト

### 新機能追加時

- [ ] ユニットテストを追加
- [ ] 統合テストを追加（必要に応じて）
- [ ] E2Eテストを追加（重要機能の場合）
- [ ] テストカバレッジ80%以上を維持
- [ ] すべてのテストが通過することを確認

### バグ修正時

- [ ] バグを再現するテストを作成
- [ ] テストが失敗することを確認
- [ ] バグを修正
- [ ] テストが通過することを確認
- [ ] リグレッションテストを追加

---

**テストは品質の保証です。常にテストを書き、実行し、メンテナンスしましょう！** 🚀
