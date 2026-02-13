# 職員ID認証エラーのデバッグガイド

## 🔍 エラー内容

「職員IDが見つかりません」というエラーが発生した場合の詳細ログ確認方法とトラブルシューティング手順。

---

## 📋 クイックデバッグ（推奨）

### 自動デバッグスクリプトを実行

```bash
cd ~/DockerDashBord  # または /home/user/webapp
./debug-auth.sh admin001
```

このスクリプトは以下を自動実行します：
1. Dockerコンテナの状態確認
2. GraphQLサーバーのログ表示
3. データベース接続確認
4. 職員テーブルのレコード数確認
5. 登録済み職員ID一覧表示
6. 指定された職員IDの存在確認
7. GraphQL APIテスト

---

## 🔧 手動デバッグ方法

### 1. リアルタイムログ監視

#### すべてのログを表示
```bash
docker compose logs -f
```

#### GraphQLサーバーのログのみ
```bash
docker compose logs -f graphql-server
```

#### 特定のキーワードでフィルタ
```bash
docker compose logs -f graphql-server | grep -i "auth\|職員\|error"
```

### 2. コンテナの状態確認

```bash
docker compose ps
```

すべてのコンテナが `Up` 状態であることを確認。

### 3. データベース直接確認

#### PostgreSQLコンテナに接続
```bash
docker compose exec postgres psql -U hospital_user -d hospital_db
```

#### 職員IDを確認
```sql
-- 全職員を表示
SELECT id, name, job_type_code FROM staff ORDER BY id;

-- 特定の職員IDを検索
SELECT * FROM staff WHERE id = 'admin001';

-- 職員と権限を結合して確認
SELECT s.id, s.name, s.job_type_code, p.job_type_name, p.level
FROM staff s
JOIN permissions p ON s.job_type_code = p.job_type_code
WHERE s.id = 'admin001';
```

#### PostgreSQLから抜ける
```sql
\q
```

### 4. GraphQL Playgroundで直接テスト

ブラウザで以下にアクセス：
```
http://localhost:4000/graphql
```

以下のクエリを実行：
```graphql
query {
  verifyStaff(staffId: "admin001") {
    id
    name
    jobTypeCode
    permission {
      jobTypeName
      level
    }
  }
}
```

