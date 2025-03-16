require('dotenv').config();
const { sequelize, User, Branch } = require('./models');

async function createAgent() {
  const t = await sequelize.transaction();
  
  try {
    // Find superadmin
    const superadmin = await User.findOne({
      where: { 
        username: 'superadmin',
        role: 'superadmin'
      }
    });

    if (!superadmin) {
      throw new Error('Superadmin not found. Please run initDb.js first.');
    }

    // Find main branch
    const branch = await Branch.findOne({
      where: { name: 'Main Branch' }
    });

    if (!branch) {
      throw new Error('Main Branch not found. Please run initDb.js first.');
    }

    // Create agent
    const agent = await User.create({
      username: 'agent1',
      password: '123456', // Will be automatically hashed by model hooks
      role: 'agent',
      status: 'active',
      credits: 100000,
      commission: 5.00,
      branchId: branch.id,
      createdBy: superadmin.id
    }, { transaction: t });

    await t.commit();
    console.log('Agent created successfully');
    console.log('Agent credentials:');
    console.log('Username: agent1');
    console.log('Password: 123456');

    // Verify the password works
    const user = await User.findOne({ where: { username: 'agent1' } });
    const isValid = await user.validatePassword('123456');
    console.log('Password validation test:', isValid);

    process.exit(0);
  } catch (error) {
    await t.rollback();
    console.error('Error creating agent:', error);
    process.exit(1);
  }
}

createAgent();
