'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Users', {
      fields: ['branchId'],
      unique: true,
      where: {
        role: 'agent'
      },
      name: 'unique_agent_per_branch'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', 'unique_agent_per_branch');
  }
};
