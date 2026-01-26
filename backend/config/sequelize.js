const { Sequelize, DataTypes } = require('sequelize');

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || null;

if (!POSTGRES_URL) {
  // No Postgres configured — export null so callers can gracefully fall back.
  module.exports = null;
} else {
  const sequelize = new Sequelize(POSTGRES_URL, {
    dialect: 'postgres',
    logging: false,
  });

  // load models
  const Product = require('../models/pg/Product')(sequelize, DataTypes);
  const User = require('../models/pg/User')(sequelize, DataTypes);
  const Order = require('../models/pg/Order')(sequelize, DataTypes);
  const Review = require('../models/pg/Review')(sequelize, DataTypes);
  const Notification = require('../models/pg/Notification')(sequelize, DataTypes);

  // associations
  User.hasMany(Order, { foreignKey: 'userId' });
  Order.belongsTo(User, { foreignKey: 'userId' });
  // Reviews associations
  Product.hasMany(Review, { foreignKey: 'productId' });
  Review.belongsTo(Product, { foreignKey: 'productId' });
  User.hasMany(Review, { foreignKey: 'userId' });
  Review.belongsTo(User, { foreignKey: 'userId' });

  module.exports = { sequelize, Product, User, Order, Review, Notification };
}

