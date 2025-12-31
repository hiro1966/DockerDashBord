# Sandbox環境でのセットアップ手順

このSandbox環境ではDockerのネットワーク機能に制限があるため、各サービスを個別にローカル起動します。

## 🚀 起動手順

### 1. PostgreSQLのセットアップ

PostgreSQLをインストールして起動：

\`\`\`bash
# PostgreSQLのインストール
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# PostgreSQLの起動
sudo service postgresql start

# データベースとユーザーの作成
sudo -u postgres psql -c "CREATE DATABASE hospital_db;"
sudo -u postgres psql -c "CREATE USER hospital_user WITH PASSWORD 'hospital_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_user;"

# 初期化スクリプトの実行
sudo -u postgres psql hospital_db < /home/user/webapp/postgres/init.sql
\`\`\`

### 2. GraphQLサーバーの起動

\`\`\`bash
cd /home/user/webapp/graphql-server
npm install

# 環境変数を設定して起動
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=hospital_db
export DB_USER=hospital_user
export DB_PASSWORD=hospital_pass
export PORT=4000

npm start
\`\`\`

GraphQL Playgroundに http://localhost:4000/graphql でアクセス可能

### 3. Reactダッシュボードの起動

別のターミナルで：

\`\`\`bash
cd /home/user/webapp/dashboard
npm install
npm run dev
\`\`\`

ダッシュボードに http://localhost:3000 でアクセス可能

## ⚠️ 注意事項

このSandbox環境では：
- Dockerのネットワーク機能（iptables raw table）が制限されている
- カーネルモジュール（modprobe）が使用できない
- したがって、Docker Composeではなく個別起動が推奨

## 🎯 実際の環境での使用

実際のサーバーやローカルマシンでは、通常通り Docker Compose が使用できます：

\`\`\`bash
docker compose up -d
\`\`\`
