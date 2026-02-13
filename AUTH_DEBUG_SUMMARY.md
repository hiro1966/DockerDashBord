# 職員ID認証エラーのデバッグ方法 - 完全ガイド

## ✅ 実装完了内容

「職員IDが見つかりません」エラーが発生した際の詳細ログ確認とデバッグが可能になりました。

---

## 🚀 クイックスタート（最も簡単な方法）

### 自動デバッグスクリプトを実行

```bash
cd ~/DockerDashBord  # または /home/user/webapp
./debug-auth.sh admin001
```

**出力例:**
```
==========================================
🔍 職員ID認証デバッグツール
==========================================

テスト対象の職員ID: admin001

Step 1: Dockerコンテナの状態確認
----------------------------------------
NAME                      STATUS
webapp-postgres-1         Up 2 hours
webapp-graphql-server-1   Up 2 hours
webapp-dashboard-1        Up 2 hours

Step 2: GraphQLサーバーのログ（最新20行）
----------------------------------------
[AUTH] 職員ID検証開始: admin001
[DB] クエリ実行: SELECT s.id, s.name...
[DB] ✅ クエリ成功: 1行 (15ms)
[AUTH] ✅ 職員認証成功: システム管理者 (admin001)

Step 3-7: ...
```

---

## 📊 詳細ログの内容

### 1. データベース接続ログ

**コンテナ起動時:**
```
[DB] 接続プール作成中:
[DB]   Host: postgres
[DB]   Port: 5432
[DB]   Database: hospital_db
[DB]   User: hospital_user
[DB] ✅ データベース接続成功
```

### 2. 職員ID検証ログ

**認証成功時:**
```
[AUTH] 職員ID検証開始: admin001
[DB] クエリ実行: SELECT s.id, s.name, s.job_type_code, s.created_at, ...
[DB] パラメータ: [ 'admin001' ]
[DB] ✅ クエリ成功: 1行 (15ms)
[AUTH] クエリ結果: 1件
[AUTH] ✅ 職員認証成功: システム管理者 (admin001)
```

**認証失敗時:**
```
[AUTH] 職員ID検証開始: invalid_id
[DB] クエリ実行: SELECT s.id, s.name, s.job_type_code, s.created_at, ...
[DB] パラメータ: [ 'invalid_id' ]
[DB] ✅ クエリ成功: 0行 (12ms)
[AUTH] クエリ結果: 0件
[AUTH] ❌ 職員が見つかりません: invalid_id
[AUTH] 利用可能な職員IDを確認するには: SELECT id, name FROM staff LIMIT 10
```

**エラー発生時:**
```
[AUTH] ⚠️ エラー発生: Error: connection refused
[AUTH] 職員ID: admin001
[AUTH] エラー詳細: connect ECONNREFUSED 127.0.0.1:5432
[DB] ❌ クエリエラー (0ms): connect ECONNREFUSED
[DB] SQL: SELECT s.id, s.name, ...
[DB] パラメータ: [ 'admin001' ]
```

---

## 🔧 手動デバッグ方法

### 方法1: リアルタイムログ監視

```bash
# すべてのログを表示
docker compose logs -f

# GraphQLサーバーのログのみ
docker compose logs -f graphql-server

# 認証関連のみフィルタ
docker compose logs -f graphql-server | grep -i "auth\|職員"
```

### 方法2: コンテナの状態確認

```bash
docker compose ps
```

**期待される出力:**
```
NAME                      STATUS
webapp-postgres-1         Up
webapp-graphql-server-1   Up
webapp-dashboard-1        Up
```

### 方法3: データベース直接確認

```bash
# PostgreSQLに接続
docker compose exec postgres psql -U hospital_user -d hospital_db

# 職員一覧を表示
SELECT id, name, job_type_code FROM staff ORDER BY id;

# 特定の職員IDを検索
SELECT * FROM staff WHERE id = 'admin001';

# 職員と権限を結合
SELECT s.id, s.name, s.job_type_code, p.job_type_name, p.level
FROM staff s
JOIN permissions p ON s.job_type_code = p.job_type_code
WHERE s.id = 'admin001';

# 抜ける
\q
```

### 方法4: GraphQL Playgroundでテスト

ブラウザで http://localhost:4000/graphql にアクセスして、以下を実行：

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

