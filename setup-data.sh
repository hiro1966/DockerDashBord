#!/bin/bash

# 病院管理システム - テストデータ投入スクリプト
# 使い方: ./setup-data.sh

set -e

echo "🏥 病院管理システム - テストデータ投入"
echo "======================================"
echo ""

# PostgreSQLコンテナが起動しているか確認
if ! docker compose ps postgres | grep -q "Up"; then
    echo "❌ PostgreSQLコンテナが起動していません"
    echo "   以下のコマンドで起動してください："
    echo "   docker compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQLコンテナが起動しています"
echo ""

# データベース接続確認
echo "📡 データベース接続を確認中..."
if docker compose exec -T postgres pg_isready -U hospital_user -d hospital_db > /dev/null 2>&1; then
    echo "✅ データベースに接続できました"
else
    echo "❌ データベースに接続できません"
    echo "   少し待ってから再度実行してください"
    exit 1
fi
echo ""

# 既存データを確認
echo "📊 既存データを確認中..."
DEPT_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM departments;" 2>/dev/null | tr -d ' ' || echo "0")
WARD_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM wards;" 2>/dev/null | tr -d ' ' || echo "0")
OUTPATIENT_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM outpatient_records;" 2>/dev/null | tr -d ' ' || echo "0")
INPATIENT_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM inpatient_records;" 2>/dev/null | tr -d ' ' || echo "0")

echo "   診療科: ${DEPT_COUNT}件"
echo "   病棟: ${WARD_COUNT}件"
echo "   外来患者記録: ${OUTPATIENT_COUNT}件"
echo "   入院患者記録: ${INPATIENT_COUNT}件"
echo ""

# データが既にある場合の確認
if [ "$DEPT_COUNT" -gt 0 ] || [ "$WARD_COUNT" -gt 0 ]; then
    read -p "⚠️  既にデータが存在します。続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "中止しました"
        exit 0
    fi
fi

# SQLファイルを実行
echo "📝 初期化スクリプトを実行中..."
if docker compose exec -T postgres psql -U hospital_user -d hospital_db < postgres/init.sql > /dev/null 2>&1; then
    echo "✅ 初期化スクリプトの実行が完了しました"
else
    echo "❌ 初期化スクリプトの実行に失敗しました"
    echo "   詳細はログを確認してください："
    echo "   docker compose logs postgres"
    exit 1
fi
echo ""

# 投入後のデータ確認
echo "📊 投入後のデータを確認中..."
DEPT_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM departments;" | tr -d ' ')
WARD_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM wards;" | tr -d ' ')
OUTPATIENT_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM outpatient_records;" | tr -d ' ')
INPATIENT_COUNT=$(docker compose exec -T postgres psql -U hospital_user -d hospital_db -t -c "SELECT COUNT(*) FROM inpatient_records;" | tr -d ' ')

echo "   診療科: ${DEPT_COUNT}件"
echo "   病棟: ${WARD_COUNT}件"
echo "   外来患者記録: ${OUTPATIENT_COUNT}件"
echo "   入院患者記録: ${INPATIENT_COUNT}件"
echo ""

# サンプルデータ表示
echo "📋 最新の外来患者データ（5件）:"
docker compose exec -T postgres psql -U hospital_user -d hospital_db -c "
SELECT 
    o.date, 
    d.name as department, 
    o.new_patients_count as new, 
    o.returning_patients_count as returning
FROM outpatient_records o
JOIN departments d ON o.department_id = d.id
ORDER BY o.date DESC, d.name
LIMIT 5;
"
echo ""

echo "✅ テストデータの投入が完了しました！"
echo ""
echo "🌐 次のステップ:"
echo "   1. ダッシュボードにアクセス: http://localhost:3000"
echo "   2. GraphQL Playground: http://localhost:4000/graphql"
echo ""
echo "💡 ヒント:"
echo "   - データを再投入する場合: docker compose down -v && docker compose up -d"
echo "   - ログを確認する場合: docker compose logs -f"
