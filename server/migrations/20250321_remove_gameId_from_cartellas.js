'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('ALTER TABLE "Cartellas" DROP COLUMN IF EXISTS "gameId";');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Cartellas', 'gameId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Games',
        key: 'id'
      }
    });
  }
};
