const express = require('express');
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middlewares/auth');
const { upload, validateWorkflowFile } = require('../middlewares/upload');

const router = express.Router();

// ワークフロー管理
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  validateWorkflowFile,
  workflowController.uploadWorkflow
);

router.get('/', authenticate, workflowController.getWorkflows);
router.get('/:id', authenticate, workflowController.getWorkflow);
router.get('/:id/analysis', authenticate, workflowController.getWorkflowAnalysis);
router.delete('/:id', authenticate, workflowController.deleteWorkflow);

// ワークフローダウンロード
router.get('/:id/download', authenticate, workflowController.downloadWorkflow);

module.exports = router;