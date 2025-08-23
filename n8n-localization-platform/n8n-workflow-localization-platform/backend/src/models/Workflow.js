const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  originalFilename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_filename'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size'
  },
  fileContent: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'file_content',
    get() {
      const value = this.getDataValue('fileContent');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('fileContent', JSON.stringify(value || {}));
    }
  },
  extractedTexts: {
    type: DataTypes.TEXT,
    field: 'extracted_texts',
    get() {
      const value = this.getDataValue('extractedTexts');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('extractedTexts', value ? JSON.stringify(value) : null);
    }
  },
  status: {
    type: DataTypes.ENUM('uploaded', 'analyzing', 'analyzed', 'translating', 'translated', 'failed'),
    defaultValue: 'uploaded'
  },
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const value = this.getDataValue('metadata');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('metadata', JSON.stringify(value || {}));
    }
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message'
  }
}, {
  tableName: 'workflows',
  timestamps: true,
  underscored: true
});

module.exports = Workflow;