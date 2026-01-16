# スクリプトのパス問題修正完了

## 問題

`./export-for-offline.sh: line 24: cd: /home/user/webapp: No such file or directory`

## 原因

スクリプト内でハードコードされたパス `/home/user/webapp` が使用されていたため、実際の環境（`/home/user1/DockerDashBord` など）では動作しませんでした。

## 修正内容

### 1. `export-for-offline.sh`

**変更前:**
```bash
PROJECT_DIR="/home/user/webapp"
```

**変更後:**
```bash
# スクリプトが置かれているディレクトリを自動検出
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
```

### 2. `run-all-tests.sh`

すでに正しく実装されています（修正済み）：
```bash
# 現在のディレクトリを保存（絶対パスで取得）
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
```

### 3. `import-offline.sh`

問題なし（カレントディレクトリを使用）。

## 確認方法

```bash
# スクリプトが正しく動作するか確認
cd ~/DockerDashBord  # または実際のプロジェクトディレクトリ

# 構文チェック
bash -n export-for-offline.sh
bash -n run-all-tests.sh
bash -n import-offline.sh

# テスト実行
./export-for-offline.sh
```

## どこで実行しても動作する理由

修正後のスクリプトは、以下のいずれの環境でも動作します：

- `/home/user/webapp`（元の想定環境）
- `/home/user1/DockerDashBord`（実際のWSL2環境）
- `~/project/hospital-dashboard`（任意のディレクトリ）

なぜなら、スクリプトが**実行時に自分自身の場所を自動検出**するからです。

## 技術的な説明

### `${BASH_SOURCE[0]}`
- スクリプトファイル自身のパスを返す
- 例: `./export-for-offline.sh` または `/full/path/to/export-for-offline.sh`

### `dirname "${BASH_SOURCE[0]}"`
- スクリプトファイルのディレクトリ部分を取得
- 例: `.` または `/full/path/to`

### `cd "$(dirname "${BASH_SOURCE[0]}")" && pwd`
- スクリプトのディレクトリに移動して、絶対パスを取得
- 例: `/home/user1/DockerDashBord`

## まとめ

✅ **修正完了項目:**
- [x] `export-for-offline.sh` - パスの動的取得を実装
- [x] `run-all-tests.sh` - すでに修正済み
- [x] `import-offline.sh` - 問題なし

✅ **結果:**
- どのディレクトリに配置しても動作
- WSL2、Ubuntu、任意のLinux環境で動作
- ハードコードされたパスへの依存を完全に排除

## 次のステップ

これで以下が可能になりました：

1. **WSL2でのエクスポート:**
   ```bash
   cd ~/DockerDashBord
   ./export-for-offline.sh
   ```

2. **オフラインUbuntuでのインポート:**
   ```bash
   cd /path/to/hospital-offline-export
   ./import-offline.sh
   ```

3. **どこでもテスト実行:**
   ```bash
   cd /any/path/to/project
   ./run-all-tests.sh
   ```

---

**関連ドキュメント:**
- [WSL_TO_UBUNTU_MIGRATION.md](./WSL_TO_UBUNTU_MIGRATION.md)
- [OFFLINE_MIGRATION.md](./OFFLINE_MIGRATION.md)
- [WSL_TO_UBUNTU_QUICKSTART.md](./WSL_TO_UBUNTU_QUICKSTART.md)