### 5. curlでAPIテスト

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { verifyStaff(staffId: \"admin001\") { id name } }"}'
```

---

## 📊 詳細ログの見方

### ログの構造

詳細ログを有効化すると、以下のような出力が得られます：

#### 1. データベース接続ログ
```
[DB] 接続プール作成中:
[DB]   Host: postgres
[DB]   Port: 5432
[DB]   Database: hospital_db
[DB]   User: hospital_user
[DB] ✅ データベース接続成功
```

#### 2. 認証ログ（成功時）
```
[AUTH] 職員ID検証開始: admin001
[DB] クエリ実行: SELECT s.id, s.name, s.job_type_code, s.created_at, ...
[DB] パラメータ: [ 'admin001' ]
[DB] ✅ クエリ成功: 1行 (15ms)
[AUTH] クエリ結果: 1件
[AUTH] ✅ 職員認証成功: システム管理者 (admin001)
```

#### 3. 認証ログ（失敗時）
```
[AUTH] 職員ID検証開始: invalid_id
[DB] クエリ実行: SELECT s.id, s.name, s.job_type_code, s.created_at, ...
[DB] パラメータ: [ 'invalid_id' ]
[DB] ✅ クエリ成功: 0行 (12ms)
[AUTH] クエリ結果: 0件
[AUTH] ❌ 職員が見つかりません: invalid_id
[AUTH] 利用可能な職員IDを確認するには: SELECT id, name FROM staff LIMIT 10
```

#### 4. エラーログ
```
[AUTH] ⚠️ エラー発生: Error: connection refused
[AUTH] 職員ID: admin001
[AUTH] エラー詳細: connect ECONNREFUSED 127.0.0.1:5432
```

---

## 🚨 よくある問題と解決策

### 問題1: データベース接続エラー

**症状:**
```
[DB] ❌ データベース接続エラー: connect ECONNREFUSED
```

**解決策:**
```bash
# PostgreSQLコンテナが起動しているか確認
docker compose ps postgres

# 起動していない場合
docker compose up -d postgres

# ログを確認
docker compose logs postgres
```

### 問題2: 職員IDが見つからない

**症状:**
```
[AUTH] ❌ 職員が見つかりません: admin001
```

**解決策:**

1. **データベースの初期化確認**
```bash
docker compose exec postgres psql -U hospital_user -d hospital_db -c "SELECT COUNT(*) FROM staff;"
```

2. **レコードがない場合、初期化スクリプトを再実行**
```bash
docker compose down
docker volume rm dockerdashbord_postgres_data
docker compose up -d
```

### 問題3: 権限テーブルが見つからない

**症状:**
```
[DB] ❌ クエリエラー: relation "permissions" does not exist
```

**解決策:**
```bash
# データベースを完全に再作成
docker compose down -v
docker compose up -d
```

### 問題4: ログが表示されない

**症状:**
ログに `[AUTH]` や `[DB]` プレフィックスが表示されない

**解決策:**
```bash
# 最新のコードを取得
git pull origin main

# コンテナを再ビルド
docker compose down
docker compose up -d --build
```

---

## 🔧 詳細ログの有効化（コード変更済み）

以下のファイルで詳細ログが有効化されています：

### 1. `graphql-server/src/resolvers/authResolvers.js`
- 職員ID検証開始ログ
- クエリ結果ログ
- 認証成功/失敗ログ
- エラー詳細ログ

### 2. `graphql-server/src/db/pool.js`
- データベース接続ログ
- クエリ実行ログ
- クエリ実行時間
- クエリエラーログ

---

## 📝 ログファイルの保存

ログを後で確認するためにファイルに保存：

```bash
# リアルタイムログをファイルに保存
docker compose logs -f graphql-server | tee graphql-server.log

# 過去のログをファイルに保存
docker compose logs graphql-server > graphql-server.log
```

---

## 🎯 テスト用の職員ID

デフォルトで以下の職員IDが登録されています：

| 職員ID | 氏名 | 役職 | 権限レベル |
|--------|------|------|-----------|
| admin001 | システム管理者 | システム管理者 | 99 |
| director001 | 事務部長 | 事務部長 | 80 |
| doctor001 | 山田太郎 | 医師 | 70 |
| doctor002 | 佐藤花子 | 医師 | 70 |
| nurse001 | 鈴木次郎 | 看護師 | 50 |

**テスト方法:**
```bash
./debug-auth.sh admin001
./debug-auth.sh director001
./debug-auth.sh invalid_id  # エラーケースのテスト
```

---

## 🔗 関連ドキュメント

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 一般的なトラブルシューティング
- [README.md](./README.md) - プロジェクト概要
- [docker-compose.yml](./docker-compose.yml) - Docker設定

---

## 📞 さらなるサポート

上記の方法で解決しない場合：

1. **完全なログを取得:**
```bash
docker compose logs > full-logs.txt
docker compose ps >> full-logs.txt
docker compose exec postgres psql -U hospital_user -d hospital_db -c "\dt" >> full-logs.txt
```

2. **GitHubで Issue を作成:**
   - https://github.com/hiro1966/DockerDashBord/issues
   - `full-logs.txt` を添付

---

## ✅ チェックリスト

デバッグ時のチェックリスト：

- [ ] すべてのDockerコンテナが起動している (`docker compose ps`)
- [ ] PostgreSQLに接続できる (`docker compose exec postgres psql -U hospital_user -d hospital_db`)
- [ ] 職員テーブルにデータがある (`SELECT COUNT(*) FROM staff;`)
- [ ] 権限テーブルにデータがある (`SELECT COUNT(*) FROM permissions;`)
- [ ] GraphQL APIが応答する (`curl http://localhost:4000/graphql`)
- [ ] 詳細ログが表示される（`[AUTH]`、`[DB]` プレフィックス）
- [ ] 正しい職員IDを使用している

すべてにチェックが入れば、システムは正常に動作しているはずです。
