# Docker Compose トラブルシューティングガイド

## エラーが発生した場合の確認手順

### 1. 詳細なエラーログの確認

```bash
cd /home/user/webapp
docker compose up
```
（`-d`オプションを外して、詳細なログを確認）

### 2. 各コンテナの状態確認

```bash
docker compose ps
docker compose logs postgres
docker compose logs graphql-server
docker compose logs dashboard
```

### 3. よくあるエラーと対処法

#### エラー1: ポートが既に使用されている
```
Error: bind: address already in use
```

**対処法**: 既に使用されているポートを変更

`docker-compose.yml`を編集：
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # 5432→5433に変更
  
  graphql-server:
    ports:
      - "4001:4000"  # 4000→4001に変更
  
  dashboard:
    ports:
      - "3001:3000"  # 3000→3001に変更
```

使用中のポートを確認：
```bash
# Linuxの場合
sudo lsof -i :5432
sudo lsof -i :4000
sudo lsof -i :3000

# Windowsの場合
netstat -ano | findstr :5432
netstat -ano | findstr :4000
netstat -ano | findstr :3000

# macOSの場合
lsof -i :5432
lsof -i :4000
lsof -i :3000
```

#### エラー2: Docker Daemonが起動していない
```
Cannot connect to the Docker daemon
```

**対処法**:
```bash
# Linuxの場合
sudo systemctl start docker

# Windowsの場合
Docker Desktopアプリケーションを起動

# macOSの場合
Docker Desktopアプリケーションを起動
```

#### エラー3: ボリュームのパーミッションエラー
```
Permission denied
```

**対処法**:
```bash
# 既存のボリュームを削除して再作成
docker compose down -v
docker compose up -d
```

#### エラー4: イメージのビルドエラー
```
failed to solve with frontend dockerfile
```

**対処法**:
```bash
# キャッシュをクリアして再ビルド
docker compose build --no-cache
docker compose up -d
```

#### エラー5: PostgreSQLの初期化エラー
```
database system was interrupted
```

**対処法**:
```bash
# PostgreSQLのデータボリュームを削除して再作成
docker compose down
docker volume rm webapp_postgres_data
docker compose up -d
```

#### エラー6: GraphQLサーバーがPostgreSQLに接続できない
```
Error: connect ECONNREFUSED
```

**対処法**:
```bash
# PostgreSQLが完全に起動するまで待つ
docker compose logs postgres

# PostgreSQLのヘルスチェックが通っているか確認
docker compose ps

# GraphQLサーバーを再起動
docker compose restart graphql-server
```

### 4. 完全なリセット手順

すべてをクリーンな状態にする：

```bash
# すべてのコンテナとボリュームを削除
docker compose down -v

# イメージも削除する場合
docker compose down -v --rmi all

# 再度起動
docker compose up -d
```

### 5. 個別コンテナの起動確認

```bash
# PostgreSQLのみ起動
docker compose up -d postgres

# ログ確認
docker compose logs -f postgres

# 起動が確認できたら、GraphQLサーバーを起動
docker compose up -d graphql-server

# ログ確認
docker compose logs -f graphql-server

# 最後にダッシュボードを起動
docker compose up -d dashboard
```

### 6. PostgreSQLへの直接接続テスト

```bash
# コンテナ内でPostgreSQLに接続
docker compose exec postgres psql -U hospital_user -d hospital_db

# テーブル確認
\dt

# データ確認
SELECT * FROM departments;
SELECT COUNT(*) FROM outpatient_records;
SELECT COUNT(*) FROM inpatient_records;

# 終了
\q
```

### 7. GraphQL APIのテスト

PostgreSQLとGraphQLサーバーが起動したら：

```bash
# curlでテスト
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ departments { id name code } }"}'
```

### 8. ネットワーク関連の問題

```bash
# Dockerネットワークの確認
docker network ls

# コンテナのネットワーク設定確認
docker compose exec graphql-server cat /etc/hosts
docker compose exec graphql-server ping postgres
```

### 9. メモリ不足エラー

```
Cannot allocate memory
```

**対処法**: Docker Desktopのメモリ割り当てを増やす
- Docker Desktop → Settings → Resources
- Memory を 4GB 以上に設定

### 10. ローカル開発モード（Dockerを使わない）

Docker起動できない場合の代替方法：

#### PostgreSQLの起動
```bash
# ローカルにPostgreSQLをインストール
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# データベース作成
createdb hospital_db

# 初期化スクリプト実行
psql hospital_db < postgres/init.sql
```

#### GraphQLサーバーの起動
```bash
cd graphql-server
npm install

# 環境変数設定
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=hospital_db
export DB_USER=postgres  # ローカルのユーザー名
export DB_PASSWORD=''    # ローカルのパスワード

npm start
```

#### ダッシュボードの起動
```bash
cd dashboard
npm install

# .envファイルを編集
echo "VITE_GRAPHQL_URL=http://localhost:4000/graphql" > .env

npm run dev
```

---

## 🆘 それでも解決しない場合

具体的なエラーメッセージを以下のコマンドで取得してください：

```bash
docker compose up 2>&1 | tee error.log
```

エラーログを共有していただければ、より具体的なサポートができます。
