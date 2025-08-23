# ローカル開発環境セットアップガイド

## 前提条件

以下のソフトウェアがインストールされている必要があります：

- **Node.js** 18.x以上 
- **PostgreSQL** 14.x以上
- **Redis** 7.x以上
- **Git**

## セットアップ手順

### 1. データベースセットアップ

#### PostgreSQLの設定
```bash
# PostgreSQLサービスを開始
sudo systemctl start postgresql  # Linux
# または
brew services start postgresql   # macOS

# データベースとユーザーを作成
sudo -u postgres psql

-- PostgreSQL内で実行
CREATE USER n8n_user WITH PASSWORD 'n8n_password';
CREATE DATABASE n8n_localization OWNER n8n_user;
GRANT ALL PRIVILEGES ON DATABASE n8n_localization TO n8n_user;
\q
```

#### Redisの設定
```bash
# Redisサービスを開始
sudo systemctl start redis       # Linux
# または  
brew services start redis        # macOS

# 動作確認
redis-cli ping  # PONG が返ればOK
```

### 2. プロジェクトのクローン・セットアップ

```bash
# プロジェクトディレクトリに移動
cd n8n-workflow-localization-platform

# バックエンド依存関係のインストール
cd backend
npm install

# フロントエンド依存関係のインストール  
cd ../frontend
npm install

# ルートディレクトリに戻る
cd ..
```

### 3. 環境変数の設定

#### backend/.env
```bash
# データベース設定
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://n8n_user:n8n_password@localhost:5432/n8n_localization

# Redis設定
REDIS_URL=redis://localhost:6379

# JWT設定
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# 翻訳API設定（オプション - テスト時は空でもOK）
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
DEEPL_API_KEY=your-deepl-api-key

# CORS設定
CORS_ORIGIN=http://localhost:3000

# ファイルアップロード設定
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=application/json

# ログ設定
LOG_LEVEL=info
```

#### frontend/.env
```bash
# API設定
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_VERSION=v1

# 環境設定
REACT_APP_ENV=development

# ファイルアップロード設定
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=.json

# UI設定
REACT_APP_ITEMS_PER_PAGE=20
REACT_APP_DEFAULT_LANGUAGE=ja

# 機能フラグ
REACT_APP_ENABLE_GOOGLE_TRANSLATE=true
REACT_APP_ENABLE_DEEPL=true
REACT_APP_ENABLE_ANALYTICS=false
```

### 4. データベースの初期化

```bash
cd backend

# データベーステーブルを作成（Sequelizeの自動同期を使用）
npm run dev  # 初回起動時に自動でテーブル作成
```

### 5. アプリケーションの起動

#### ターミナル1: バックエンド
```bash
cd backend
npm run dev

# 以下のメッセージが表示されればOK:
# Database connection has been established successfully.
# Database synchronized
# Server is running on port 3001
```

#### ターミナル2: フロントエンド
```bash  
cd frontend
npm start

# ブラウザが自動で http://localhost:3000 を開く
```

### 6. 動作確認

1. **ブラウザで http://localhost:3000 にアクセス**
2. **「無料で始める」をクリックしてアカウント作成**
3. **ログイン後、「ワークフローをアップロード」を試す**

## トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー
```bash
# PostgreSQLが起動しているか確認
sudo systemctl status postgresql

# データベースが存在するか確認
sudo -u postgres psql -l | grep n8n_localization
```

#### 2. Redis接続エラー
```bash
# Redisが起動しているか確認
redis-cli ping

# または
sudo systemctl status redis
```

#### 3. ポート競合エラー
```bash
# 使用中のポートを確認
lsof -i :3000  # フロントエンド
lsof -i :3001  # バックエンド
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# プロセスを終了
kill -9 <PID>
```

#### 4. 翻訳API エラー
- Google Translate API キーが無効な場合、翻訳機能は動作しませんが、他の機能は正常に動作します
- テスト時はAPI キーなしでも基本機能の確認が可能です

#### 5. フロントエンドのコンパイルエラー
```bash
# node_modules を削除して再インストール
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 6. バックエンドの起動エラー
```bash
# ログを確認
cd backend
npm run dev 2>&1 | tee debug.log

# 依存関係の再インストール
rm -rf node_modules package-lock.json  
npm install
```

## 開発時のコマンド

### バックエンド
```bash
cd backend

# 開発サーバー起動
npm run dev

# テスト実行
npm test

# リント実行
npm run lint

# コードフォーマット
npm run format
```

### フロントエンド
```bash
cd frontend

# 開発サーバー起動
npm start

# ビルド（本番用）
npm run build

# テスト実行
npm test

# リント実行
npm run lint
```

## データベース管理

### PostgreSQL操作
```bash
# データベースに接続
sudo -u postgres psql n8n_localization

-- テーブル一覧表示
\dt

-- ユーザーテーブルの確認
SELECT * FROM users LIMIT 5;

-- データベースリセット（注意：全データ削除）
DROP DATABASE n8n_localization;
CREATE DATABASE n8n_localization OWNER n8n_user;
```

### Redis操作
```bash
# Redisに接続
redis-cli

# キー一覧表示
keys *

# キャッシュクリア
flushall
```

## API エンドポイントテスト

### cURLでのテスト例
```bash
# ヘルスチェック
curl http://localhost:3001/health

# ユーザー登録
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# サポート言語取得
curl http://localhost:3001/api/v1/translations/languages/supported
```

## VSCode設定（推奨）

`.vscode/settings.json`
```json
{
  "eslint.workingDirectories": ["backend", "frontend"],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## パフォーマンス確認

### システムリソース監視
```bash
# CPUとメモリ使用量
top -p $(pgrep -f "node")

# ポート使用状況
netstat -tulpn | grep -E ":(3000|3001|5432|6379)"
```

このセットアップガイドに従えば、ローカル環境でn8n Workflow Localization Platformを完全に動作させることができます。