# git-watch

Git リポジトリの upstream 更新を定期的に検知し、macOS 通知センター経由で通知する CLI ツール。

## 特徴

- 🔍 **自動監視**: 指定した間隔で upstream の変更を自動的にチェック
- 🔔 **デスクトップ通知**: macOS 通知センター経由でリアルタイムに通知
- 🚀 **オプション自動 pull**: 安全な条件下で自動的に pull を実行
- 📦 **依存関係ゼロ**: Node.js 標準ライブラリのみを使用
- 🧪 **100% TypeScript**: 完全な型安全性とテストカバレッジ
- 💾 **重複通知防止**: 同じ更新に対して複数回通知しない

## 前提条件

- **Node.js**: 18.0.0 以上
- **OS**: macOS（通知機能は macOS のみ対応）
- **Git**: リポジトリに upstream が設定されている必要があります

## インストール

### 方法 1: GitHub 経由で直接インストール（推奨）

```bash
# グローバルインストール
npm install -g git+https://github.com/TsubasaKawajiri/git-watch.git

# または yarn を使う場合
yarn global add git+https://github.com/TsubasaKawajiri/git-watch.git

# 確認
git-watch --help
```

### 方法 2: 手動インストール（開発者向け）

```bash
# リポジトリをクローン
git clone https://github.com/TsubasaKawajiri/git-watch.git
cd git-watch

# 依存関係をインストール
npm install

# ビルド
npm run build

# グローバルにリンク
npm link
```

### 初回セットアップ：通知権限の設定

インストール後、**初回起動時に通知権限の設定が必要です**。

1. `git-watch` を一度起動する（通知が表示されなくても OK）
2. **システム設定** → **通知** を開く
3. 左側のリストから「**terminal-notifier**」を探す
4. 「**通知を許可**」をオンにする
5. 通知スタイルを「**バナー**」または「**通知**」に設定

<img width="600" alt="通知設定の例" src="https://user-images.githubusercontent.com/placeholder/notification-settings.png">

**注意**: `terminal-notifier` は `node-notifier` が内部で使用する通知アプリです。

## 使い方

### 基本的な使用方法

```bash
# デフォルト設定で起動（60秒ごとにチェック、通知のみ）
git-watch

# 30秒ごとにチェック
git-watch --interval 30

# 自動 pull を有効化
git-watch --auto-pull

# カスタム間隔 + 自動 pull
git-watch --interval 120 --auto-pull
```

### オプション

| オプション | 短縮形 | デフォルト | 説明 |
|-----------|--------|-----------|------|
| `--interval <seconds>` | `-i` | `60` | チェック間隔（秒単位） |
| `--auto-pull` | - | `false` | 条件を満たす場合に自動 pull を実行 |
| `--help` | `-h` | - | ヘルプメッセージを表示 |

### 自動 pull の条件

`--auto-pull` オプションを指定した場合、以下の条件を**すべて**満たす場合のみ自動的に pull が実行されます：

1. ✅ **Working tree がクリーン**: コミットされていない変更がない
2. ✅ **Fast-forward が可能**: 履歴の分岐がなく、安全に merge できる

条件を満たさない場合は、通知のみが送信され、理由が表示されます。

## 動作例

### 通知のみモード（デフォルト）

```bash
$ git-watch --interval 60

Watching repository at /Users/you/project
Checking every 60 seconds
Auto-pull: disabled
Press Ctrl+C to stop

[13:00:00] Checking for updates...
Found 3 new commit(s):
abc1234 feat: add new feature
def5678 fix: resolve bug
ghi9012 docs: update README

Notification sent.
```

通知内容：
```
タイトル: project (main)
メッセージ: 3件の新しいコミット
```

### 自動 pull モード

```bash
$ git-watch --auto-pull

Watching repository at /Users/you/project
Checking every 60 seconds
Auto-pull: enabled
Press Ctrl+C to stop

[13:00:00] Checking for updates...
Found 2 new commit(s):
abc1234 feat: improve performance
def5678 test: add integration tests

Pulling changes...
Successfully pulled changes.
```

通知内容：
```
タイトル: project (main)
メッセージ: 2件の新しいコミットを自動プル
```

### 自動 pull できない場合

Working tree が dirty な場合：

```bash
[13:00:00] Checking for updates...
Found 1 new commit(s):
abc1234 chore: update dependencies

Cannot auto-pull: 未コミットの変更があります
```

通知内容：
```
タイトル: project (main)
メッセージ: 1件の新しいコミット（自動プル不可: 未コミットの変更があります）
```

## 設定ファイル

状態は `~/.git-watch/state.json` に保存されます：

```json
{
  "/Users/you/project1": "abc123...",
  "/Users/you/project2": "def456..."
}
```

このファイルは重複通知を防ぐために使用されます。同じ upstream HEAD に対しては 1 回のみ通知が送信されます。

## エラーハンドリング

- **fetch 失敗時**: エラーをログに出力し、指数バックオフ（最大 16 倍）を適用
- **upstream 未設定**: スキップして次のチェックを継続
- **ネットワークエラー**: 自動的にリトライ（バックオフ付き）

## 開発

### テストの実行

```bash
# すべてのテストを実行
npm test

# カバレッジ付きでテスト実行
npm test -- --experimental-test-coverage
```

### ビルド

```bash
# TypeScript をコンパイル
npm run build

# ウォッチモードでビルド
npm run watch
```

### プロジェクト構造

```
git-watch/
├── bin/
│   └── git-watch.js          # CLI エントリーポイント
├── src/
│   ├── index.ts              # メインロジック・CLI 引数パース
│   ├── git.ts                # Git コマンドラッパー
│   ├── notifier.ts           # macOS 通知ロジック
│   ├── state.ts              # 状態管理（重複通知防止）
│   └── watcher.ts            # ウォッチャーロジック
├── test/
│   ├── git.test.ts
│   ├── notifier.test.ts
│   ├── state.test.ts
│   └── watcher.test.ts
├── dist/                     # ビルド出力先
├── package.json
├── tsconfig.json
└── README.md
```

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js 18+
- **テストフレームワーク**: Node.js 組み込みテストランナー
- **依存関係**: なし（標準ライブラリのみ）

## ライセンス

MIT

## 貢献

Issue や Pull Request を歓迎します！

## TODO

- [ ] Linux サポート（libnotify 経由）
- [ ] Windows サポート（PowerShell 経由）
- [ ] 複数リポジトリの同時監視
- [ ] カスタム通知テンプレート
- [ ] Webhook 通知サポート
