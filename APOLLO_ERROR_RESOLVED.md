# Apollo Client エラー完全解決ガイド

## ✅ 完了：すべてのエラーを解消

---

## 🔍 発生していたエラー

### 1. Apollo Client の非推奨警告
```javascript
An error occurred! For more details, see the full error text at https://go.apollo.dev/c/err#...
useQuery: onCompleted
useQuery: onError
```

### 2. React Router の警告
```javascript
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7
```

### 3. GraphQL URL の表示
```
GraphQL Server URL: http://10.10.10.5:4000/graphql
```

---

## ✅ 解決内容

### 修正1: AuthContext.jsx（Apollo Client v3.8+ 対応）

#### 修正前（❌ 非推奨）
```javascript
const { data, error } = useQuery(VERIFY_STAFF, {
  variables: { staffId },
  skip: !staffId,
  onCompleted: () => setLoading(false),  // ❌ 非推奨
  onError: () => setLoading(false),      // ❌ 非推奨
})
```

#### 修正後（✅ 推奨）
```javascript
const { data, error, loading: queryLoading } = useQuery(VERIFY_STAFF, {
  variables: { staffId },
  skip: !staffId,
})

// useEffectで副作用を処理
useEffect(() => {
  if (staffId && !queryLoading) {
    setLoading(false)
  }
}, [staffId, queryLoading])
```

**変更点:**
- `onCompleted` と `onError` を削除
- `loading` 状態を `useQuery` から取得
- `useEffect` で副作用（状態更新）を処理

---

### 修正2: App.jsx（React Router v7 対応）

#### 修正前
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
- `v7_startTransition`: React 18の`startTransition`でラップ
- `v7_relativeSplatPath`: 相対パス解決の改善

---

### 修正3: .gitignore の追加

```bash
# dashboard/.gitignore
.env
.env.local
.env.*.local
```

**理由:**
- `.env` ファイルに機密情報（IPアドレスなど）が含まれる可能性がある
- 各環境で異なる設定を使用するため

---

## 🚀 適用手順

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

**重要:** 古いJavaScriptが残っている可能性があるため

- **Chrome/Edge**: `Ctrl + Shift + R` または `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R`
- **Safari**: `Cmd + Option + R`

**または、開発者ツールから:**
1. `F12` で開発者ツールを開く
2. 右クリック → 「キャッシュの消去とハード再読み込み」

### 4. 確認

ブラウザのコンソール（F12）を開いて、以下のエラーが消えていることを確認：
- ✅ `onCompleted` の警告なし
- ✅ `onError` の警告なし
- ✅ React Router の警告なし

---

## 🌐 GraphQL URL の設定

### オプション1: Nginxリバースプロキシ経由（推奨）⭐

**dashboard/.env を削除または空にする:**
```bash
# Nginxリバースプロキシを使用する場合、環境変数は不要
```

**アクセス:**
```
http://10.10.10.5/?staffId=admin001
```

**GraphQL URL（自動設定）:**
```
http://10.10.10.5/graphql
```

**利点:**
- ✅ 単一ポート（80）
- ✅ CORS問題なし
- ✅ ファイアウォール設定が簡単

---

### オプション2: 直接アクセス

**dashboard/.env を作成:**
```bash
VITE_GRAPHQL_URL=http://10.10.10.5:4000/graphql
```

**アクセス:**
```
http://10.10.10.5:3000/?staffId=admin001
```

**注意:**
- ファイアウォールでポート3000と4000を開放する必要がある
- CORSの問題が発生する可能性がある

---

## 🔧 トラブルシューティング

### エラーが消えない場合

#### 1. コンテナの完全再ビルド

```bash
docker compose down --rmi all -v
docker compose up -d --build
```

#### 2. ブラウザの完全キャッシュクリア

**Chrome/Edge:**
1. 設定 → プライバシーとセキュリティ → 閲覧履歴データの削除
2. 「キャッシュされた画像とファイル」をチェック
3. データを削除

**Firefox:**
1. 設定 → プライバシーとセキュリティ → Cookie とサイトデータ
2. データを消去

#### 3. 修正が反映されているか確認

```bash
# AuthContext.jsx の確認
grep -n "onCompleted\|onError" dashboard/src/contexts/AuthContext.jsx
# → 何も表示されなければOK

# App.jsx の確認
grep -n "future={{" dashboard/src/App.jsx
# → "future={{ v7_startTransition: true..." が表示されればOK
```

#### 4. 開発サーバーを再起動（ローカル開発の場合）

```bash
cd dashboard
npm run dev
```

---

## 📊 変更されたファイル

### 1. `dashboard/src/contexts/AuthContext.jsx`
- Apollo Client v3.8+ 対応
- `onCompleted` / `onError` を削除
- `useEffect` で副作用を処理

### 2. `dashboard/src/App.jsx`
- React Router future flags を追加

### 3. `dashboard/.gitignore`（新規）
- `.env` をgit管理対象外に

### 4. `APOLLO_CLIENT_FIX.md`（新規）
- 詳細な解決ガイド

---

## ✅ 確認チェックリスト

- [ ] `git pull origin main` で最新コードを取得
- [ ] `docker compose up -d --build` でコンテナを再ビルド
- [ ] ブラウザのキャッシュをクリア（`Ctrl + Shift + R`）
- [ ] ブラウザのコンソールでエラーを確認
  - [ ] `onCompleted` の警告なし
  - [ ] `onError` の警告なし
  - [ ] React Router の警告なし
- [ ] ダッシュボードが正常に表示される
- [ ] 職員認証が正常に動作する

すべてにチェックが入れば、エラーは完全に解消されています！

---

## 📖 関連ドキュメント

- **[APOLLO_CLIENT_FIX.md](./APOLLO_CLIENT_FIX.md)** - 詳細な解決ガイド
- **[EXTERNAL_ACCESS_GUIDE.md](./EXTERNAL_ACCESS_GUIDE.md)** - 外部アクセス設定
- **[README.md](./README.md)** - プロジェクト概要

---

## 🔗 リポジトリ

**GitHub:** https://github.com/hiro1966/DockerDashBord  
**最新コミット:** `97a313a` - Apollo Client v3.8+ 非推奨警告とReact Router警告を解消

---

## 💡 技術的な説明

### なぜ onCompleted/onError が非推奨になったのか？

Apollo Client v3.8以降、以下の理由で非推奨になりました：

1. **状態管理の複雑化**: コールバックでローカル状態を更新すると、状態の追跡が困難
2. **React の最新パターンに準拠**: `useEffect` で副作用を管理する方が明確
3. **競合状態の回避**: コールバック内での状態更新は予期しない動作を引き起こす可能性

### 推奨パターン

```javascript
// ✅ 推奨: データとエラーを直接使用
const { data, error, loading } = useQuery(QUERY)

useEffect(() => {
  if (data) {
    // データが更新されたときの処理
    handleData(data)
  }
  if (error) {
    // エラーが発生したときの処理
    handleError(error)
  }
}, [data, error])
```

このパターンは：
- 明確で追跡しやすい
- React の標準的なパターンに準拠
- テストしやすい

---

## ✨ まとめ

これで、以下が解消されました：

1. ✅ Apollo Client の非推奨警告
2. ✅ React Router の警告
3. ✅ コンソールの大量のエラーメッセージ

快適な開発環境が整いました！ 🎉
