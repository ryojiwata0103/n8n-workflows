const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Translation = sequelize.define('Translation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workflowId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'workflow_id',
    references: {
      model: 'workflows',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sourceLanguage: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
    field: 'source_language'
  },
  targetLanguage: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'target_language'
  },
  translationEngine: {
    type: DataTypes.ENUM('google', 'deepl', 'manual'),
    allowNull: false,
    field: 'translation_engine'
  },
  translatedTexts: {
    type: DataTypes.TEXT,
    field: 'translated_texts',
    get() {
      const value = this.getDataValue('translatedTexts');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('translatedTexts', value ? JSON.stringify(value) : null);
    }
  },
  translatedWorkflow: {
    type: DataTypes.TEXT,
    field: 'translated_workflow',
    get() {
      const value = this.getDataValue('translatedWorkflow');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('translatedWorkflow', value ? JSON.stringify(value) : null);
    }
  },
  qualityScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'quality_score',
    validate: {
      min: 0,
      max: 100
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  }
}, {
  tableName: 'translations',
  timestamps: true,
  underscored: true
});

module.exports = Translation;