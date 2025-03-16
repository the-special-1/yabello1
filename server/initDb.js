require('dotenv').config();
const { sequelize, User, Branch } = require('./models');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  const t = await sequelize.transaction();
  
  try {
    // Drop all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('Database tables recreated');

    // Create superadmin with raw password (will be hashed by model hooks)
    const superadmin = await User.create({
      username: 'superadmin',
      password: '123456', // Will be automatically hashed by beforeCreate hook
      role: 'superadmin',
      status: 'active',
      credits: 1000000
    }, { transaction: t });

    console.log('Superadmin created with ID:', superadmin.id);

    // Create main branch
    const branch = await Branch.create({
      name: 'Main Branch',
      location: 'Headquarters',
      status: 'active',
      createdBy: superadmin.id
    }, { transaction: t });

    console.log('Main branch created with ID:', branch.id);

    await t.commit();
    console.log('Database initialized successfully');
    console.log('Superadmin credentials:');
    console.log('Username: superadmin');
    console.log('Password: 123456');

    // Verify the password works
    const user = await User.findOne({ where: { username: 'superadmin' } });
    const isValid = await user.validatePassword('123456');
    console.log('Password validation test:', isValid);

    process.exit(0);
  } catch (error) {
    await t.rollback();
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
