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

// Initialize database
const initializeDatabase = async () => {
  try {
    // Try connecting to the database
    await sequelize.authenticate();
    console.log('Connected to database successfully');
  } catch (error) {
    if (error.original && error.original.code === '3D000') {
      // Database doesn't exist, create it
      console.log('Database does not exist, creating...');
      const tempConfig = { ...config, database: 'postgres' };
      const tempSequelize = new Sequelize(
        'postgres',
        config.username,
        config.password,
        tempConfig
      );

      try {
        await tempSequelize.query(`CREATE DATABASE ${config.database};`);
        await tempSequelize.close();
        console.log('Database created successfully');

        // Reconnect with the new database
        sequelize = new Sequelize(
          config.database,
          config.username,
          config.password,
          config
        );
      } catch (createError) {
        console.error('Error creating database:', createError);
        throw createError;
      }
    } else {
      throw error;
    }
  }

  // Load models in specific order to handle dependencies
  const modelFiles = fs.readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js'
      );
    })
    .sort((a, b) => {
      // Load Branch model first, then User model, then others
      if (a === 'Branch.js') return -1;
      if (b === 'Branch.js') return 1;
      if (a === 'User.js') return -1;
      if (b === 'User.js') return 1;
      return a.localeCompare(b);
    });

  // Load all models
  modelFiles.forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

  // Set up associations after all models are loaded
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  try {
    // Only sync models, don't recreate schema
    await sequelize.sync({ alter: true });
    console.log('Models synchronized successfully');

    // Check if superadmin exists
    const superadminExists = await db.User.findOne({
      where: { role: 'superadmin' }
    });

    if (!superadminExists) {
      // Create initial branch for superadmin
      const mainBranch = await db.Branch.create({
        name: 'Main Branch',
        location: 'Headquarters',
        status: 'active'
      });
      console.log('Main branch created successfully');

      // Create superadmin
      await db.User.create({
        username: 'superadmin',
        password: '123456',
        role: 'superadmin',
        status: 'active',
        branchId: mainBranch.id
      });
      console.log('Superadmin created successfully');
    } else {
      console.log('Superadmin already exists, skipping initial data creation');
    }
  } catch (error) {
    console.error('Error during model initialization:', error);
    throw error;
  }
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Run initialization
initializeDatabase()
  .then(() => {
    console.log('Database initialization completed successfully');
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
  });

module.exports = db;
