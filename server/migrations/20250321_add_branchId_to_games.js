'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Games', 'branchId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Branches',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Games', 'branchId');
  }
};
