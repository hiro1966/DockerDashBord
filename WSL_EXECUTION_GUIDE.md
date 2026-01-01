# 🚨 WSL環境での実行方法

## ❌ 間違った実行方法

Windows側（コマンドプロンプト、PowerShell、エクスプローラー）から直接実行すると、
UNCパスエラーが発生します：

```
\\wsl.localhost\Ubuntu-20.04\home\user1\DockerDashBord\graphql-server
UNC パスはサポートされません
```

## ✅ 正しい実行方法

### 1. WSLターミナルを開く

#### 方法A: Windows ターミナルから
```bash
# PowerShell または コマンドプロンプトで
wsl
```

#### 方法B: スタートメニューから
- スタートメニューで「Ubuntu」または「WSL」を検索
- Ubuntu（またはインストール済みのLinuxディストリビューション）を起動

#### 方法C: VSCode から
- VSCode でプロジェクトを開く
- `Ctrl + Shift + P` → "WSL: Reopen Folder in WSL" を選択
- ターミナルを開く（`Ctrl + `` ）

### 2. プロジェクトディレクトリへ移動

```bash
cd ~/DockerDashBord
# または
cd /home/user1/DockerDashBord
```

### 3. テストを実行

```bash
# すべてのテストを実行
./run-all-tests.sh

# または npm スクリプトで
npm run test:all
```

---

## 🎯 完全な実行手順（WSL環境）

```bash
# 1. WSLに入る
wsl

# 2. プロジェクトディレクトリへ移動
cd ~/DockerDashBord

# 3. 最新版を取得（初回のみ）
git pull origin main

# 4. 依存関係をインストール（初回のみ）
npm run install:all

# 5. Dockerを起動（E2Eテスト用）
docker compose up -d

# 6. テストを実行
./run-all-tests.sh
```

---

## 🪟 Windows側から実行したい場合

Windows側から直接実行する必要がある場合は、wslコマンドを使用します：

### PowerShellから

```powershell
# プロジェクトディレクトリに移動（Windows側のパス）
cd C:\path\to\your\project

# WSL内でコマンドを実行
wsl bash -c "cd ~/DockerDashBord && ./run-all-tests.sh"

# または npm スクリプトで
wsl bash -c "cd ~/DockerDashBord && npm run test:all"
```

### コマンドプロンプトから

```cmd
REM プロジェクトディレクトリに移動（Windows側のパス）
cd C:\path\to\your\project

REM WSL内でコマンドを実行
wsl bash -c "cd ~/DockerDashBord && ./run-all-tests.sh"
```

---

## 🛠️ より便利な方法: Windows用ラッパースクリプト

Windows側から簡単に実行できるように、専用のPowerShellスクリプトを作成しましょう：

### `run-tests-wsl.ps1` を作成

```powershell
# WSL内でテストを実行するためのWindows用スクリプト

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🧪 Running Tests in WSL" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# WSLが利用可能か確認
$wslCheck = wsl --list --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ WSL is not available" -ForegroundColor Red
    Write-Host "Please install WSL first: https://docs.microsoft.com/windows/wsl/install" -ForegroundColor Yellow
    exit 1
}

# プロジェクトパスを取得（WSL側のパス）
$projectPath = "~/DockerDashBord"

Write-Host "📂 Project Path (WSL): $projectPath" -ForegroundColor Green
Write-Host ""

# WSL内でテストを実行
Write-Host "🚀 Executing tests in WSL..." -ForegroundColor Yellow
Write-Host ""

wsl bash -c "cd $projectPath && ./run-all-tests.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Tests failed!" -ForegroundColor Red
    exit 1
}
```

### 使い方

```powershell
# PowerShellで実行
.\run-tests-wsl.ps1
```

---

## 📋 チェックリスト

実行前に確認：

- [ ] WSLターミナルで実行している（Windows側ではない）
- [ ] プロジェクトディレクトリに移動している（`pwd`で確認）
- [ ] 依存関係がインストールされている（`npm run install:all`）
- [ ] Dockerが起動している（`docker compose ps`）

---

## 🔧 トラブルシューティング

### 問題: WSLに入れない

```bash
# WSLを再起動（PowerShell管理者権限）
wsl --shutdown
wsl
```

### 問題: プロジェクトディレクトリが見つからない

```bash
# WSL内で現在地を確認
pwd

# ホームディレクトリを確認
echo $HOME

# プロジェクトを探す
find ~ -name "DockerDashBord" -type d 2>/dev/null
```

### 問題: パーミッションエラー

```bash
# スクリプトに実行権限を付与
chmod +x run-all-tests.sh

# 再度実行
./run-all-tests.sh
```

---

## まとめ

**最も簡単な方法:**

1. **WSLターミナルを開く**: `wsl` コマンドまたはスタートメニューから
2. **プロジェクトへ移動**: `cd ~/DockerDashBord`
3. **テストを実行**: `./run-all-tests.sh`

**これでUNCパスエラーは発生しません！** 🎉
