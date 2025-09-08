const Sequelize = require("sequelize");
const dotenv = require("dotenv");
const Users = require("./user.models");
const Login = require("./Login.models");
const FriendRequest = require("./FriendRequest.models");


dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

const db = {
  Sequelize: Sequelize,
  sequelize: sequelize,
  Users: Users(sequelize, Sequelize),
  Login : Login(sequelize, Sequelize),
  FriendRequest: FriendRequest(sequelize, Sequelize),

}

module.exports = db;
