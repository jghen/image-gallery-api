require("dotenv").config();
const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);

//configure environment
const config = require("../dbconfig/config.js")[process.env.NODE_ENV];

const { database, username, password, host, port, dialect } = config;

const sequelize = new Sequelize(
  database,
  username,
  password,
  { host: host, port: port, dialect: dialect }
);

const db = {};
db.sequelize = sequelize;

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
