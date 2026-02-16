# Apollo Client v3.8+ 対応とエラー解決ガイド

## 🔍 エラー内容

```
An error occurred! For more details, see the full error text at https://go.apollo.dev/c/err#...
useQuery: onCompleted is deprecated
useQuery: onError is deprecated
```

---

## ✅ 解決済み

### 問題1: Apollo Client の非推奨警告

**原因:** Apollo Client v3.8以降で `onCompleted` と `onError` コールバックが非推奨になった

**修正内容:**

#### 修正前（dashboard/src/contexts/AuthContext.jsx）
```javascript
const { data, error } = useQuery(VERIFY_STAFF, {
  variables: { staffId },
  skip: !staffId,
  onCompleted: () => setLoading(false),  // ❌ 非推奨
  onError: () => setLoading(false),      // ❌ 非推奨
})
```

#### 修正後
```javascript
const { data, error, loading: queryLoading } = useQuery(VERIFY_STAFF, {
  variables: { staffId },
  skip: !staffId,
})

// useEffectで副作用を処理（推奨パターン）
useEffect(() => {
  if (staffId && !queryLoading) {
    setLoading(false)
  }
}, [staffId, queryLoading])
```

**変更点:**
1. `onCompleted` と `onError` を削除
2. `loading` 状態を `useQuery` から取得（`queryLoading`）
3. `useEffect` で副作用（`setLoading`）を処理

---

### 問題2: React Router の警告

**警告メッセージ:**
```
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7
```

**修正内容:**

#### 修正前（dashboard/src/App.jsx）
```javascript
<Router>
  <AuthProvider>
    <AppContent />
  </AuthProvider>
</Router>
```

#### 修正後
```javascript
<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <AuthProvider>
    <AppContent />
  </AuthProvider>
</Router>
```

**変更点:**
- React Router v7の動作を先行して有効化
- `v7_startTransition`: React 18の `startTransition` でラップ
- `v7_relativeSplatPath`: 相対パス解決の改善

---

### 問題3: GraphQL URL の設定

**現在のログ:**
```
GraphQL Server URL: http://10.10.10.5:4000/graphql
```

#### オプション1: 環境変数を使用（直接アクセス）

**`dashboard/.env`を作成:**
```bash
# ユーザーの環境に合わせてIPアドレスを変更
VITE_GRAPHQL_URL=http://192.168.1.100:4000/graphql
```

**注意:**
- ファイアウォールでポート4000を開放する必要がある
- CORSの問題が発生する可能性がある

#### オプション2: Nginxリバースプロキシ経由（推奨）⭐

**`dashboard/.env`を削除またはコメントアウト:**
```bash
# VITE_GRAPHQL_URL=http://192.168.1.100:4000/graphql
```

**main.jsx の動作:**
```javascript
// 環境変数がない場合、自動的に以下のURLを使用
// http://<現在のホスト>/graphql
// 例: http://10.10.10.5/graphql
```

**利点:**
- ✅ 単一ポート（80）でアクセス
- ✅ CORS問題なし
- ✅ ファイアウォール設定が簡単

**必要な設定:**
```bash
# Nginxコンテナを起動
docker compose up -d nginx
```

---

## 🚀 セットアップ手順

### 1. 最新のコードを取得

```bash
cd ~/DockerDashBord  # または /home/user/webapp
git pull origin main
```

### 2. コンテナを再ビルド

```bash
docker compose down
docker compose up -d --build
```

### 3. ブラウザのキャッシュをクリア

**重要:** 古いJavaScriptが残っている可能性があるため、ブラウザを強制リロード

- **Chrome/Edge**: `Ctrl + Shift + R` または `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R`
- **Safari**: `Cmd + Option + R`

### 4. アクセス確認

#### Nginxリバースプロキシ経由（推奨）
```
http://10.10.10.5/?staffId=admin001
```

#### 直接アクセス
```
http://10.10.10.5:3000/?staffId=admin001
```

---

## 🔧 トラブルシューティング

### エラーが消えない場合

#### 1. ブラウザの完全キャッシュクリア

**Chrome/Edge:**
1. `F12` で開発者ツールを開く
2. 右クリック → 「キャッシュの消去とハード再読み込み」

**Firefox:**
1. `F12` で開発者ツールを開く
2. ネットワークタブ → ゴミ箱アイコンをクリック

#### 2. コンテナの完全再ビルド

```bash
# すべてのコンテナとイメージを削除して再ビルド
docker compose down --rmi all -v
docker compose up -d --build
```

#### 3. node_modules を再インストール（開発環境）

```bash
cd dashboard
rm -rf node_modules package-lock.json
npm install
```

### Apollo Client の警告が残る場合

**確認:**
```bash
# AuthContext.jsx が正しく更新されているか確認
grep -n "onCompleted\|onError" dashboard/src/contexts/AuthContext.jsx
```

**期待される出力:** （何も表示されない）

**もし表示される場合:**
```bash
# 最新版を取得
git pull origin main
git checkout dashboard/src/contexts/AuthContext.jsx
```

### React Router の警告が残る場合

**確認:**
```bash
# App.jsx が正しく更新されているか確認
grep -n "future={{" dashboard/src/App.jsx
```

**期待される出力:**
```
70:    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

---

## 📊 推奨設定

### 本番環境（Nginxリバースプロキシ使用）

**`dashboard/.env`（削除または空にする）:**
```bash
# Nginxリバースプロキシを使用する場合、この設定は不要
# VITE_GRAPHQL_URL は設定しない
```

**アクセス:**
```
http://<サーバーIP>/
```

### 開発環境（直接アクセス）

**`dashboard/.env`:**
```bash
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

**アクセス:**
```
http://localhost:3000/
```

---

## 🎯 修正内容まとめ

### 変更されたファイル

1. **`dashboard/src/contexts/AuthContext.jsx`**
   - `onCompleted` と `onError` を削除
   - `useEffect` で副作用を処理

2. **`dashboard/src/App.jsx`**
   - React Router の future flags を追加

3. **`dashboard/.gitignore`**
   - `.env` をgit管理対象外に追加

### 新規ファイル

4. **`dashboard/.gitignore`**
   - 環境変数ファイルを除外

---

## ✅ 確認事項

エラーが解消されたかを確認するチェックリスト:

- [ ] コンテナを再ビルドした (`docker compose up -d --build`)
- [ ] ブラウザのキャッシュをクリアした (`Ctrl + Shift + R`)
- [ ] `onCompleted` / `onError` の警告が消えた
- [ ] React Router の警告が消えた
- [ ] GraphQL Server URL が正しく表示される
- [ ] 職員認証が正常に動作する
- [ ] ダッシュボードが表示される

すべてにチェックが入れば、エラーは完全に解消されています！

---

## 📖 関連ドキュメント

- [Apollo Client Migration Guide](https://www.apollographql.com/docs/react/migrating/apollo-client-3-migration/)
- [React Router v7 Migration](https://reactrouter.com/v6/upgrading/future)
- [EXTERNAL_ACCESS_GUIDE.md](./EXTERNAL_ACCESS_GUIDE.md)
- [README.md](./README.md)

---

## 🔗 リポジトリ

**GitHub:** https://github.com/hiro1966/DockerDashBord

最新のコミットを取得してください：
```bash
git pull origin main
```
