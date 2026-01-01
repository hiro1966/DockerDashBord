# 病院管理ダッシュボードシステム

PostgreSQLデータベースとGraphQL APIを使用した、病院の外来・入院患者数を可視化するダッシュボードシステムです。

## 🏗️ システム構成

```
hospital-dashboard/
├── postgres/              # PostgreSQLデータベース
│   └── init.sql          # スキーマ定義とテストデータ
├── graphql-server/       # GraphQL APIサーバー（GraphQL Yoga）
│   ├── index.js          # サーバー実装
│   ├── package.json
│   └── Dockerfile
├── dashboard/            # Reactダッシュボード
│   ├── src/
│   │   ├── components/   # Reactコンポーネント
│   │   ├── queries/      # GraphQLクエリ
│   │   ├── App.jsx       # メインアプリ
│   │   └── main.jsx      # エントリーポイント
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml    # Docker Compose設定
```

## 📊 機能

### 外来患者ダッシュボード
- 日別患者数推移グラフ（初診・再診・合計）
- 診療科別患者数集計（棒グラフ）
- 診療科別詳細カード表示

### 入院患者ダッシュボード
- 日別入院患者数推移グラフ（在院・新入院・退院・転出・転入）
- 病棟別患者数集計（棒グラフ）
- 病棟別詳細カード表示（稼働率含む）

### 共通機能
- 期間フィルター（開始日・終了日選択）
- クイック期間選択（過去7日・30日・90日）
- リアルタイムデータ更新

## 🚀 セットアップ手順

### 前提条件
- Docker
- Docker Compose

### 起動方法

1. **リポジトリのクローン（または移動）**
```bash
cd /home/user/webapp
```

2. **Dockerコンテナの起動**
```bash
docker-compose up -d
```

初回起動時は、以下の処理が自動で実行されます：
- PostgreSQLデータベースの作成
- テーブルスキーマの作成
- テストデータの投入（過去30日分）
- GraphQLサーバーの起動
- Reactダッシュボードのビルドと起動

3. **起動確認**

各サービスが起動したら、以下のURLにアクセスできます：

- **ダッシュボード**: http://localhost:3000?staffId=admin001
- **GraphQL Playground**: http://localhost:4000/graphql
- **PostgreSQL**: localhost:5432

### 🌐 他のパソコンからアクセスする

#### 通常のDocker環境
詳細は [NETWORK_ACCESS.md](./NETWORK_ACCESS.md) を参照してください。

#### WSL2環境（Windows）
**WSL2で動かしている場合は特別な設定が必要です！**

PowerShellを管理者権限で開いて実行：

```powershell
cd C:\path\to\DockerDashBord
.\wsl-port-forward.ps1
```

または手動設定：

```powershell
$wsl_ip = (wsl hostname -I).trim().Split()[0]
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=$wsl_ip
```

詳細は [WSL_NETWORK_ACCESS.md](./WSL_NETWORK_ACCESS.md) を参照してください。

## 🧪 テスト

このプロジェクトはテスト駆動開発（TDD）に基づいており、包括的なテストスイートを提供しています。

### テストの種類

- **A. サーバーのユニットテスト**: 個別の関数・モジュールのテスト（Jest）
- **B. サーバーの統合テスト**: GraphQL API全体のテスト（Jest）
- **C. クライアントのコンポーネントテスト**: Reactコンポーネントのテスト（Vitest + React Testing Library）
- **D. E2Eテスト**: ブラウザでの実際の操作テスト（Playwright）

### 🚀 すべてのテストを実行（最も簡単な方法）

#### 通常の環境（Linux/Mac）

```bash
# プロジェクトルートで実行
npm run test:all

# またはシェルスクリプト
./run-all-tests.sh
```

#### WSL環境（Windows + WSL）⚠️

**重要**: WSL環境では、必ずWSLターミナル内で**`.sh`スクリプト**を実行してください。

