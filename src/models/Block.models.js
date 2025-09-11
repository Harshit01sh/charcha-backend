// models/Block.js
module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define(
    "Block",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      blockerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      blockedId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "blocks",
      timestamps: true,
    }
  );

  return Block;
};
