const User = require('./User');
const Workflow = require('./Workflow');
const Translation = require('./Translation');
const Package = require('./Package');

// リレーション定義
// User - Workflow
User.hasMany(Workflow, { foreignKey: 'userId', as: 'workflows' });
Workflow.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Translation
User.hasMany(Translation, { foreignKey: 'userId', as: 'translations' });
Translation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Package
User.hasMany(Package, { foreignKey: 'userId', as: 'packages' });
Package.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Workflow - Translation
Workflow.hasMany(Translation, { foreignKey: 'workflowId', as: 'translations' });
Translation.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });

// Workflow - Package
Workflow.hasOne(Package, { foreignKey: 'workflowId', as: 'package' });
Package.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });

module.exports = {
  User,
  Workflow,
  Translation,
  Package
};