/**
 * Translation Service
 * Google Translate APIとDeepL APIを使用した翻訳処理
 */

const axios = require('axios');
const { Translate } = require('@google-cloud/translate').v2;

class TranslationService {
  constructor() {
    // Google Translate クライアント初期化
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      this.googleTranslate = new Translate({
        key: process.env.GOOGLE_TRANSLATE_API_KEY
      });
    }

    // DeepL API設定
    this.deeplApiKey = process.env.DEEPL_API_KEY;
    this.deeplApiUrl = 'https://api-free.deepl.com/v2/translate';

    // キャッシュ設定（Redisを使用予定）
    this.cache = new Map();
  }

  /**
   * テキストを翻訳
   * @param {Array} texts - 翻訳するテキストの配列
   * @param {String} targetLang - 翻訳先言語
   * @param {String} engine - 翻訳エンジン（'google' or 'deepl'）
   * @param {String} sourceLang - 元言語（オプション）
   */
  async translate(texts, targetLang, engine = 'google', sourceLang = 'en') {
    try {
      // 空のテキストをフィルタリング
      const validTexts = texts.filter(text => text && text.trim());
      if (validTexts.length === 0) {
        return [];
      }

      // キャッシュチェック
      const results = [];
      const textsToTranslate = [];
      const textIndices = [];

      validTexts.forEach((text, index) => {
        const cacheKey = this.getCacheKey(text, targetLang, engine);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
          results[index] = cached;
        } else {
          textsToTranslate.push(text);
          textIndices.push(index);
        }
      });

      // 新規翻訳が必要な場合
      if (textsToTranslate.length > 0) {
        let translations;
        
        // 開発環境でAPIキーがない場合はモック翻訳を使用
        if (!this.googleTranslate && !this.deeplApiKey) {
          console.log('翻訳APIキーが設定されていません。モック翻訳を使用します。');
          translations = await this.translateWithMock(textsToTranslate, targetLang);
        } else if (engine === 'deepl' && this.deeplApiKey) {
          translations = await this.translateWithDeepl(textsToTranslate, targetLang, sourceLang);
        } else if (this.googleTranslate) {
          translations = await this.translateWithGoogle(textsToTranslate, targetLang, sourceLang);
        } else {
          console.log('指定された翻訳エンジンが利用できません。モック翻訳を使用します。');
          translations = await this.translateWithMock(textsToTranslate, targetLang);
        }

        // 結果をマージしてキャッシュに保存
        translations.forEach((translation, i) => {
          const index = textIndices[i];
          const text = textsToTranslate[i];
          results[index] = translation;
          
          // キャッシュに保存
          const cacheKey = this.getCacheKey(text, targetLang, engine);
          this.cache.set(cacheKey, translation);
        });
      }

      return results;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * モック翻訳（開発環境用）
   */
  async translateWithMock(texts, targetLang) {
    console.log(`モック翻訳を実行: ${texts.length}個のテキストを${targetLang}に翻訳中...`);
    
    // 翻訳エンジンの遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const languageMap = {
      'ja': '日本語',
      'zh': '中国語',
      'ko': '韓国語',
      'es': 'スペイン語',
      'fr': 'フランス語',  
      'de': 'ドイツ語'
    };
    
    const translations = texts.map(text => {
      // 基本的なモック翻訳ロジック
      let translated = text;
      
      if (targetLang === 'ja') {
        // 日本語への翻訳例
        translated = translated
          .replace(/Hello World/gi, 'こんにちは世界')
          .replace(/test/gi, 'テスト')
          .replace(/workflow/gi, 'ワークフロー')
          .replace(/Start/gi, '開始')
          .replace(/Edit Fields/gi, 'フィールド編集')
          .replace(/End/gi, '終了')
          .replace(/Sample Workflow/gi, 'サンプルワークフロー');
      } else {
        // 他言語は言語名を接尾辞として追加
        const langName = languageMap[targetLang] || targetLang;
        translated = `${text} [${langName}翻訳]`;
      }
      
      return translated;
    });
    
    console.log(`モック翻訳完了: ${translations.length}個のテキストを処理`);
    return translations;
  }

  /**
   * Google Translate APIで翻訳
   */
  async translateWithGoogle(texts, targetLang, sourceLang) {
    try {
      // バッチ処理のサイズ制限
      const batchSize = 100;
      const results = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        // Google Translate API呼び出し
        const [translations] = await this.googleTranslate.translate(batch, {
          from: sourceLang,
          to: this.convertLanguageCode(targetLang, 'google')
        });

        results.push(...(Array.isArray(translations) ? translations : [translations]));
      }

      return results;
    } catch (error) {
      console.error('Google Translate error:', error);
      throw error;
    }
  }

  /**
   * DeepL APIで翻訳
   */
  async translateWithDeepl(texts, targetLang, sourceLang) {
    try {
      // バッチ処理のサイズ制限
      const batchSize = 50;
      const results = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        // DeepL API呼び出し
        const response = await axios.post(this.deeplApiUrl, null, {
          params: {
            auth_key: this.deeplApiKey,
            text: batch,
            source_lang: this.convertLanguageCode(sourceLang, 'deepl').toUpperCase(),
            target_lang: this.convertLanguageCode(targetLang, 'deepl').toUpperCase()
          }
        });

        const translations = response.data.translations.map(t => t.text);
        results.push(...translations);
      }

      return results;
    } catch (error) {
      console.error('DeepL error:', error);
      throw error;
    }
  }

  /**
   * ワークフローテキストを翻訳
   */
  async translateWorkflowTexts(extractedTexts, targetLang, engine = 'google') {
    try {
      // テキストを抽出
      const textsToTranslate = extractedTexts.map(item => item.original);
      
      // 翻訳実行
      const translations = await this.translate(textsToTranslate, targetLang, engine);
      
      // 結果を元の構造にマッピング
      const translatedTexts = extractedTexts.map((item, index) => ({
        ...item,
        translated: translations[index],
        targetLanguage: targetLang,
        translationEngine: engine,
        translatedAt: new Date().toISOString()
      }));

      // 品質スコアを計算
      const qualityScores = await this.calculateQualityScores(translatedTexts);
      
      translatedTexts.forEach((item, index) => {
        item.qualityScore = qualityScores[index];
      });

      return {
        success: true,
        translatedTexts,
        summary: {
          totalTexts: translatedTexts.length,
          engine: engine,
          targetLanguage: targetLang,
          averageQuality: this.calculateAverageQuality(qualityScores)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        translatedTexts: []
      };
    }
  }

  /**
   * 翻訳品質スコアを計算
   */
  async calculateQualityScores(translatedTexts) {
    return translatedTexts.map(item => {
      if (!item.translated) return 0;
      
      // 簡易的な品質評価
      let score = 70; // ベーススコア
      
      // 文字数比率チェック
      const lengthRatio = item.translated.length / item.original.length;
      if (lengthRatio > 0.5 && lengthRatio < 2.0) {
        score += 10;
      }
      
      // 特殊文字の保持チェック
      const specialChars = item.original.match(/[{}()<>\[\]]/g);
      if (specialChars) {
        const translatedSpecialChars = item.translated.match(/[{}()<>\[\]]/g);
        if (translatedSpecialChars && translatedSpecialChars.length === specialChars.length) {
          score += 10;
        }
      }
      
      // コンテキストによる調整
      if (item.context === 'node' && item.type === 'name') {
        score += 5; // ノード名は重要
      }
      
      return Math.min(100, score);
    });
  }

  /**
   * 平均品質スコアを計算
   */
  calculateAverageQuality(scores) {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / scores.length);
  }

  /**
   * 言語コードを変換
   */
  convertLanguageCode(code, api) {
    const mappings = {
      google: {
        'ja': 'ja',
        'en': 'en',
        'zh': 'zh-CN',
        'ko': 'ko',
        'es': 'es',
        'fr': 'fr',
        'de': 'de'
      },
      deepl: {
        'ja': 'JA',
        'en': 'EN',
        'zh': 'ZH',
        'ko': 'KO',
        'es': 'ES',
        'fr': 'FR',
        'de': 'DE'
      }
    };

    return mappings[api][code] || code;
  }

  /**
   * キャッシュキーを生成
   */
  getCacheKey(text, targetLang, engine) {
    return `${engine}:${targetLang}:${text.substring(0, 50)}`;
  }

  /**
   * サポートされている言語のリストを取得
   */
  getSupportedLanguages() {
    return [
      { code: 'ja', name: '日本語', nativeName: '日本語' },
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' }
    ];
  }
}

module.exports = new TranslationService();