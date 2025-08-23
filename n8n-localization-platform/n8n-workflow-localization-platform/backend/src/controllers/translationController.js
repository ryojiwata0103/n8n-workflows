const { Workflow, Translation } = require('../models');
const translationService = require('../services/translationService');
const n8nParser = require('../services/n8nParser');

/**
 * 翻訳実行
 */
const executeTranslation = async (req, res, next) => {
  try {
    const { workflowId, targetLanguage, translationEngine = 'google' } = req.body;

    // ワークフロー存在確認
    const workflow = await Workflow.findOne({
      where: {
        id: workflowId,
        userId: req.userId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!workflow.extractedTexts || workflow.extractedTexts.length === 0) {
      return res.status(400).json({ error: 'No texts available for translation' });
    }

    // 翻訳レコード作成
    const translation = await Translation.create({
      workflowId,
      userId: req.userId,
      targetLanguage,
      translationEngine,
      status: 'processing'
    });

    // 非同期で翻訳実行
    processTranslation(translation.id, workflow, targetLanguage, translationEngine);

    res.status(202).json({
      message: 'Translation started',
      translationId: translation.id,
      status: 'processing',
      estimatedTime: Math.ceil(workflow.extractedTexts.length / 10) // 10テキスト/秒の想定
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 翻訳処理（非同期）
 */
const processTranslation = async (translationId, workflow, targetLanguage, translationEngine) => {
  try {
    const translation = await Translation.findByPk(translationId);
    
    // 翻訳実行
    const result = await translationService.translateWorkflowTexts(
      workflow.extractedTexts,
      targetLanguage,
      translationEngine
    );

    if (result.success) {
      // 翻訳結果をワークフローに統合
      const translatedWorkflow = n8nParser.integrate(
        workflow.fileContent,
        result.translatedTexts
      );

      // 結果保存
      await translation.update({
        translatedTexts: result.translatedTexts,
        translatedWorkflow,
        qualityScore: result.summary.averageQuality,
        status: 'completed',
        completedAt: new Date()
      });
    } else {
      await translation.update({
        status: 'failed',
        errorMessage: result.error
      });
    }
  } catch (error) {
    console.error('Translation processing error:', error);
    await Translation.findByPk(translationId).then(t => 
      t?.update({
        status: 'failed',
        errorMessage: error.message
      })
    );
  }
};

/**
 * 翻訳履歴取得
 */
const getTranslations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Translation.findAndCountAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'targetLanguage',
        'translationEngine',
        'qualityScore',
        'status',
        'createdAt',
        'completedAt'
      ],
      include: [
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['id', 'originalFilename']
        }
      ]
    });

    res.json({
      translations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 翻訳詳細取得
 */
const getTranslation = async (req, res, next) => {
  try {
    const translation = await Translation.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: [
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['id', 'originalFilename', 'extractedTexts']
        }
      ]
    });

    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({ translation });
  } catch (error) {
    next(error);
  }
};

/**
 * 翻訳結果修正
 */
const updateTranslation = async (req, res, next) => {
  try {
    const { translatedTexts } = req.body;

    const translation = await Translation.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: [
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['fileContent']
        }
      ]
    });

    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    // 修正された翻訳をワークフローに統合
    const translatedWorkflow = n8nParser.integrate(
      translation.workflow.fileContent,
      translatedTexts
    );

    // 品質スコア再計算
    const qualityScores = await translationService.calculateQualityScores(translatedTexts);
    const averageQuality = translationService.calculateAverageQuality(qualityScores);

    await translation.update({
      translatedTexts,
      translatedWorkflow,
      qualityScore: averageQuality
    });

    res.json({
      message: 'Translation updated successfully',
      qualityScore: averageQuality
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 翻訳済みワークフローダウンロード
 */
const downloadTranslatedWorkflow = async (req, res, next) => {
  try {
    const translation = await Translation.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      attributes: ['translatedWorkflow', 'targetLanguage'],
      include: [
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['originalFilename']
        }
      ]
    });

    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    if (!translation.translatedWorkflow) {
      return res.status(400).json({ error: 'Translation not completed' });
    }

    // 言語コードに応じたプリフィックスを決定
    const languagePrefixes = {
      'ja': 'jp_',
      'zh': 'cn_',
      'ko': 'kr_',
      'es': 'es_',
      'fr': 'fr_',
      'de': 'de_'
    };
    
    const prefix = languagePrefixes[translation.targetLanguage] || `${translation.targetLanguage}_`;
    const originalName = translation.workflow.originalFilename;
    
    // 元のファイル名の先頭にプリフィックスを追加
    const filename = prefix + originalName;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(translation.translatedWorkflow);
  } catch (error) {
    next(error);
  }
};

/**
 * サポート言語取得
 */
const getSupportedLanguages = async (req, res, next) => {
  try {
    const languages = translationService.getSupportedLanguages();
    res.json({ languages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  executeTranslation,
  getTranslations,
  getTranslation,
  updateTranslation,
  downloadTranslatedWorkflow,
  getSupportedLanguages
};