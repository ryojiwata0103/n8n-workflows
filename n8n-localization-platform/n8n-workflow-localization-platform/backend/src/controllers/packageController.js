const { Package, Workflow, Translation, User } = require('../models');
const { Op } = require('sequelize');

/**
 * パッケージ作成
 */
const createPackage = async (req, res, next) => {
  try {
    const { workflowId, title, description, category, tags, visibility } = req.body;

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

    // 既存パッケージ確認
    const existingPackage = await Package.findOne({
      where: { workflowId }
    });

    if (existingPackage) {
      return res.status(409).json({ error: 'Package already exists for this workflow' });
    }

    // パッケージ作成
    const packageData = await Package.create({
      workflowId,
      userId: req.userId,
      title,
      description,
      category,
      tags: tags || [],
      visibility
    });

    res.status(201).json({
      message: 'Package created successfully',
      package: packageData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * マイパッケージ取得
 */
const getMyPackages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Package.findAndCountAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['originalFilename', 'metadata']
        }
      ]
    });

    res.json({
      packages: rows,
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
 * パッケージ検索
 */
const searchPackages = async (req, res, next) => {
  try {
    const {
      q,
      category,
      tags,
      sort = 'created',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {
      visibility: 'public'
    };

    // 検索条件構築
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { [Op.overlap]: tagArray };
    }

    // ソート条件
    const orderMap = {
      downloads: [['downloadCount', 'DESC']],
      rating: [['rating', 'DESC']],
      created: [['createdAt', 'DESC']],
      updated: [['updatedAt', 'DESC']]
    };

    const { count, rows } = await Package.findAndCountAll({
      where,
      order: orderMap[sort] || orderMap.created,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username']
        },
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['metadata']
        }
      ]
    });

    res.json({
      packages: rows,
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
 * カテゴリ一覧取得
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = [
      { id: 'automation', name: 'Automation', description: 'Workflow automation' },
      { id: 'data-processing', name: 'Data Processing', description: 'Data transformation and processing' },
      { id: 'integration', name: 'Integration', description: 'API and service integration' },
      { id: 'notification', name: 'Notification', description: 'Alert and notification workflows' },
      { id: 'monitoring', name: 'Monitoring', description: 'System and application monitoring' },
      { id: 'social-media', name: 'Social Media', description: 'Social media automation' },
      { id: 'e-commerce', name: 'E-commerce', description: 'Online store automation' },
      { id: 'productivity', name: 'Productivity', description: 'Productivity enhancement' }
    ];

    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

/**
 * 人気パッケージ取得
 */
const getPopularPackages = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const packages = await Package.findAll({
      where: { visibility: 'public' },
      order: [
        ['downloadCount', 'DESC'],
        ['rating', 'DESC']
      ],
      limit: parseInt(limit),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username']
        }
      ]
    });

    res.json({ packages });
  } catch (error) {
    next(error);
  }
};

/**
 * パッケージ詳細取得
 */
const getPackage = async (req, res, next) => {
  try {
    const packageData = await Package.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username']
        },
        {
          model: Workflow,
          as: 'workflow',
          attributes: ['metadata', 'extractedTexts'],
          include: [
            {
              model: Translation,
              as: 'translations',
              attributes: ['targetLanguage', 'qualityScore']
            }
          ]
        }
      ]
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // 公開パッケージまたは自分のパッケージのみ表示
    if (packageData.visibility !== 'public' && packageData.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ package: packageData });
  } catch (error) {
    next(error);
  }
};

/**
 * パッケージダウンロード
 */
const downloadPackage = async (req, res, next) => {
  try {
    const packageData = await Package.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Workflow,
          as: 'workflow',
          include: [
            {
              model: Translation,
              as: 'translations',
              where: { status: 'completed' },
              required: false
            }
          ]
        }
      ]
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // 公開パッケージまたは自分のパッケージのみダウンロード可能
    if (packageData.visibility !== 'public' && packageData.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // ダウンロード数増加
    await packageData.increment('downloadCount');

    // 利用可能な翻訳がある場合は翻訳済みワークフローを提供
    const translation = packageData.workflow.translations?.[0];
    const workflowData = translation?.translatedWorkflow || packageData.workflow.fileContent;

    const filename = `${packageData.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(workflowData);
  } catch (error) {
    next(error);
  }
};

/**
 * パッケージ更新
 */
const updatePackage = async (req, res, next) => {
  try {
    const { title, description, category, tags, visibility } = req.body;

    const packageData = await Package.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await packageData.update({
      title: title || packageData.title,
      description: description || packageData.description,
      category: category || packageData.category,
      tags: tags || packageData.tags,
      visibility: visibility || packageData.visibility
    });

    res.json({
      message: 'Package updated successfully',
      package: packageData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * パッケージ削除
 */
const deletePackage = async (req, res, next) => {
  try {
    const packageData = await Package.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    await packageData.destroy();

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * パッケージ評価
 */
const ratePackage = async (req, res, next) => {
  try {
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // 実装をシンプルにするため、とりあえず平均評価を直接更新
    const packageData = await Package.findByPk(req.params.id);
    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // 簡易的な評価更新（実際には評価テーブルを作成すべき）
    const newRating = packageData.rating 
      ? (packageData.rating + rating) / 2 
      : rating;

    await packageData.update({ rating: newRating });

    res.json({
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    next(error);
  }
};

/**
 * パッケージレビュー取得
 */
const getPackageReviews = async (req, res, next) => {
  try {
    // 簡易実装：実際にはレビューテーブルを作成すべき
    res.json({
      reviews: [],
      message: 'Reviews feature not yet implemented'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPackage,
  getMyPackages,
  searchPackages,
  getCategories,
  getPopularPackages,
  getPackage,
  downloadPackage,
  updatePackage,
  deletePackage,
  ratePackage,
  getPackageReviews
};