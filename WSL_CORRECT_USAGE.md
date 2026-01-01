# ⚠️ WSL環境での正しいスクリプト選択

## ❌ 間違い

WSL環境で `.bat` ファイルを実行すると、Windows側のCMD.EXEが起動されてUNCパスエラーになります：

```bash
# WSLターミナルで実行 - これは間違い！
./run-all-tests.bat
# または
run-all-tests.bat

# エラー:
# UNC パスはサポートされません
# npm error path C:\Windows\package.json
```

## ✅ 正しい方法

### WSLターミナル内で実行する場合

```bash
# .sh スクリプトを使用
./run-all-tests.sh

# または npm スクリプト
npm run test:all
```

### Windows（PowerShell/コマンドプロンプト）から実行する場合

```powershell
# 専用のPowerShellスクリプトを使用
.\run-tests-wsl.ps1
```

---

## 📋 スクリプト使い分けガイド

| 実行環境 | 使用するスクリプト | コマンド |
|---------|-----------------|---------|
| WSL内 | `run-all-tests.sh` | `./run-all-tests.sh` |
| WSL内 | npm スクリプト | `npm run test:all` |
| Windows PowerShell | `run-tests-wsl.ps1` | `.\run-tests-wsl.ps1` |
| Windows ネイティブ* | `run-all-tests.bat` | `run-all-tests.bat` |

*ネイティブWindowsにNode.jsをインストールしている場合のみ

---

## 🎯 あなたの状況での正しい手順

現在のディレクトリ: `/home/user1/DockerDashBord`  
環境: WSLターミナル内

### 推奨: シェルスクリプトを使用

```bash
# 実行権限を確認/付与
chmod +x run-all-tests.sh

# テストを実行
./run-all-tests.sh
```

### 代替: npm スクリプトを使用

```bash
npm run test:all
```

---

## 🔧 現在のエラーを解決

```bash
# 1. 正しいスクリプトに実行権限を付与
chmod +x run-all-tests.sh

# 2. .sh スクリプトで実行
./run-all-tests.sh
```

---

## 💡 なぜ .bat は動かないのか？

### Windows バッチファイル (.bat) の動作

1. WSLで `.bat` ファイルを実行
2. WSLが「これはWindowsのスクリプトだ」と認識
3. Windows側のCMD.EXE経由で実行を試みる
4. パスが `\\wsl.localhost\...` (UNCパス) に変換される
5. CMD.EXEはUNCパスをサポートしていない
6. デフォルトディレクトリ `C:\Windows` にフォールバック
7. `C:\Windows\package.json` を探して失敗

### シェルスクリプト (.sh) の動作

1. WSLで `.sh` ファイルを実行
2. WSLのbashシェルで直接実行
3. パスは `/home/user1/DockerDashBord` のまま
4. 正常に動作 ✅

---

## 📚 関連ドキュメント

- [WSL_QUICKFIX.md](./WSL_QUICKFIX.md) - WSL環境でのテスト実行クイックガイド
- [WSL_EXECUTION_GUIDE.md](./WSL_EXECUTION_GUIDE.md) - WSL実行の詳細説明
- [TEST_QUICKSTART.md](./TEST_QUICKSTART.md) - テスト実行全般のガイド

---

## まとめ

**WSL環境では `.sh` スクリプトを使用！**

```bash
# これ
./run-all-tests.sh

# .bat は使わない！
```

これで問題なく動作します 🎉
