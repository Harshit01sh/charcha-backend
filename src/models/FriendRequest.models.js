// models/FriendRequest.js
module.exports = (sequelize, DataTypes) => {
  const FriendRequest = sequelize.define("FriendRequest", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
    },
  }, {
    tableName: "friend_requests",
    timestamps: true,
  });

  


  return FriendRequest;
};
