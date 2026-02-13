#!/bin/bash

# 職員ID認証デバッグスクリプト

echo "=========================================="
echo "🔍 職員ID認証デバッグツール"
echo "=========================================="
echo ""

STAFF_ID="${1:-admin001}"

echo "テスト対象の職員ID: $STAFF_ID"
echo ""

# Step 1: Dockerコンテナの状態確認
echo "Step 1: Dockerコンテナの状態確認"
echo "----------------------------------------"
docker compose ps
echo ""

# Step 2: GraphQLサーバーのログ（最新20行）
echo "Step 2: GraphQLサーバーのログ（最新20行）"
echo "----------------------------------------"
docker compose logs --tail=20 graphql-server
echo ""

# Step 3: データベース接続確認
echo "Step 3: データベース接続確認"
echo "----------------------------------------"
docker compose exec postgres psql -U hospital_user -d hospital_db -c "SELECT version();" 2>&1 || echo "❌ データベース接続エラー"
echo ""

# Step 4: 職員テーブルのレコード数確認
echo "Step 4: 職員テーブルのレコード数確認"
echo "----------------------------------------"
docker compose exec postgres psql -U hospital_user -d hospital_db -c "SELECT COUNT(*) as staff_count FROM staff;" 2>&1
echo ""

# Step 5: 登録されている職員ID一覧（先頭10件）
echo "Step 5: 登録されている職員ID一覧（先頭10件）"
echo "----------------------------------------"
docker compose exec postgres psql -U hospital_user -d hospital_db -c "SELECT id, name, job_type_code FROM staff ORDER BY id LIMIT 10;" 2>&1
echo ""

# Step 6: 指定された職員IDの存在確認
echo "Step 6: 指定された職員ID '$STAFF_ID' の存在確認"
echo "----------------------------------------"
docker compose exec postgres psql -U hospital_user -d hospital_db -c "SELECT s.id, s.name, s.job_type_code, p.job_type_name, p.level FROM staff s JOIN permissions p ON s.job_type_code = p.job_type_code WHERE s.id = '$STAFF_ID';" 2>&1
echo ""

# Step 7: GraphQL APIテスト
echo "Step 7: GraphQL APIテスト"
echo "----------------------------------------"
echo "verifyStaff クエリを実行中..."

QUERY='{"query":"query { verifyStaff(staffId: \"'$STAFF_ID'\") { id name jobTypeCode permission { jobTypeName level } } }"}'

curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d "$QUERY" | jq '.' 2>/dev/null || echo "❌ GraphQL APIエラー（jqがインストールされていない可能性があります）"

echo ""
echo ""

# Step 8: リアルタイムログ監視の案内
echo "=========================================="
echo "✅ デバッグ情報の収集完了"
echo "=========================================="
echo ""
echo "リアルタイムでログを監視する場合:"
echo "  docker compose logs -f graphql-server"
echo ""
echo "特定の職員IDで再テストする場合:"
echo "  ./debug-auth.sh <職員ID>"
echo "  例: ./debug-auth.sh admin001"
echo ""
