'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Cartellas', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'available'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Cartellas', 'status');
  }
};
