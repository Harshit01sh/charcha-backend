const FriendRequest = require("./FriendRequest.models")
module.exports = (sequelize, DataTypes) => {
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
        image: {
            type: DataTypes.STRING, // store file path or URL
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(250),
            allowNull: true
        },
        mobileNo: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
        },
    }, {
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false, // disable updatedAt if not needed
    });



    return User
}
