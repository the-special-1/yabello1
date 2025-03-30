const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'yisak',
  database: process.env.DB_NAME || 'yabello_bingo',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const db = {};

// Only load models we want to keep
const modelsToLoad = ['User.js', 'Branch.js', 'Cartella.js', 'Transaction.js', 'Report.js', 'RoundCounter.js'];

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      modelsToLoad.includes(file)
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
