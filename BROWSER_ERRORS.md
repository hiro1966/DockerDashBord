# よくあるブラウザエラーと対処法

## jQueryエラー: `*,:x' is not a valid selector`

### エラー内容
```
a.querySelectorAll("*,:x"),
SyntaxError: '*,:x' is not a valid selector.
```

### 原因
このエラーは以下のいずれかが原因です：

1. **ブラウザ拡張機能**: 広告ブロッカーやユーザースクリプトが古いjQueryを注入している
2. **ブラウザのキャッシュ**: 古いjQueryファイルがキャッシュされている
3. **Rechartsライブラリの依存関係**: 内部で使用されているライブラリの問題

### 対処法

#### 方法1: ブラウザのシークレットモード（推奨）

1. **Chrome/Edge**: `Ctrl+Shift+N` (Win) / `Cmd+Shift+N` (Mac)
2. **Firefox**: `Ctrl+Shift+P` (Win) / `Cmd+Shift+P` (Mac)
3. **Safari**: `Cmd+Shift+N`

シークレットモードで http://localhost:3000 にアクセスして、エラーが消えるか確認してください。

#### 方法2: ブラウザ拡張機能を無効化

以下の拡張機能を一時的に無効化してみてください：
- 広告ブロッカー (AdBlock, uBlock Origin, etc.)
- ユーザースクリプト (Tampermonkey, Greasemonkey, etc.)
- ページ修正ツール (Stylish, Dark Reader, etc.)

#### 方法3: ブラウザキャッシュのクリア

**Chrome/Edge:**
1. `F12`でDevToolsを開く
2. ネットワークタブを開く
3. 「キャッシュを無効化」をチェック
4. `Ctrl+Shift+R` (Win) / `Cmd+Shift+R` (Mac) で強制リロード

**Firefox:**
1. `F12`でDevToolsを開く
2. ネットワークタブを開く
3. 歯車アイコン → 「キャッシュを無効化」
4. `Ctrl+Shift+R` (Win) / `Cmd+Shift+R` (Mac) で強制リロード

#### 方法4: Rechartsのバージョンを更新

もしシークレットモードでもエラーが出る場合：

```bash
cd dashboard

# package-lock.jsonを削除
rm -rf node_modules package-lock.json

# 依存関係を再インストール
npm install

# または、Rechartsを最新版に更新
npm install recharts@latest

# 開発サーバーを再起動
npm run dev
```

#### 方法5: 別のグラフライブラリを試す

それでも解決しない場合、Chart.jsなど別のライブラリに変更できます：

```bash
cd dashboard
npm uninstall recharts
npm install chart.js react-chartjs-2
```

### 確認方法

エラーが解消されたか確認：

1. ブラウザで `F12` を押してコンソールを開く
2. http://localhost:3000 にアクセス
3. コンソールにjQuery関連のエラーが表示されないことを確認
4. ダッシュボードのグラフが正しく表示されることを確認

### 注意事項

- このプロジェクトではjQueryを使用していません
- エラーが出ていてもダッシュボードが正常に動作する場合は、無視しても問題ありません
- データが正しく表示されていれば、機能に影響はありません

## Apollo Client エラー

### エラー: `uri is not a valid option`

**修正済み**: 最新版のコードでは`HttpLink`を使用しており、このエラーは解消されています。

```bash
# 最新コードを取得
git pull

# Docker環境の場合
docker compose up -d --build dashboard

# ローカル開発の場合
cd dashboard
npm install
npm run dev
```

## その他のよくあるエラー

### ポート競合エラー

```
Error: listen EADDRINUSE: address already in use :::3000
```

**対処法:**

```bash
# 使用中のプロセスを確認
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# プロセスを終了させるか、別のポートを使用
PORT=3001 npm run dev
```

### CORS エラー

```
Access to fetch at 'http://localhost:4000/graphql' has been blocked by CORS policy
```

**対処法:**
GraphQLサーバーは既にCORSを許可する設定になっています。エラーが出る場合：

```bash
# GraphQLサーバーのログを確認
docker compose logs graphql-server

# GraphQLサーバーを再起動
docker compose restart graphql-server
```

### GraphQL接続エラー

```
Error: Failed to fetch
```

**確認事項:**
1. GraphQLサーバーが起動しているか: `docker compose ps`
2. GraphQL Playgroundにアクセスできるか: http://localhost:4000/graphql
3. 環境変数が正しいか: `dashboard/.env`の`VITE_GRAPHQL_URL`を確認

**対処法:**

```bash
# すべてのサービスを再起動
docker compose restart

# ログを確認
docker compose logs -f
```

## サポート

それでも解決しない場合は、以下の情報を添えてお問い合わせください：

1. ブラウザの種類とバージョン
2. OS (Windows/macOS/Linux)
3. コンソールの完全なエラーメッセージ
4. `docker compose logs` の出力
5. 実行したコマンドと結果
