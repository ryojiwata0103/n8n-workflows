# n8n Integration Platform - ワークフロー統合プラットフォーム

## プロジェクト概要
n8nワークフローエンジンを活用した統合プラットフォーム。様々なサービス・API・ツールを連携させる自動化ワークフローを構築・管理する。

## 技術スタック
- **ベース**: n8n (Open Source Workflow Automation)
- **Runtime**: Node.js 18+
- **データベース**: PostgreSQL / SQLite
- **コンテナ**: Docker + Docker Compose
- **プロトコル**: REST API, Webhook, GraphQL
- **認証**: OAuth, API Key, JWT

## 主要機能
- **ワークフロー作成**: ノーコードでの自動化フロー構築
- **多数のノード**: 400+ のサービス連携ノード
- **API統合**: REST/GraphQL API呼び出し
- **データ変換**: JSON/XML/CSV データ処理
- **スケジュール実行**: Cron式による定期実行
- **Webhook対応**: イベント駆動型ワークフロー

## プロジェクト構成
```
n8n-integration/
├── docker-compose.yml     # n8nサーバー設定
├── workflows/             # ワークフローファイル
│   ├── data-sync.json    # データ同期ワークフロー
│   ├── notification.json # 通知ワークフロー
│   └── ai-content.json   # AIコンテンツ生成
├── custom-nodes/          # カスタムノード
├── credentials/           # 認証情報（gitignore）
├── logs/                 # 実行ログ
└── README.md             # セットアップガイド
```

## 起動方法
```bash
cd /home/ryoji/.project/n8n-integration
docker-compose up -d
```

## アクセス情報
- **Web UI**: http://localhost:5678
- **Webhook URL**: http://localhost:5678/webhook/
- **API**: http://localhost:5678/rest/

## 統合サービス例
- **AI Services**: Claude API, OpenAI, Gemini
- **Database**: MySQL, PostgreSQL, MongoDB
- **Communication**: Slack, Discord, Teams
- **Storage**: Google Drive, Dropbox, S3
- **CRM**: Salesforce, HubSpot
- **Development**: GitHub, GitLab, Jira

## ワークフロー例

### 1. AI記事生成 + WordPress投稿
```
Trigger (Schedule) → Claude API → Content Processing → WordPress API
```

### 2. データ同期ワークフロー
```
Database A → Data Transform → Validation → Database B → Notification
```

### 3. 監視・アラート
```
API Monitor → Error Detection → Slack Notification → Incident Creation
```

## カスタムノード開発
```javascript
// カスタムノード例
class CustomApiNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Custom API',
        name: 'customApi',
        group: ['transform'],
        version: 1,
        inputs: ['main'],
        outputs: ['main']
    };
}
```

## 環境変数設定
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=password
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
```

## セキュリティ機能
- **認証**: Basic Auth / OAuth対応
- **HTTPS**: SSL/TLS暗号化
- **認証情報暗号化**: データベース内認証情報保護
- **IP制限**: アクセス元IP制限
- **ログ監査**: 実行ログ・監査ログ

## 運用・監視
- **ワークフロー実行状況監視**: ダッシュボード
- **エラーハンドリング**: 失敗時のリトライ・通知
- **パフォーマンス監視**: 実行時間・リソース使用量
- **バックアップ**: ワークフロー・認証情報バックアップ

---
> 📄 **更新日**: 2025-08-19
> 🔄 **状態**: 統合プラットフォーム稼働中（localhost:5678）