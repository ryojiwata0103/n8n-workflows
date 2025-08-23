/**
 * グローバルエラーハンドリングミドルウェア
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelizeバリデーションエラー
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      error: 'Validation error',
      details: errors
    });
  }

  // Sequelizeユニーク制約エラー
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate entry',
      field: err.errors[0]?.path
    });
  }

  // ファイルアップロードエラー
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      maxSize: process.env.MAX_FILE_SIZE
    });
  }

  // カスタムエラー
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  // デフォルトエラー
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;