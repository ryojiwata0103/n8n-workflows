const express = require('express');
const { body, validationResult } = require('express-validator');
const translationController = require('../controllers/translationController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// バリデーションルール
const translateValidation = [
  body('workflowId').isUUID(),
  body('targetLanguage').isIn(['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de']),
  body('translationEngine').isIn(['google', 'deepl'])
];

// バリデーションエラーハンドラー
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 翻訳実行
router.post(
  '/execute',
  authenticate,
  translateValidation,
  handleValidationErrors,
  translationController.executeTranslation
);

// 翻訳履歴取得
router.get('/', authenticate, translationController.getTranslations);
router.get('/:id', authenticate, translationController.getTranslation);

// 翻訳結果の修正
router.patch('/:id', authenticate, translationController.updateTranslation);

// 翻訳済みワークフローのダウンロード
router.get('/:id/download', authenticate, translationController.downloadTranslatedWorkflow);

// サポート言語の取得
router.get('/languages/supported', translationController.getSupportedLanguages);

module.exports = router;