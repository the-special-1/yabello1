'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First drop any foreign key constraints that might reference the enum
      await queryInterface.sequelize.query('ALTER TABLE "Cartellas" DROP COLUMN IF EXISTS status;');
      // Then drop the enum type
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_cartellas_status;');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_cartellas_status') THEN
            CREATE TYPE enum_cartellas_status AS ENUM ('available', 'sold', 'playing', 'won', 'lost');
          END IF;
        END
        $$;
      `);
      
      await queryInterface.addColumn('Cartellas', 'status', {
        type: Sequelize.ENUM('available', 'sold', 'playing', 'won', 'lost'),
        defaultValue: 'available'
      });
    } catch (error) {
      console.error('Migration rollback failed:', error);
    }
  }
};
