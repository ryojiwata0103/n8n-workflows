const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// ファイルストレージ設定
const storage = multer.memoryStorage();

// ファイルフィルター
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['application/json'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JSON files are allowed.'), false);
  }
};

// アップロード設定
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

/**
 * ワークフローファイルのバリデーション
 */
const validateWorkflowFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // JSONパース検証
    const content = JSON.parse(req.file.buffer.toString());
    
    // n8nワークフロー構造の基本検証
    if (!content.nodes || !Array.isArray(content.nodes)) {
      return res.status(400).json({ 
        error: 'Invalid n8n workflow file',
        details: 'Missing nodes array'
      });
    }

    // パース済みコンテンツを追加
    req.workflowContent = content;
    next();
  } catch (error) {
    return res.status(400).json({ 
      error: 'Invalid JSON file',
      details: error.message
    });
  }
};

module.exports = {
  upload,
  validateWorkflowFile
};