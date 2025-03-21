const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    await queryInterface.bulkInsert('Users', [{
      id: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db', // Fixed UUID for reproducibility
      username: 'superadmin',
      password: hashedPassword,
      role: 'superadmin',
      credits: 999999999.99, // Will be treated as unlimited by the model
      commission: 0.00,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      username: 'superadmin'
    });
  }
};
