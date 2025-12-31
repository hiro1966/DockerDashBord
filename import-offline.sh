#!/bin/bash
# オフライン環境でDockerイメージとプロジェクトをインポートするスクリプト

set -e

echo "=========================================="
echo "オフライン環境セットアップスクリプト"
echo "=========================================="
echo ""

# 現在のディレクトリを確認
if [ ! -f "hospital-all-images.tar" ] || [ ! -f "webapp-project.tar.gz" ]; then
    echo "エラー: 必要なファイルが見つかりません"
    echo "このスクリプトは、hospital-all-images.tar と webapp-project.tar.gz が"
    echo "存在するディレクトリで実行してください。"
    exit 1
fi

echo "✓ 必要なファイルを確認しました"
echo ""

# Step 1: ファイルの整合性確認
if [ -f "checksums.txt" ]; then
    echo "Step 1: ファイルの整合性を確認中..."
    if sha256sum -c checksums.txt --quiet; then
        echo "✓ ファイルの整合性確認完了"
    else
        echo "⚠ 警告: チェックサムが一致しません"
        read -p "続行しますか？ (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "中止しました"
            exit 1
        fi
    fi
else
    echo "⚠ 警告: checksums.txt が見つかりません"
fi
echo ""

# Step 2: Dockerの確認
echo "Step 2: Dockerのインストールを確認中..."
if ! command -v docker &> /dev/null; then
    echo "エラー: Dockerがインストールされていません"
    echo "Dockerをインストールしてから再度実行してください。"
    echo ""
    echo "インストール方法は OFFLINE_MIGRATION.md を参照してください。"
    exit 1
fi

echo "✓ Docker: $(docker --version)"

if ! command -v docker compose &> /dev/null; then
    echo "⚠ 警告: Docker Compose Pluginが見つかりません"
    echo "docker-compose (旧版) を試します..."
    if ! command -v docker-compose &> /dev/null; then
        echo "エラー: Docker Composeがインストールされていません"
        exit 1
    fi
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
    echo "✓ Docker Compose: $(docker compose version)"
fi
echo ""

# Step 3: Dockerイメージをロード
echo "Step 3: Dockerイメージをインポート中..."
echo "  これには数分かかる場合があります..."

if [ "$EUID" -eq 0 ]; then
    docker load -i hospital-all-images.tar
else
    sudo docker load -i hospital-all-images.tar
fi

echo "✓ Dockerイメージのインポート完了"
echo ""

# インポートされたイメージを表示
echo "インポートされたイメージ:"
if [ "$EUID" -eq 0 ]; then
    docker images | grep -E "dashboard|graphql-server|postgres.*15-alpine" || echo "イメージが見つかりません"
else
    sudo docker images | grep -E "dashboard|graphql-server|postgres.*15-alpine" || echo "イメージが見つかりません"
fi
echo ""

# Step 4: プロジェクトを展開
echo "Step 4: プロジェクトファイルを展開中..."
INSTALL_DIR="$HOME/hospital-dashboard"

if [ -d "$INSTALL_DIR" ]; then
    echo "⚠ 警告: $INSTALL_DIR は既に存在します"
    read -p "上書きしますか？ (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "中止しました"
        exit 1
    fi
    rm -rf "$INSTALL_DIR"
fi

mkdir -p "$INSTALL_DIR"
tar -xzf webapp-project.tar.gz -C "$HOME/"
mv "$HOME/webapp" "$INSTALL_DIR" 2>/dev/null || true

echo "✓ プロジェクトの展開完了"
echo "  場所: $INSTALL_DIR"
echo ""

# Step 5: 起動確認
echo "Step 5: アプリケーションを起動しますか？"
read -p "起動する (y/N): " start_app

if [ "$start_app" = "y" ] || [ "$start_app" = "Y" ]; then
    cd "$INSTALL_DIR"
    
    echo "Dockerコンテナを起動中..."
    if [ "$EUID" -eq 0 ]; then
        $DOCKER_COMPOSE_CMD up -d
    else
        sudo $DOCKER_COMPOSE_CMD up -d
    fi
    
    echo ""
    echo "起動完了！数秒お待ちください..."
    sleep 5
    
    echo ""
    echo "コンテナの状態:"
    if [ "$EUID" -eq 0 ]; then
        $DOCKER_COMPOSE_CMD ps
    else
        sudo $DOCKER_COMPOSE_CMD ps
    fi
    
    echo ""
    echo "=========================================="
    echo "✓ セットアップ完了！"
    echo "=========================================="
    echo ""
    echo "アクセスURL:"
    echo "  ダッシュボード: http://localhost:3000?staffId=admin001"
    echo "  GraphQL API: http://localhost:4000/graphql"
    echo ""
    echo "テストユーザー:"
    echo "  管理者: admin001"
    echo "  事務部長: director001"
    echo "  医師: doctor001"
    echo ""
    echo "ログ確認:"
    if [ "$EUID" -eq 0 ]; then
        echo "  $DOCKER_COMPOSE_CMD logs -f"
    else
        echo "  sudo $DOCKER_COMPOSE_CMD logs -f"
    fi
    echo ""
    echo "停止:"
    if [ "$EUID" -eq 0 ]; then
        echo "  $DOCKER_COMPOSE_CMD down"
    else
        echo "  sudo $DOCKER_COMPOSE_CMD down"
    fi
    echo ""
else
    echo ""
    echo "=========================================="
    echo "✓ セットアップ完了！"
    echo "=========================================="
    echo ""
    echo "プロジェクトの場所: $INSTALL_DIR"
    echo ""
    echo "起動方法:"
    echo "  cd $INSTALL_DIR"
    if [ "$EUID" -eq 0 ]; then
        echo "  $DOCKER_COMPOSE_CMD up -d"
    else
        echo "  sudo $DOCKER_COMPOSE_CMD up -d"
    fi
    echo ""
    echo "アクセスURL:"
    echo "  ダッシュボード: http://localhost:3000?staffId=admin001"
    echo "  GraphQL API: http://localhost:4000/graphql"
    echo ""
fi
