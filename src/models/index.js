const Sequelize = require("sequelize");
const dotenv = require("dotenv");
const UsersModel = require("./user.models");
const LoginModel = require("./Login.models");
const FriendRequestModel = require("./FriendRequest.models");
const BlockUsers = require("./Block.models");


dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_User,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

// Initialize models
const Users = UsersModel(sequelize, Sequelize.DataTypes);
const Login = LoginModel(sequelize, Sequelize.DataTypes);
const FriendRequest = FriendRequestModel(sequelize, Sequelize.DataTypes);
const BlockUser = BlockUsers(sequelize, Sequelize.DataTypes);


// Setup associations
Users.hasMany(FriendRequest, { as: "SentRequests", foreignKey: "senderId" });
Users.hasMany(FriendRequest, { as: "ReceivedRequests", foreignKey: "receiverId" });
FriendRequest.belongsTo(Users, { as: "Sender", foreignKey: "senderId" });
FriendRequest.belongsTo(Users, { as: "Receiver", foreignKey: "receiverId" });
BlockUser.belongsTo(Users, { as: "Blocker", foreignKey: "blockerId" });
BlockUser.belongsTo(Users, { as: "Blocked", foreignKey: "blockedId" });

const db = {
  Sequelize,
  sequelize,
  Users,
  Login,
  FriendRequest,
  BlockUser
};

module.exports = db;
