const { Sequelize, DataTypes } = require('sequelize');

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || null;

if (!POSTGRES_URL) {
  module.exports = null;
  return;
}

const sequelize = new Sequelize(POSTGRES_URL, {
  dialect: 'postgres',
  logging: false,
});

// load models
const Product = require('../models/pg/Product')(sequelize, DataTypes);
const User = require('../models/pg/User')(sequelize, DataTypes);
const Order = require('../models/pg/Order')(sequelize, DataTypes);

// associations
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, Product, User, Order };
