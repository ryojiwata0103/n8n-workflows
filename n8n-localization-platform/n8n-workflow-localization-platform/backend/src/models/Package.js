const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workflowId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tags: {
    type: DataTypes.TEXT, // SQLiteでは配列の代わりにJSON文字列として保存
    defaultValue: '[]',
    get() {
      const value = this.getDataValue('tags');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('tags', JSON.stringify(value || []));
    }
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'download_count'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    validate: {
      min: 0,
      max: 5
    }
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'organization'),
    defaultValue: 'public'
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0'
  },
  downloadUrl: {
    type: DataTypes.STRING,
    field: 'download_url'
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    field: 'thumbnail_url'
  },
  metadata: {
    type: DataTypes.TEXT, // SQLiteではJSONBの代わりにTEXT
    defaultValue: '{}',
    get() {
      const value = this.getDataValue('metadata');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('metadata', JSON.stringify(value || {}));
    }
  }
}, {
  tableName: 'packages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['visibility']
    }
  ]
});

module.exports = Package;