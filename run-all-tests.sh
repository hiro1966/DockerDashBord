#!/bin/bash

# Hospital Dashboard - All Tests Runner
# このスクリプトはすべてのテストを順次実行します

# エラーが発生しても続行（各テストの結果を追跡するため）
# set -e を削除

echo "=========================================="
echo "🧪 Hospital Dashboard - All Tests Runner"
echo "=========================================="
echo ""

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 現在のディレクトリを保存（絶対パスで取得）
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# テスト結果を追跡
TESTS_PASSED=0
TESTS_FAILED=0

# 関数: テストを実行
run_test() {
    local test_name=$1
    local test_dir=$2
    local test_command=$3
    
    echo ""
    echo "=========================================="
    echo "🧪 Running: $test_name"
    echo "=========================================="
    
    # サブシェルで実行してディレクトリの変更を隔離
    (
        cd "$ROOT_DIR/$test_dir" || exit 1
        $test_command
    )
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# A. サーバーのユニットテスト
run_test "Server Unit Tests" "graphql-server" "npm run test:unit"

# B. サーバーの統合テスト
run_test "Server Integration Tests" "graphql-server" "npm run test:integration"

# C. クライアントのコンポーネントテスト
run_test "Client Component Tests" "dashboard" "npm test"

# D. E2Eテスト（Dockerが起動している必要があります）
echo ""
echo "=========================================="
echo "🔍 Checking Docker services..."
echo "=========================================="

if docker compose ps 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services are running${NC}"
    run_test "E2E Tests" "e2e-tests" "npm test"
else
    echo -e "${YELLOW}⚠️  Docker services are not running${NC}"
    echo "Skipping E2E tests. Start Docker with: docker compose up -d"
    echo ""
fi

# 結果サマリー
echo ""
echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some tests failed!${NC}"
    exit 1
fi
