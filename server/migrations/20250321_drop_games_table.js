'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First remove the foreign key from Cartellas
    await queryInterface.sequelize.query('ALTER TABLE IF EXISTS "Cartellas" DROP CONSTRAINT IF EXISTS "Cartellas_gameId_fkey";');
    await queryInterface.sequelize.query('ALTER TABLE IF EXISTS "Cartellas" DROP COLUMN IF EXISTS "gameId";');
    
    // Then drop the Games table
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Games" CASCADE;');
    
    // Drop the enum type if it exists
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Games_status";');
  },

  down: async (queryInterface, Sequelize) => {
    // We won't implement down migration since we're removing the feature entirely
  }
};