```bash
# 1. WSLターミナルを開く
wsl

# 2. プロジェクトディレクトリへ移動
cd ~/DockerDashBord  # またはプロジェクトのパス

# 3. テストを実行（.sh スクリプトを使用）
./run-all-tests.sh
# または
npm run test:all
```

**⚠️ 注意**: WSL内で`run-all-tests.bat`を実行すると、UNCパスエラーが発生します！  
詳細: [WSL_CORRECT_USAGE.md](./WSL_CORRECT_USAGE.md)

**Windows側（PowerShell/コマンドプロンプト）から実行する場合**:

```powershell
# PowerShellで実行（自動的にWSL内で実行されます）
.\run-tests-wsl.ps1
```

詳細: [WSL_EXECUTION_GUIDE.md](./WSL_EXECUTION_GUIDE.md)

#### Windows（ネイティブ - WSLを使用しない場合）

```cmd
run-all-tests.bat
```

※ネイティブWindowsにNode.jsをインストールしている場合のみ

### 📝 個別のテストを実行

```bash
# A. サーバーのユニットテスト
npm run test:server:unit
# または
cd graphql-server && npm run test:unit

# B. サーバーの統合テスト
npm run test:server:integration
# または
cd graphql-server && npm run test:integration

# C. クライアントのコンポーネントテスト
npm run test:client
# または
cd dashboard && npm test

# D. E2Eテスト（事前にDockerを起動: docker compose up -d）
npm run test:e2e
# または
cd e2e-tests && npm test
```

### 📊 テストカバレッジ

```bash
# すべてのカバレッジレポートを生成
npm run test:coverage

# サーバーのみ
npm run test:server:coverage

# クライアントのみ
npm run test:client:coverage
```

### 📖 詳細ドキュメント

- **[TEST_QUICKSTART.md](./TEST_QUICKSTART.md)** - テスト実行のクイックリファレンス（おすすめ！）
- **[TESTING.md](./TESTING.md)** - テスト戦略とTDDワークフローの詳細

### ⚙️ 初回セットアップ（テスト環境）

```bash
# すべての依存関係をインストール
npm run install:all

# または個別にインストール
cd graphql-server && npm install
cd dashboard && npm install
cd e2e-tests && npm install && npx playwright install
```

4. **ログの確認**
```bash
# 全サービスのログを確認
docker-compose logs -f

# 特定のサービスのログを確認
docker-compose logs -f postgres
docker-compose logs -f graphql-server
docker-compose logs -f dashboard
```

5. **停止方法**
```bash
# コンテナの停止
docker-compose down

# コンテナとボリュームの削除（データも削除）
docker-compose down -v
```

## 🗄️ データベース構造

### テーブル一覧

#### departments（診療科マスタ）
- `id`: 診療科ID（主キー）
- `code`: 診療科コード（例: INT, SUR, PED）
- `name`: 診療科名（例: 内科、外科、小児科）

#### wards（病棟マスタ）
- `id`: 病棟ID（主キー）
- `code`: 病棟コード（例: W1, W2, ICU）
- `name`: 病棟名
- `capacity`: 病床数

#### outpatient_records（外来患者記録）
- `id`: レコードID（主キー）
- `date`: 記録日
- `department_id`: 診療科ID（外部キー）
- `new_patients_count`: 初診患者数
- `returning_patients_count`: 再診患者数

#### inpatient_records（入院患者記録）
- `id`: レコードID（主キー）
- `date`: 記録日
- `ward_id`: 病棟ID（外部キー）
- `department_id`: 診療科ID（外部キー）
- `current_patient_count`: 在院患者数
- `new_admission_count`: 新入院患者数
- `discharge_count`: 退院患者数
- `transfer_out_count`: 転出患者数
- `transfer_in_count`: 転入患者数

## 🔧 開発モード

### ローカル開発（Docker未使用）

#### 1. PostgreSQLの起動
```bash
# PostgreSQLのみDocker起動
docker run -d \
  --name hospital-postgres \
  -e POSTGRES_DB=hospital_db \
  -e POSTGRES_USER=hospital_user \
  -e POSTGRES_PASSWORD=hospital_pass \
  -p 5432:5432 \
  -v $(pwd)/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:15-alpine
```

