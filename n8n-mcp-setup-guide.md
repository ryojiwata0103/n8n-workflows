# n8n-MCP セットアップガイド

## 概要
n8n-MCPは、AIアシスタント（Claude）がn8nワークフロー自動化プラットフォームと連携できるようにするModel Context Protocol (MCP)サーバーです。

## セットアップ方法

### 方法1: NPXを使用した簡単なセットアップ（推奨）

1. **Windows側のClaude Desktop設定**
   - `%APPDATA%\Claude\claude_desktop_config.json`を開く（存在しない場合は作成）
   - 以下の内容を追加：

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "n8n-mcp@latest"
      ],
      "env": {
        "MCP_MODE": "stdio",
        "MCP_LOG_LEVEL": "info",
        "NODE_ENV": "production",
        "REBUILD_ON_START": "false"
      }
    }
  }
}
```

2. **Claude Desktopを再起動**

### 方法2: ローカルインストール

1. **依存関係のインストール**
```bash
cd /home/n8n/n8n-mcp
npm install  # 時間がかかる場合があります
npm run build
npm run rebuild  # データベースの構築
```

2. **設定ファイルの編集**
   - `/home/n8n/n8n-mcp/.env`を編集

3. **Claude Desktop設定**
   - `claude_desktop_config_local.json`の内容を使用

## n8n APIとの接続設定（オプション）

n8n APIを有効にすることで、Claudeから直接ワークフローを作成・更新できます。

### 1. n8n側の設定

1. n8nインスタンスにログイン
2. Settings → API に移動
3. "Create New API Key"をクリック
4. 生成されたAPIキーをコピー

### 2. n8n-MCP側の設定

#### NPX版の場合
Claude Desktop設定に環境変数を追加：

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp@latest"],
      "env": {
        "MCP_MODE": "stdio",
        "MCP_LOG_LEVEL": "info",
        "NODE_ENV": "production",
        "REBUILD_ON_START": "false",
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTU5NmMzOS01YWNhLTQxOTgtOGYxMS0xZmQ0N2EwOTExZWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1OTE3MjMwfQ.m9mqWEab3uhis4X13xsqr2alkdk34x1UFLJmC5_5qyU"
      }
    }
  }
}
```

#### ローカルインストール版の場合
`.env`ファイルを編集：

```bash
# N8N API CONFIGURATION
N8N_API_URL=http://localhost:5678
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTU5NmMzOS01YWNhLTQxOTgtOGYxMS0xZmQ0N2EwOTExZWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1OTE3MjMwfQ.m9mqWEab3uhis4X13xsqr2alkdk34x1UFLJmC5_5qyU
```

## 利用可能な機能

### API接続なしで利用可能
- n8nノードの検索と情報取得
- ノード設定の例の取得
- ワークフロー構造の検証
- プロパティ依存関係の分析

### API接続ありで利用可能（追加機能）
- ワークフローの作成
- ワークフローの更新
- ワークフローの実行
- ワークフローの削除

## トラブルシューティング

### よくある問題

1. **MCPサーバーが起動しない**
   - Node.jsがインストールされているか確認
   - `npx`コマンドが利用可能か確認

2. **n8n APIに接続できない**
   - n8nインスタンスが起動しているか確認
   - APIキーが正しいか確認
   - URLが正しいか確認（`/api/v1`は不要）

3. **データベースエラー**
   - `REBUILD_ON_START=true`に設定して再起動

## 動作確認

Claude Desktopで以下のプロンプトを試してください：

```
n8nのHTTP Requestノードについて教えてください
```

```
Slackにメッセージを送信するワークフローの例を作成してください
```

## セキュリティに関する注意

- APIキーは安全に管理してください
- 本番環境では`NODE_ENV=production`を使用
- 必要に応じて`AUTH_TOKEN`を設定

## 参考リンク

- [n8n-mcp GitHub](https://github.com/czlonkowski/n8n-mcp)
- [n8n Documentation](https://docs.n8n.io)
- [Model Context Protocol](https://github.com/anthropics/mcp)