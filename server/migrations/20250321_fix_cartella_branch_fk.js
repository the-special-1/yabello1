'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop the old constraint if it exists
      await queryInterface.sequelize.query('ALTER TABLE IF EXISTS "Cartellas" DROP CONSTRAINT IF EXISTS "Cartellas_branchId_fkey";');
      
      // Add the new constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE "Cartellas" 
        ADD CONSTRAINT "Cartellas_branchId_fkey" 
        FOREIGN KEY ("branchId") 
        REFERENCES "Branches"(id) 
        ON DELETE CASCADE;
      `);
    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query('ALTER TABLE IF EXISTS "Cartellas" DROP CONSTRAINT IF EXISTS "Cartellas_branchId_fkey";');
    } catch (error) {
      console.error('Migration rollback failed:', error);
    }
  }
};
