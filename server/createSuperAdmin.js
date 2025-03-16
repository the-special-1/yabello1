require('dotenv').config();
const { sequelize, User, Branch } = require('./models');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  const t = await sequelize.transaction();
  
  try {
    // Force sync all tables
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');

    // Create superadmin with password '1234'
    const hashedPassword = await bcrypt.hash('1234', 10);
    const superadmin = await User.create({
      username: 'superadmin',
      password: hashedPassword,
      role: 'superadmin',
      status: 'active',
      credits: 1000000 // 1 million initial credits
    }, { transaction: t });

    // Create default branch
    await Branch.create({
      name: 'Main Branch',
      location: 'Headquarters',
      status: 'active',
      createdBy: superadmin.id
    }, { transaction: t });

    await t.commit();
    console.log('Superadmin created successfully');
    console.log('Username: superadmin');
    console.log('Password: 1234');
    process.exit(0);
  } catch (error) {
    await t.rollback();
    console.error('Error creating superadmin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
