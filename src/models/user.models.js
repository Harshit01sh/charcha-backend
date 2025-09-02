const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
}, {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // disable updatedAt if not needed
});

module.exports = User;
