# n8n Workflow Development Environment

n8nワークフロー開発・運用のための専用環境です。

## ディレクトリ構成

- `workflows/` - n8nワークフローJSONファイル
- `custom-nodes/` - カスタムn8nノード開発
- `credentials/` - 認証情報テンプレート
- `scripts/` - デプロイメント・ユーティリティスクリプト
- `docs/` - ワークフロー関連ドキュメント

## 使用方法

1. ローカルn8nインスタンス起動: `http://localhost:5678`
2. ワークフロー作成・編集
3. 自動的にGithubへプッシュ

## 作成済みワークフロー

- **Slack Message Sender** - Slackメッセージ送信ワークフロー