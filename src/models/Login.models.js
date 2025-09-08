// models/LoginHistory.js
module.exports = (sequelize, DataTypes) => {
  const Login = sequelize.define("Login", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // name of your User table
        key: "id",
      },
    },
    token: {
      type: DataTypes.STRING(500), // in case JWT is long
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    device: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  }, {
    tableName: "login",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // only store login timestamp
  });

  Login.associate = (models) => {
    Login.belongsTo(models.User, { foreignKey: "userId" });
  };

  return Login;
};
