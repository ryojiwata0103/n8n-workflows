const express = require('express');
const n8nController = require('../controllers/n8nController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// n8n接続テスト
router.get('/test-connection', authenticate, n8nController.testConnection);

// n8n健全性チェック
router.get('/health', authenticate, n8nController.healthCheck);

// n8nからワークフロー一覧取得
router.get('/workflows', authenticate, n8nController.getN8nWorkflows);

// ワークフロー名の重複チェック
router.get('/workflows/check-name/:name', authenticate, n8nController.checkWorkflowName);

// 翻訳済みワークフローをn8nにインポート
router.post('/import/:translationId', authenticate, n8nController.importTranslatedWorkflow);

// 一括インポート
router.post('/bulk-import', authenticate, n8nController.bulkImport);

module.exports = router;