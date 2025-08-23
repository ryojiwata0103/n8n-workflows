const { Translation, Workflow } = require('../models');
const n8nIntegrationService = require('../services/n8nIntegrationService');

/**
 * n8n接続テスト
 */
const testConnection = async (req, res, next) => {
  try {
    const result = await n8nIntegrationService.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          workflowCount: result.workflowCount,
          n8nVersion: result.n8nVersion,
          configuration: n8nIntegrationService.getConfiguration()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * n8n健全性チェック
 */
const healthCheck = async (req, res, next) => {
  try {
    const result = await n8nIntegrationService.healthCheck();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(503).json(result);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 翻訳済みワークフローをn8nにインポート
 */
const importTranslatedWorkflow = async (req, res, next) => {
  try {
    const { translationId } = req.params;
    const { 
      workflowName, 
      activate = false, 
      overwriteExisting = false 
    } = req.body;

    // 翻訳結果を取得
    const translation = await Translation.findOne({
      where: {
        id: translationId,
        userId: req.userId
      },
      include: [
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['id', 'originalFilename']
        }
      ]
    });

    if (!translation) {
      return res.status(404).json({ 
        success: false, 
        message: '翻訳結果が見つかりません' 
      });
    }

    if (translation.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: '翻訳が完了していません' 
      });
    }

    if (!translation.translatedWorkflow) {
      return res.status(400).json({ 
        success: false, 
        message: '翻訳済みワークフローデータが存在しません' 
      });
    }

    // ワークフロー名の決定
    const finalWorkflowName = workflowName || 
      `${translation.workflow.originalFilename.replace('.json', '')} (${getLanguageLabel(translation.targetLanguage)})`;

    // 名前の重複チェック
    if (!overwriteExisting) {
      const nameCheck = await n8nIntegrationService.checkWorkflowNameExists(finalWorkflowName);
      if (nameCheck.exists) {
        return res.status(409).json({
          success: false,
          message: 'ワークフロー名が既に存在します',
          suggestions: nameCheck.suggestions,
          existingName: finalWorkflowName
        });
      }
    }

    // n8nにインポート
    const importResult = await n8nIntegrationService.importWorkflow(
      translation.translatedWorkflow,
      finalWorkflowName,
      {
        activate,
        originalLanguage: translation.sourceLanguage,
        translatedLanguage: translation.targetLanguage
      }
    );

    if (importResult.success) {
      // インポート成功をログ記録
      console.log(`Workflow imported successfully: ${importResult.workflowId}`);
      
      res.json({
        success: true,
        message: importResult.message,
        data: {
          workflowId: importResult.workflowId,
          workflowName: importResult.workflowName,
          n8nUrl: importResult.n8nUrl,
          translationId: translationId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: importResult.message,
        error: importResult.error
      });
    }
  } catch (error) {
    console.error('Import workflow error:', error);
    next(error);
  }
};

/**
 * n8nからワークフロー一覧取得
 */
const getN8nWorkflows = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await n8nIntegrationService.getWorkflows({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    if (result.success) {
      res.json({
        success: true,
        workflows: result.workflows,
        total: result.total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * ワークフロー名の重複チェック
 */
const checkWorkflowName = async (req, res, next) => {
  try {
    const { name } = req.params;
    
    const result = await n8nIntegrationService.checkWorkflowNameExists(name);
    
    res.json({
      success: true,
      exists: result.exists,
      suggestions: result.suggestions || [],
      checkedName: name
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 一括インポート
 */
const bulkImport = async (req, res, next) => {
  try {
    const { translationIds, options = {} } = req.body;
    
    if (!Array.isArray(translationIds) || translationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '翻訳IDのリストが必要です'
      });
    }

    const results = [];
    
    for (const translationId of translationIds) {
      try {
        // 各翻訳を個別にインポート
        const translation = await Translation.findOne({
          where: {
            id: translationId,
            userId: req.userId
          },
          include: [
            {
              model: Workflow,
              as: 'workflow',
              attributes: ['id', 'originalFilename']
            }
          ]
        });

        if (!translation || translation.status !== 'completed') {
          results.push({
            translationId,
            success: false,
            message: '翻訳結果が見つからないか完了していません'
          });
          continue;
        }

        const workflowName = `${translation.workflow.originalFilename.replace('.json', '')} (${getLanguageLabel(translation.targetLanguage)})`;
        
        const importResult = await n8nIntegrationService.importWorkflow(
          translation.translatedWorkflow,
          workflowName,
          {
            activate: options.activate || false,
            originalLanguage: translation.sourceLanguage,
            translatedLanguage: translation.targetLanguage
          }
        );

        results.push({
          translationId,
          success: importResult.success,
          message: importResult.message,
          workflowId: importResult.workflowId,
          workflowName: importResult.workflowName
        });

      } catch (error) {
        results.push({
          translationId,
          success: false,
          message: `インポートエラー: ${error.message}`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `${successCount}件成功, ${failureCount}件失敗`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failure: failureCount
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * 言語ラベル取得
 */
function getLanguageLabel(code) {
  const languageMap = {
    ja: '日本語版',
    zh: '中国語版',
    ko: '韓国語版',
    es: 'スペイン語版',
    fr: 'フランス語版',
    de: 'ドイツ語版'
  };
  return languageMap[code] || `${code}版`;
}

module.exports = {
  testConnection,
  healthCheck,
  importTranslatedWorkflow,
  getN8nWorkflows,
  checkWorkflowName,
  bulkImport
};