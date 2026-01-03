module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    passwordHash: { type: DataTypes.STRING },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpire: { type: DataTypes.BIGINT },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  return User;
};
