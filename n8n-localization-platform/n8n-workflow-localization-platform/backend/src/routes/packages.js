const express = require('express');
const { body, query, validationResult } = require('express-validator');
const packageController = require('../controllers/packageController');
const { authenticate, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// バリデーションルール
const createPackageValidation = [
  body('workflowId').isUUID(),
  body('title').isLength({ min: 3, max: 255 }),
  body('description').optional().isLength({ max: 5000 }),
  body('category').notEmpty(),
  body('tags').optional().isArray({ max: 10 }),
  body('visibility').isIn(['public', 'private', 'organization'])
];

const searchValidation = [
  query('q').optional().trim(),
  query('category').optional(),
  query('tags').optional(),
  query('sort').optional().isIn(['downloads', 'rating', 'created', 'updated']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

// バリデーションエラーハンドラー
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// パッケージ作成・管理
router.post(
  '/create',
  authenticate,
  createPackageValidation,
  handleValidationErrors,
  packageController.createPackage
);

router.get('/my-packages', authenticate, packageController.getMyPackages);
router.put('/:id', authenticate, packageController.updatePackage);
router.delete('/:id', authenticate, packageController.deletePackage);

// パッケージ検索・閲覧（公開）
router.get(
  '/search',
  optionalAuth,
  searchValidation,
  handleValidationErrors,
  packageController.searchPackages
);

router.get('/categories', packageController.getCategories);
router.get('/popular', optionalAuth, packageController.getPopularPackages);
router.get('/:id', optionalAuth, packageController.getPackage);

// パッケージダウンロード
router.post('/:id/download', optionalAuth, packageController.downloadPackage);

// 評価・レビュー
router.post('/:id/rate', authenticate, packageController.ratePackage);
router.get('/:id/reviews', packageController.getPackageReviews);

module.exports = router;