### 方法5: curlでAPIテスト

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { verifyStaff(staffId: \"admin001\") { id name } }"}'
```

---

## 🎯 テスト用職員ID

デフォルトで以下の職員IDが登録されています：

| 職員ID | 氏名 | 役職 | 権限レベル | 用途 |
|--------|------|------|-----------|------|
| admin001 | システム管理者 | システム管理者 | 99 | 全機能アクセス |
| director001 | 事務部長 | 事務部長 | 80 | 管理機能 |
| doctor001 | 山田太郎 | 医師 | 70 | 診療機能 |
| doctor002 | 佐藤花子 | 医師 | 70 | 診療機能 |
| nurse001 | 鈴木次郎 | 看護師 | 50 | 看護機能 |

**テスト例:**
```bash
# 正常ケース
./debug-auth.sh admin001
./debug-auth.sh director001

# エラーケース
./debug-auth.sh invalid_id
```

---

## 🚨 よくある問題と解決策

### 問題1: コンテナが起動していない

**症状:**
```
docker compose ps
# -> ステータスが "Exited" または表示されない
```

**解決策:**
```bash
docker compose up -d
docker compose logs
```

### 問題2: データベースが空

**症状:**
```
[AUTH] ❌ 職員が見つかりません: admin001
```

**確認:**
```bash
docker compose exec postgres psql -U hospital_user -d hospital_db -c "SELECT COUNT(*) FROM staff;"
```

**解決策（データベース再初期化）:**
```bash
docker compose down -v
docker compose up -d
```

### 問題3: ログが表示されない

**症状:**
ログに `[AUTH]` や `[DB]` プレフィックスが表示されない

**解決策:**
```bash
# 最新のコードを取得
git pull origin main

# コンテナを再ビルド
docker compose down
docker compose up -d --build graphql-server
```

### 問題4: ポート競合

**症状:**
```
Error: bind: address already in use
```

**解決策:**
```bash
# ポートを使用しているプロセスを確認
lsof -i :4000
lsof -i :5432

# プロセスを停止
kill -9 <PID>

# または、docker-compose.yml でポート番号を変更
```

---

## 📁 実装ファイル

### 1. `graphql-server/src/resolvers/authResolvers.js`
- 職員ID検証の詳細ログ出力
- `[AUTH]` プレフィックス
- 成功/失敗/エラーの全ケースでログ出力

### 2. `graphql-server/src/db/pool.js`
- データベース接続ログ
- クエリ実行ログ（SQL、パラメータ、実行時間）
- `[DB]` プレフィックス

### 3. `debug-auth.sh`
- 自動デバッグスクリプト
- Dockerコンテナ、DB、GraphQL APIを一括チェック

### 4. `DEBUG_AUTH_GUIDE.md`
- 包括的なデバッグガイド
- ログの見方、よくある問題と解決策

### 5. `README.md`
- デバッグセクション追加
- クイックリファレンス

---

## 📖 関連ドキュメント

- **[DEBUG_AUTH_GUIDE.md](./DEBUG_AUTH_GUIDE.md)** - 包括的なデバッグガイド（推奨）
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - 一般的なトラブルシューティング
- **[README.md](./README.md)** - プロジェクト概要

---

## 🔗 リポジトリ

**GitHub**: https://github.com/hiro1966/DockerDashBord  
**最新コミット**: `1451590` - 職員ID認証エラーの詳細ログとデバッグツールを追加

---

## 💡 ログの活用方法

### 開発時
```bash
# リアルタイムで監視
docker compose logs -f graphql-server
```

### デバッグ時
```bash
# 自動デバッグスクリプト実行
./debug-auth.sh <職員ID>
```

### トラブルシューティング時
```bash
# 全ログをファイルに保存
docker compose logs > debug-logs.txt
docker compose ps >> debug-logs.txt

# エラーのみ抽出
docker compose logs graphql-server 2>&1 | grep -i "error\|エラー"
```

---

## ✅ まとめ

これで、職員ID認証エラーが発生した際に：

1. ✅ **詳細なログ**で原因を特定できる
2. ✅ **自動デバッグスクリプト**で素早く診断できる
3. ✅ **手動デバッグ方法**で深堀り調査できる
4. ✅ **よくある問題の解決策**がすぐ見つかる

**推奨ワークフロー:**
```bash
# 1. まず自動デバッグを実行
./debug-auth.sh <職員ID>

# 2. 問題が続く場合、リアルタイムログを監視
docker compose logs -f graphql-server

# 3. さらに詳しく調査する場合、DEBUG_AUTH_GUIDE.md を参照
```

これで安心してデバッグできます！ 🎉