#### 2. GraphQLサーバーの起動
```bash
cd graphql-server
npm install
npm start
# http://localhost:4000/graphql にアクセス
```

#### 3. Reactダッシュボードの起動
```bash
cd dashboard
npm install
npm run dev
# http://localhost:3000 にアクセス
```

## 📝 GraphQL API 使用例

### クエリ例

#### 診療科一覧取得
```graphql
query {
  departments {
    id
    code
    name
  }
}
```

#### 外来患者サマリー取得
```graphql
query {
  outpatientSummary(startDate: "2025-12-01", endDate: "2025-12-31") {
    date
    totalNew
    totalReturning
    totalPatients
  }
}
```

#### 診療科別外来患者集計
```graphql
query {
  outpatientByDepartment(startDate: "2025-12-01", endDate: "2025-12-31") {
    department {
      name
    }
    totalNew
    totalReturning
    totalPatients
  }
}
```

#### 病棟別入院患者集計
```graphql
query {
  inpatientByWard(startDate: "2025-12-01", endDate: "2025-12-31") {
    ward {
      name
      capacity
    }
    totalCurrent
    totalNewAdmission
    totalDischarge
  }
}
```

## 🛠️ トラブルシューティング

### データベース接続エラー
```bash
# PostgreSQLコンテナの状態確認
docker-compose ps postgres

# PostgreSQLのログ確認
docker-compose logs postgres

# PostgreSQLへの接続テスト
docker-compose exec postgres psql -U hospital_user -d hospital_db
```

### GraphQLサーバーエラー
```bash
# GraphQLサーバーのログ確認
docker-compose logs graphql-server

# サーバーの再起動
docker-compose restart graphql-server
```

### ダッシュボード表示エラー
```bash
# ダッシュボードのログ確認
docker-compose logs dashboard

# ダッシュボードの再ビルド
docker-compose up -d --build dashboard
```

### ポート競合エラー
すでにポートが使用されている場合は、`docker-compose.yml`のポート番号を変更してください：
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # 5432から5433に変更
  graphql-server:
    ports:
      - "4001:4000"  # 4000から4001に変更
  dashboard:
    ports:
      - "3001:3000"  # 3000から3001に変更
```

## 📦 テストデータ

初期データとして、以下が自動投入されます：

- **診療科**: 10科（内科、外科、小児科、整形外科、産婦人科、眼科、耳鼻咽喉科、皮膚科、精神科、放射線科）
- **病棟**: 6棟（第1-4病棟、ICU、CCU）
- **外来患者記録**: 過去30日分（各診療科、日ごとにランダム生成）
- **入院患者記録**: 過去30日分（各病棟・診療科、日ごとにランダム生成）

## 🔒 セキュリティについて

**注意**: このシステムは開発・テスト用です。本番環境で使用する場合は、以下の対策を実施してください：

- データベースパスワードの変更と環境変数化
- HTTPS/TLSの有効化
- 認証・認可の実装
- CORS設定の厳格化
- SQLインジェクション対策の追加確認
- バックアップ戦略の策定

## 🎨 カスタマイズ

### データベーススキーマの変更
`postgres/init.sql`を編集後、データベースを再作成：
```bash
docker-compose down -v
docker-compose up -d
```

### GraphQL APIの拡張
`graphql-server/index.js`の`typeDefs`と`resolvers`を編集してください。

### ダッシュボードのカスタマイズ
`dashboard/src/`以下のファイルを編集してください：
- `App.jsx`: メインレイアウト
- `components/`: 各ダッシュボードコンポーネント
- `index.css`: スタイル

## 📄 ライセンス

MIT

## 👨‍💻 技術スタック

- **Backend**: Node.js, GraphQL Yoga, PostgreSQL (pg)
- **Frontend**: React, Apollo Client, Recharts, Vite
- **Infrastructure**: Docker, Docker Compose
- **Database**: PostgreSQL 15
