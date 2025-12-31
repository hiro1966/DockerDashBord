#!/bin/bash

# PostgreSQLエラーの診断スクリプト

echo "🔍 PostgreSQLコンテナのエラー診断"
echo "===================================="
echo ""

# コンテナの状態確認
echo "📋 コンテナの状態:"
docker compose ps
echo ""

# PostgreSQLのログ確認
echo "📝 PostgreSQLのログ:"
docker compose logs postgres
echo ""

# ボリュームの確認
echo "💾 ボリュームの状態:"
docker volume ls | grep postgres
echo ""

# ネットワークの確認
echo "🌐 ネットワークの状態:"
docker network ls | grep docker
echo ""

echo "🔧 推奨される対処法:"
echo "1. ボリュームを削除して再作成: docker compose down -v && docker compose up -d"
echo "2. ポート競合を確認: lsof -i :5432 (macOS/Linux) または netstat -ano | findstr :5432 (Windows)"
echo "3. ディスク容量を確認: df -h"
