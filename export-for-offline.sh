#!/bin/bash
# オンライン環境でDockerイメージとプロジェクトをエクスポートするスクリプト

set -e

echo "=========================================="
echo "オフライン移行用ファイル準備スクリプト"
echo "=========================================="
echo ""

# 作業ディレクトリ
WORK_DIR="$HOME/hospital-offline-export"
PROJECT_DIR="/home/user/webapp"

# 作業ディレクトリを作成
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "作業ディレクトリ: $WORK_DIR"
echo ""

# Step 1: Dockerイメージをビルド
echo "Step 1: Dockerイメージをビルド中..."
cd "$PROJECT_DIR"
docker compose build
echo "✓ ビルド完了"
echo ""

# Step 2: イメージ名を取得
echo "Step 2: Dockerイメージを確認中..."
DASHBOARD_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep dashboard | head -1)
GRAPHQL_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep graphql-server | head -1)
POSTGRES_IMAGE="postgres:15-alpine"

echo "Dashboard Image: $DASHBOARD_IMAGE"
echo "GraphQL Image: $GRAPHQL_IMAGE"
echo "PostgreSQL Image: $POSTGRES_IMAGE"
echo ""

# Step 3: Dockerイメージをエクスポート
echo "Step 3: Dockerイメージをエクスポート中..."
echo "  これには数分かかる場合があります..."

docker save -o "$WORK_DIR/hospital-all-images.tar" \
  "$DASHBOARD_IMAGE" \
  "$GRAPHQL_IMAGE" \
  "$POSTGRES_IMAGE"

echo "✓ Dockerイメージのエクスポート完了"
echo "  ファイル: hospital-all-images.tar"
echo "  サイズ: $(du -h $WORK_DIR/hospital-all-images.tar | cut -f1)"
echo ""

# Step 4: プロジェクトファイルを圧縮
echo "Step 4: プロジェクトファイルを圧縮中..."
cd "$(dirname $PROJECT_DIR)"
tar -czf "$WORK_DIR/webapp-project.tar.gz" \
  --exclude='webapp/dashboard/node_modules' \
  --exclude='webapp/graphql-server/node_modules' \
  --exclude='webapp/.git' \
  --exclude='webapp/dashboard/dist' \
  --exclude='webapp/dashboard/build' \
  "$(basename $PROJECT_DIR)/"

echo "✓ プロジェクトファイルの圧縮完了"
echo "  ファイル: webapp-project.tar.gz"
echo "  サイズ: $(du -h $WORK_DIR/webapp-project.tar.gz | cut -f1)"
echo ""

# Step 5: ドキュメントをコピー
echo "Step 5: ドキュメントをコピー中..."
cp "$PROJECT_DIR/OFFLINE_MIGRATION.md" "$WORK_DIR/"
cp "$PROJECT_DIR/README.md" "$WORK_DIR/"
echo "✓ ドキュメントのコピー完了"
echo ""

# Step 6: チェックサムを作成
echo "Step 6: チェックサムを作成中..."
cd "$WORK_DIR"
sha256sum hospital-all-images.tar > checksums.txt
sha256sum webapp-project.tar.gz >> checksums.txt
echo "✓ チェックサムの作成完了"
echo ""

# Step 7: READMEを作成
cat > "$WORK_DIR/README_OFFLINE.txt" << 'EOF'
========================================
病院管理ダッシュボード オフライン移行パッケージ
========================================

このパッケージには以下が含まれています：

1. hospital-all-images.tar - Dockerイメージ
   - webapp-dashboard:latest
   - webapp-graphql-server:latest
   - postgres:15-alpine

2. webapp-project.tar.gz - プロジェクトファイル
   - ソースコード
   - 設定ファイル
   - 初期化スクリプト

3. OFFLINE_MIGRATION.md - 詳細な移行手順
4. README.md - プロジェクト概要
5. checksums.txt - ファイル整合性確認用

========================================
クイックスタート（Ubuntu）
========================================

1. このフォルダをオフライン環境にコピー

2. Dockerがインストールされているか確認：
   docker --version
   docker compose version

3. Dockerイメージをロード：
   sudo docker load -i hospital-all-images.tar

4. プロジェクトを展開：
   tar -xzf webapp-project.tar.gz
   cd webapp

5. 起動：
   sudo docker compose up -d

6. ブラウザでアクセス：
   http://localhost:3000?staffId=admin001

========================================
詳細は OFFLINE_MIGRATION.md を参照してください
========================================
EOF

echo "✓ README_OFFLINE.txt を作成"
echo ""

# 完了メッセージ
echo "=========================================="
echo "✓ すべての準備が完了しました！"
echo "=========================================="
echo ""
echo "エクスポートされたファイル："
echo "  場所: $WORK_DIR"
echo ""
ls -lh "$WORK_DIR"
echo ""
echo "合計サイズ: $(du -sh $WORK_DIR | cut -f1)"
echo ""
echo "次のステップ："
echo "1. $WORK_DIR をUSBメモリにコピー"
echo "2. オフライン環境に移動"
echo "3. OFFLINE_MIGRATION.md の手順に従ってインストール"
echo ""
echo "ファイルの整合性確認（オフライン環境で実行）："
echo "  cd $WORK_DIR"
echo "  sha256sum -c checksums.txt"
echo ""
