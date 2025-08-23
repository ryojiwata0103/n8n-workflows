const { Workflow, Translation, Package } = require('../models');
const n8nParser = require('../services/n8nParser');
const { Op } = require('sequelize');

/**
 * ワークフローアップロード
 */
const uploadWorkflow = async (req, res, next) => {
  try {
    const { file, workflowContent, userId } = req;

    // ワークフロー解析
    const parseResult = n8nParser.parse(workflowContent);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Failed to parse workflow',
        details: parseResult.error
      });
    }

    // データベースに保存
    const workflow = await Workflow.create({
      userId,
      originalFilename: file.originalname,
      fileSize: file.size,
      fileContent: workflowContent,
      extractedTexts: parseResult.extractedTexts,
      status: 'analyzed',
      metadata: parseResult.metadata
    });

    res.status(201).json({
      message: 'Workflow uploaded successfully',
      workflow: {
        id: workflow.id,
        filename: workflow.originalFilename,
        status: workflow.status,
        extractedTexts: parseResult.extractedTexts.length,
        metadata: parseResult.metadata
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワークフロー一覧取得
 */
const getWorkflows = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Workflow.findAndCountAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'originalFilename',
        'fileSize',
        'status',
        'metadata',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: Translation,
          as: 'translations',
          attributes: ['id', 'targetLanguage', 'status', 'qualityScore']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'title', 'visibility']
        }
      ]
    });

    res.json({
      workflows: rows,
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
 * ワークフロー詳細取得
 */
const getWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: [
        {
          model: Translation,
          as: 'translations',
          attributes: ['id', 'targetLanguage', 'status', 'qualityScore', 'createdAt']
        },
        {
          model: Package,
          as: 'package'
        }
      ]
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ workflow });
  } catch (error) {
    next(error);
  }
};

/**
 * ワークフロー解析結果取得
 */
const getWorkflowAnalysis = async (req, res, next) => {
  try {
    const workflow = await Workflow.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      attributes: ['id', 'extractedTexts', 'metadata', 'status']
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({
      id: workflow.id,
      status: workflow.status,
      extractedTexts: workflow.extractedTexts,
      metadata: workflow.metadata,
      summary: {
        totalTexts: workflow.extractedTexts?.length || 0,
        nodeCount: workflow.metadata?.nodeCount || 0,
        connectionCount: workflow.metadata?.connectionCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワークフロー削除
 */
const deleteWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await workflow.destroy();

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * ワークフローダウンロード
 */
const downloadWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      attributes: ['originalFilename', 'fileContent']
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${workflow.originalFilename}"`
    );
    res.json(workflow.fileContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadWorkflow,
  getWorkflows,
  getWorkflow,
  getWorkflowAnalysis,
  deleteWorkflow,
  downloadWorkflow
};