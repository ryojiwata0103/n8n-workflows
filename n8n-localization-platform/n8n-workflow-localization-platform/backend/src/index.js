const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const workflowRoutes = require('./routes/workflows');
const translationRoutes = require('./routes/translations');
const packageRoutes = require('./routes/packages');
const n8nRoutes = require('./routes/n8n');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// セキュリティミドルウェア
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true
}));

// レート制限
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// ボディパーサー
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    name: 'n8n Workflow Localization Platform API',
    version: '1.0.0',
    description: 'n8nワークフローの翻訳・ローカライゼーション機能を提供するAPI',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        profile: 'GET /api/v1/auth/profile'
      },
      workflows: {
        upload: 'POST /api/v1/workflows/upload',
        list: 'GET /api/v1/workflows',
        detail: 'GET /api/v1/workflows/:id'
      },
      translations: {
        execute: 'POST /api/v1/translations/execute',
        list: 'GET /api/v1/translations',
        download: 'GET /api/v1/translations/:id/download',
        languages: 'GET /api/v1/translations/languages/supported'
      },
      packages: {
        search: 'GET /api/v1/packages/search',
        create: 'POST /api/v1/packages/create',
        detail: 'GET /api/v1/packages/:id'
      },
      n8n: {
        testConnection: 'GET /api/v1/n8n/test-connection',
        health: 'GET /api/v1/n8n/health',
        workflows: 'GET /api/v1/n8n/workflows',
        import: 'POST /api/v1/n8n/import/:translationId',
        bulkImport: 'POST /api/v1/n8n/bulk-import',
        checkName: 'GET /api/v1/n8n/workflows/check-name/:name'
      }
    },
    documentation: 'https://github.com/your-repo/n8n-workflow-localization-platform',
    frontend: 'http://localhost:3000'
  });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// APIルート
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/translations', translationRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/n8n', n8nRoutes);

// エラーハンドリング
app.use(errorHandler);

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// サーバー起動
const startServer = async () => {
  try {
    // データベース接続テスト
    await testConnection();
    
    // データベース同期（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      console.log('Database synchronized');
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;