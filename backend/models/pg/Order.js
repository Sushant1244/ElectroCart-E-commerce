module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    orderItems: { type: DataTypes.JSONB, defaultValue: [] },
    shippingAddress: { type: DataTypes.JSONB },
    paymentResult: { type: DataTypes.JSONB },
    totalPrice: { type: DataTypes.FLOAT },
    isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
    paidAt: { type: DataTypes.DATE },
  }, {
    tableName: 'orders',
    timestamps: true,
  });

  return Order;
};
