# n8n Localization Platform - 多言語化プラットフォーム

## プロジェクト概要
n8nワークフローの多言語化・国際化を支援するプラットフォーム。n8nのカスタムノードやワークフローを複数言語に対応させ、グローバル展開を支援する。

## 技術スタック
- **ベース**: n8n Community Edition
- **言語**: TypeScript/JavaScript
- **国際化**: i18next, vue-i18n
- **翻訳管理**: JSON翻訳ファイル
- **UI Framework**: Vue.js 3
- **ビルドツール**: Vite, Webpack

## 主要機能
- **多言語ノード**: 日本語・英語・中国語対応ノード開発
- **翻訳管理**: 統一翻訳ファイル管理システム
- **ローカライゼーションツール**: 翻訳文言自動抽出
- **UI国際化**: n8nエディタUIの多言語対応
- **文書翻訳**: ワークフロー説明・ヘルプの多言語化

## プロジェクト構成
```
n8n-localization-platform/
├── n8n-workflow-localization-platform/
│   ├── nodes/                 # 多言語対応カスタムノード
│   │   ├── JapaneseText/     # 日本語テキスト処理ノード
│   │   ├── Translator/       # 翻訳ノード
│   │   └── LocaleSwitch/     # 言語切り替えノード
│   ├── translations/          # 翻訳ファイル
│   │   ├── ja.json           # 日本語翻訳
│   │   ├── en.json           # 英語翻訳
│   │   └── zh.json           # 中国語翻訳
│   ├── tools/                # ローカライゼーションツール
│   │   ├── extract-strings.js # 翻訳文言抽出
│   │   └── validate-translations.js # 翻訳検証
│   ├── claude.md             # 既存開発メモ
│   └── README.md             # プロジェクト概要
├── workflows/                 # 多言語ワークフローテンプレート
└── docs/                     # 多言語ドキュメント
```

## 多言語対応ノード例

### 日本語テキスト処理ノード
- ひらがな・カタカナ変換
- 漢字読み仮名変換
- 敬語変換
- 日本語文章校正

### 翻訳ノード
- Google Translate API統合
- DeepL API統合
- カスタム辞書機能
- 専門用語対応

### ローカルコンテンツノード
- 地域固有データ処理
- 通貨・日付フォーマット変換
- 住所正規化（日本郵便番号等）

## 翻訳管理システム
```json
{
  "ja": {
    "nodes": {
      "translator": {
        "displayName": "翻訳",
        "description": "テキストを指定言語に翻訳します"
      }
    },
    "ui": {
      "execute": "実行",
      "save": "保存",
      "cancel": "キャンセル"
    }
  }
}
```

## ローカライゼーションツール
```bash
# 翻訳文言抽出
npm run extract-strings

# 翻訳ファイル検証
npm run validate-translations

# 多言語ビルド
npm run build:multilingual
```

## 開発環境セットアップ
```bash
cd /home/ryoji/.project/n8n-localization-platform/n8n-workflow-localization-platform
npm install
npm run dev
```

## 言語サポート状況
- **日本語 (ja)**: フル対応
- **英語 (en)**: ベース言語
- **中国語 (zh)**: 基本対応
- **韓国語 (ko)**: 計画中
- **ドイツ語 (de)**: 計画中

## カスタムノード開発
```typescript
export class LocalizedNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: this.getDisplayName(),
        name: 'localizedNode',
        group: ['transform'],
        version: 1,
        description: this.getDescription(),
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: this.getPropertyName('language'),
                name: 'language',
                type: 'options',
                options: [
                    { name: '日本語', value: 'ja' },
                    { name: 'English', value: 'en' },
                    { name: '中文', value: 'zh' }
                ]
            }
        ]
    };

    private getDisplayName(): string {
        return this.translate('nodes.localizedNode.displayName');
    }
}
```

## ワークフローテンプレート
- **多言語コンテンツ管理**: CMS多言語化支援
- **国際化データ処理**: 地域別データ変換
- **多言語通知システム**: 言語別通知配信
- **翻訳ワークフロー**: 自動翻訳→レビュー→配信

## 運用・メンテナンス
- **翻訳品質管理**: 翻訳精度チェック
- **用語統一**: 専門用語辞書管理
- **UI一貫性**: デザインシステム準拠
- **パフォーマンス**: 多言語データ最適化

---
> 📄 **更新日**: 2025-08-19  
> 🌐 **状態**: 日本語・英語・中国語対応開発中